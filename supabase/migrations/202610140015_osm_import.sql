-- Existing CRM: run ONLY this migration once. No second lead table is created.
begin;
set local search_path=public,extensions,pg_temp;
create extension if not exists fuzzystrmatch with schema extensions;
create function public.crm_phone_key(value text) returns text language plpgsql immutable set search_path=public,pg_temp as $$
declare digits text;
begin
 value=regexp_replace(trim(split_part(coalesce(value,''),';',1)),'^(\+49|0049)\s*\(0\)','\1');
 digits=regexp_replace(value,'[^0-9]','','g');
 if length(digits)<7 or length(digits)>18 then return ''; end if;
 if left(digits,2)='00' then digits=substring(digits from 3);
 elsif left(digits,1)='0' then digits='49'||substring(digits from 2); end if;
 if left(digits,3)='490' then digits='49'||substring(digits from 4); end if;
 return digits;
end $$;
create function public.crm_name_key(value text) returns text language sql immutable set search_path=public,pg_temp as $$
 with normalized as (select trim(regexp_replace(lower(replace(replace(replace(replace(lower(coalesce(value,'')),'ä','ae'),'ö','oe'),'ü','ue'),'ß','ss')),'[^a-z0-9]+',' ','g')) name),
 cleaned as (select name,trim(regexp_replace(name,'\m(gmbh|ug|ag|kg|ohg|gbr|mbh|haftungsbeschraenkt)\M','','g')) stripped from normalized)
 select coalesce((select string_agg(token,' ' order by token) from regexp_split_to_table(case when stripped='' then name else stripped end,'\s+') token where token<>''),'') from cleaned;
$$;
create index crm_company_phone_key on public.crm_companies(public.crm_phone_key(phone));
create index crm_contact_phone_key on public.crm_contacts(public.crm_phone_key(phone));
create index crm_company_name_key on public.crm_companies using gin(public.crm_name_key(name) gin_trgm_ops);
create index crm_company_email_key on public.crm_companies(lower(trim(email)));
create index crm_contact_email_key on public.crm_contacts(lower(trim(email)));

-- All company/contact writes take the same transaction lock as the final import.
-- Existing legacy duplicates remain untouched; new identical contacts are blocked.
create function public.crm_import_contact_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare pk text=public.crm_phone_key(new.phone); ek text=lower(trim(coalesce(new.email,''))); owner_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('crm-company-import',0));
 if tg_table_name='crm_companies' then owner_id=new.id;else owner_id=new.company_id;end if;
 if pk<>'' and (tg_op='INSERT' or pk is distinct from public.crm_phone_key(old.phone)) then
  if exists(select 1 from crm_companies where id<>owner_id and public.crm_phone_key(phone)=pk)
   or exists(select 1 from crm_contacts where company_id<>owner_id and public.crm_phone_key(phone)=pk) then raise exception 'Telefonnummer bereits einem bestehenden Unternehmen zugeordnet'; end if;
 end if;
 if ek<>'' and (tg_op='INSERT' or ek is distinct from lower(trim(coalesce(old.email,'')))) then
  if exists(select 1 from crm_companies where id<>owner_id and lower(trim(email))=ek)
   or exists(select 1 from crm_contacts where company_id<>owner_id and lower(trim(email))=ek) then raise exception 'E-Mail-Adresse bereits einem bestehenden Unternehmen zugeordnet'; end if;
 end if;
 return new;
end $$;
create trigger import_contact_guard before insert or update of name,phone,email on public.crm_companies for each row execute function public.crm_import_contact_guard();
create trigger import_contact_guard before insert or update of phone,email on public.crm_contacts for each row execute function public.crm_import_contact_guard();

-- One classifier is used by preview and final import. Region-free name matches
-- are held for review, never silently merged or used to overwrite a company.
create function public.crm_osm_classify(rows_in jsonb,postcode_in text) returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp set pg_trgm.similarity_threshold='0.4' as $$
declare result jsonb='[]'; prior jsonb='[]'; item jsonb; earlier jsonb; c crm_companies; state text; reason text; nk text; pk text; ek text; n integer=0; matching jsonb;
begin
 if jsonb_typeof(rows_in)<>'array' or jsonb_array_length(rows_in)>200 then raise exception 'Maximal 200 Ergebnisse'; end if;
 for item in select value from jsonb_array_elements(rows_in) loop
  state='new';reason='Neues Unternehmen';matching=null;nk=public.crm_name_key(item->>'name');pk=public.crm_phone_key(item->>'phone');ek=lower(trim(coalesce(item->>'email','')));
  select * into c from crm_companies company where company.id in (
   select id from crm_companies where (pk<>'' and public.crm_phone_key(phone)=pk) or (ek<>'' and lower(trim(email))=ek)
   union select company_id from crm_contacts where (pk<>'' and public.crm_phone_key(phone)=pk) or (ek<>'' and lower(trim(email))=ek))
   order by company.id limit 1;
  if c.id is not null then state='duplicate';reason='Telefon oder E-Mail bereits im CRM';
  else
   select * into c from crm_companies company where public.crm_name_key(company.name)=nk and nk<>'' order by (coalesce(company.postcode,'')=postcode_in) desc,company.id limit 1;
   if c.id is not null then
    if coalesce(c.postcode,'')=postcode_in and length(nk)>=6 and not
     ((pk<>'' and public.crm_phone_key(c.phone)<>'' and pk<>public.crm_phone_key(c.phone)) or (ek<>'' and coalesce(c.email,'')<>'' and ek<>lower(trim(c.email)))) then state='duplicate';reason='Gleicher Firmenname in derselben PLZ';
    else state='review';reason='Gleicher Firmenname im CRM; Region oder Identität nicht eindeutig';end if;
   else
    select * into c from crm_companies company where length(nk)>=6 and length(public.crm_name_key(company.name))>=6 and public.crm_name_key(company.name) % nk and
     (similarity(public.crm_name_key(company.name),nk)>=0.72 or
      (length(nk)<=255 and length(public.crm_name_key(company.name))<=255 and abs(length(nk)-length(public.crm_name_key(company.name)))<=2 and levenshtein_less_equal(left(public.crm_name_key(company.name),255),left(nk,255),2)<=2))
     order by similarity(public.crm_name_key(company.name),nk) desc,company.id limit 1;
    if c.id is not null then state='review';reason='Ähnlicher Firmenname im CRM: manuell prüfen';end if;
   end if;
  end if;
  if c.id is not null then matching=jsonb_build_object('id',c.id,'name',c.name,'phone',c.phone,'email',c.email,'industry',c.industry);end if;
  if state<>'duplicate' then
   for earlier in select value from jsonb_array_elements(prior) loop
    if (pk<>'' and pk=public.crm_phone_key(earlier->>'phone')) or (ek<>'' and ek=lower(trim(earlier->>'email'))) then
     state='duplicate';reason='Doppelt innerhalb dieser Suche';matching=earlier;exit;
    elsif nk<>'' and nk=public.crm_name_key(earlier->>'name') then
     if (pk<>'' and public.crm_phone_key(earlier->>'phone')<>'' and pk<>public.crm_phone_key(earlier->>'phone')) or (ek<>'' and coalesce(earlier->>'email','')<>'' and ek<>lower(trim(earlier->>'email'))) then
      state='review';reason='Gleicher Name, abweichende Kontakte: manuell prüfen';matching=earlier;
     else state='duplicate';reason='Doppelt innerhalb dieser Suche';matching=earlier;exit;end if;
    elsif state='new' and length(nk)>=6 and length(public.crm_name_key(earlier->>'name'))>=6 and
     (similarity(nk,public.crm_name_key(earlier->>'name'))>=0.72 or
      (length(nk)<=255 and length(public.crm_name_key(earlier->>'name'))<=255 and abs(length(nk)-length(public.crm_name_key(earlier->>'name')))<=2 and levenshtein_less_equal(left(nk,255),left(public.crm_name_key(earlier->>'name'),255),2)<=2)) then
     state='review';reason='Ähnlicher Firmenname innerhalb dieser Suche: manuell prüfen';matching=earlier;
    end if;
   end loop;
  end if;
  result=result||jsonb_build_array(jsonb_build_object('index',n,'name',item->>'name','phone',coalesce(item->>'phone',''),'email',coalesce(item->>'email',''),'industry',item->>'industry','state',state,'reason',reason,'match',matching));
  prior=prior||jsonb_build_array(item);n=n+1;
 end loop;
 return result;
end $$;
revoke all on function public.crm_osm_classify(jsonb,text) from public,anon,authenticated;grant execute on function public.crm_osm_classify(jsonb,text) to service_role;

create function public.crm_osm_import(rows_in jsonb,postcode_in text,selected_in integer[],reviewed_in integer[],actor_in uuid,batch_in uuid) returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare classified jsonb; item jsonb; created integer=0; duplicates integer=0; held integer=0; lead_id uuid; outcomes jsonb='[]'; row_index integer; row_error text; claimed uuid;
begin
 if not exists(select 1 from crm_users where id=actor_in and enabled and role in ('administrator','vertrieb')) then raise exception 'Kein Zugriff';end if;
 if jsonb_typeof(rows_in)<>'array' or jsonb_array_length(rows_in)>200 then raise exception 'Maximal 200 Ergebnisse';end if;
 perform pg_advisory_xact_lock(hashtextextended('crm-company-import',0));
 insert into crm_webhook_events(provider,event_key) values('osm-import',actor_in::text||':'||batch_in::text) on conflict do nothing returning id into claimed;
 if claimed is null then return jsonb_build_object('alreadyImported',true,'created',0,'duplicates',0,'held',0,'outcomes','[]'::jsonb);end if;
 classified=public.crm_osm_classify(rows_in,postcode_in);
 for item in select value from jsonb_array_elements(classified) loop
  row_index=(item->>'index')::integer;
  if not(row_index=any(selected_in)) then continue;end if;
  if item->>'state'='duplicate' then duplicates=duplicates+1;outcomes=outcomes||jsonb_build_array(jsonb_build_object('index',row_index,'state','duplicate','reason',item->>'reason'));continue;end if;
  if item->>'state'='review' and not(row_index=any(reviewed_in)) then held=held+1;outcomes=outcomes||jsonb_build_array(jsonb_build_object('index',row_index,'state','review','reason',item->>'reason'));continue;end if;
  begin
   if length(trim(item->>'name')) not between 1 and 200 or length(coalesce(item->>'phone',''))>80 or length(coalesce(item->>'email',''))>254 or length(item->>'industry') not between 1 and 100 then raise exception 'Ungültige Unternehmensdaten';end if;
   insert into crm_companies(name,phone,email,industry,status) values(trim(item->>'name'),coalesce(item->>'phone',''),lower(trim(coalesce(item->>'email',''))),item->>'industry','Neu') returning id into lead_id;
   insert into crm_audit_logs(actor_id,entity,entity_id,action,after_data) values(actor_in,'crm_companies',lead_id,'osm.import',jsonb_build_object('name',item->>'name','phone',item->>'phone','email',item->>'email','industry',item->>'industry'));
   created=created+1;outcomes=outcomes||jsonb_build_array(jsonb_build_object('index',row_index,'state','imported','id',lead_id));
  exception when unique_violation then
   duplicates=duplicates+1;outcomes=outcomes||jsonb_build_array(jsonb_build_object('index',row_index,'state','duplicate','reason','Zwischenzeitlich bereits vorhanden'));
  when others then
   get stacked diagnostics row_error=message_text;
   outcomes=outcomes||jsonb_build_array(jsonb_build_object('index',row_index,'state','error','reason',left(row_error,200)));
  end;
 end loop;
 return jsonb_build_object('created',created,'duplicates',duplicates,'held',held,'outcomes',outcomes);
end $$;
revoke all on function public.crm_osm_import(jsonb,text,integer[],integer[],uuid,uuid) from public,anon,authenticated;grant execute on function public.crm_osm_import(jsonb,text,integer[],integer[],uuid,uuid) to service_role;
commit;
