-- Webstudio Expert CRM. Run once in a NEW Supabase project; never disables RLS.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create table public.crm_roles (name text primary key check(name in ('administrator','vertrieb','buchhaltung')));
insert into public.crm_roles values ('administrator'),('vertrieb'),('buchhaltung');
create table public.crm_users (id uuid primary key references auth.users(id) on delete cascade, name text not null, role text not null references public.crm_roles(name), enabled boolean not null default true, created_at timestamptz not null default now());
create function public.crm_role() returns text language sql stable security definer set search_path=public,pg_temp as $$ select role from public.crm_users where id=auth.uid() and enabled $$;
revoke all on function public.crm_role() from public; grant execute on function public.crm_role() to authenticated;
create table public.crm_companies (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 200), industry text default '', website text default '', phone text default '', email text default '', contact_name text default '', street text default '', house_number text default '', postcode text default '', city text default '', country text default 'Deutschland', source text default 'Manuell', priority text default 'normal' check(priority in ('niedrig','normal','hoch')), status text not null default 'Neu' check(status in ('Neu','Kontaktiert','Nicht erreicht','Kein Interesse','Follow-up senden','Follow-up gesendet','Interessiert','Kunde gewonnen','Später kontaktieren')), is_customer boolean not null default false, archived boolean default false, blocked boolean default false, estimated_value numeric(14,2) default 0 check(estimated_value>=0), notes text default '', last_contact timestamptz, next_contact timestamptz, contact_attempts integer default 0, created_by uuid references public.crm_users(id), created_at timestamptz default now(), updated_at timestamptz default now());
create index crm_company_search on public.crm_companies using gin(name gin_trgm_ops);
create unique index crm_company_email_unique on public.crm_companies(lower(email)) where email<>'';
create table public.crm_contacts (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id) on delete cascade, name text not null, position text default '', phone text default '', email text default '', notes text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_contact_permissions (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id) on delete cascade, channel text not null check(channel in ('phone','email','sms')), basis text not null, evidence text not null check(length(evidence)>=10), granted_at timestamptz default now(), withdrawn_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_lead_status_history (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id) on delete cascade, old_status text, new_status text not null, actor_id uuid references public.crm_users(id), created_at timestamptz default now());
create table public.crm_calls (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), user_id uuid references public.crm_users(id), phone text not null, direction text not null default 'outbound' check(direction in ('inbound','outbound')), provider text not null default 'manual', provider_sid text unique, status text default 'documented', started_at timestamptz default now(), ended_at timestamptz, duration integer default 0 check(duration>=0), outcome text default '', notes text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_call_recordings (id uuid primary key default gen_random_uuid(), call_id uuid references public.crm_calls(id), consent_evidence jsonb not null, path text not null, retained_until timestamptz not null, created_at timestamptz default now(), check(jsonb_typeof(consent_evidence)='array' and jsonb_array_length(consent_evidence)>1));
create table public.crm_webhook_events (id uuid primary key default gen_random_uuid(), provider text not null, event_key text not null, created_at timestamptz default now(), unique(provider,event_key));
create table public.crm_email_accounts (id uuid primary key default gen_random_uuid(), name text not null, address text not null unique, last_uid bigint default 0, uid_validity text default '', sync_lease timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_emails (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), account_id uuid references public.crm_email_accounts(id), folder text not null default 'draft' check(folder in ('inbox','sent','draft','archive','sending','unknown','failed')), from_address text default '', to_address text not null, subject text not null, body text not null default '', purpose text not null default 'operational' check(purpose in ('operational','marketing')), message_id text unique, sync_key text unique, send_key uuid unique, sent_at timestamptz, error text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_email_templates (id uuid primary key default gen_random_uuid(), name text not null, subject text not null, body text not null, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_follow_ups (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id), title text not null, due_at timestamptz not null, status text not null default 'Geplant' check(status in ('Geplant','Fällig','E-Mail gesendet','Antwort erhalten','Abgeschlossen')), template_id uuid references public.crm_email_templates(id), email_id uuid references public.crm_emails(id), notes text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_projects (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id), name text not null, description text default '', status text not null default 'Geplant' check(status in ('Geplant','In Arbeit','Wartet auf Kunden','Abnahme','Abgeschlossen')), starts_on date, due_on date, budget numeric(14,2) default 0 check(budget>=0), created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_tasks (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), project_id uuid references public.crm_projects(id), title text not null, description text default '', priority text default 'normal' check(priority in ('niedrig','normal','hoch')), status text default 'Offen' check(status in ('Offen','In Arbeit','Erledigt')), due_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_project_tasks (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.crm_projects(id) on delete cascade, title text not null, kind text default 'task' check(kind in ('task','checklist','milestone')), done boolean default false, due_on date, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_time_entries (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.crm_projects(id), user_id uuid references public.crm_users(id), description text not null, minutes integer not null check(minutes>0), hourly_rate numeric(12,2) not null default 0 check(hourly_rate>=0), worked_on date not null default (now() at time zone 'Europe/Berlin')::date, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_calendar_events (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), project_id uuid references public.crm_projects(id), title text not null, starts_at timestamptz not null, ends_at timestamptz not null, status text default 'Geplant' check(status in ('Angefragt','Geplant','Bestätigt','Abgesagt','Erledigt')), kind text default 'Termin', recurrence text default '' check(recurrence in ('','weekly','monthly')), notes text default '', created_at timestamptz default now(), updated_at timestamptz default now(), check(ends_at>starts_at));
create table public.crm_company_settings (id uuid primary key default gen_random_uuid(), key text not null unique, data jsonb not null default '{}', created_at timestamptz default now(), updated_at timestamptz default now());
insert into public.crm_company_settings(key,data) values ('business','{"name":"Webstudio Expert","owner":"Enrico Gross","street":"Karinstraße 5","postcode":"44388","city":"Dortmund","email":"kontakt@webstudio-expert.de","phone":"+49 155 67504871","smallBusiness":true,"taxNumber":"","vatId":"","iban":"","paymentDays":14,"signature":"Enrico Gross\nWebstudio Expert\nkontakt@webstudio-expert.de\n+49 155 67504871"}');
create table public.crm_number_counters (kind text not null, year integer not null, value integer not null default 0, primary key(kind,year));
create table public.crm_quotes (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id), number text unique, version integer not null default 1, previous_id uuid references public.crm_quotes(id), title text not null, status text default 'Entwurf' check(status in ('Entwurf','Ausgestellt','Versendet','Angenommen','Abgelehnt','Abgelaufen')), valid_until date, service_date date, terms text default 'Zahlung nach Vereinbarung', discount numeric(5,2) default 0 check(discount between 0 and 100), total numeric(14,2) not null default 0, snapshot jsonb, issued_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_quote_items (id uuid primary key default gen_random_uuid(), quote_id uuid not null references public.crm_quotes(id) on delete cascade, description text not null, quantity numeric(12,3) not null default 1 check(quantity>0), unit_price numeric(14,2) not null check(unit_price>=0), tax_rate numeric(5,2) default 0 check(tax_rate between 0 and 100), position integer default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_invoices (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id), quote_id uuid references public.crm_quotes(id), original_id uuid references public.crm_invoices(id), number text unique, title text not null, document_status text default 'Entwurf' check(document_status in ('Entwurf','Ausgestellt','Storniert')), payment_status text default 'Offen' check(payment_status in ('Offen','Teilweise bezahlt','Bezahlt','Überfällig')), kind text default 'Rechnung' check(kind in ('Rechnung','Anzahlung','Schlussrechnung','Storno','Korrektur')), service_date date, due_on date, discount numeric(5,2) default 0 check(discount between 0 and 100), total numeric(14,2) not null default 0, deducted numeric(14,2) not null default 0, snapshot jsonb, issued_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_invoice_items (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.crm_invoices(id) on delete cascade, description text not null, quantity numeric(12,3) not null default 1 check(quantity>0), unit_price numeric(14,2) not null check(unit_price>=0), tax_rate numeric(5,2) default 0 check(tax_rate between 0 and 100), position integer default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_payments (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.crm_invoices(id), amount numeric(14,2) not null check(amount>0), paid_on date not null default (now() at time zone 'Europe/Berlin')::date, reference text default '', created_at timestamptz default now());
create table public.crm_invoice_deductions (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.crm_invoices(id), advance_id uuid not null references public.crm_invoices(id), unique(invoice_id,advance_id), unique(advance_id), check(invoice_id<>advance_id));
create table public.crm_recurring_invoices (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.crm_invoices(id), next_on date not null, interval_months integer default 1 check(interval_months>0), enabled boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_contracts (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id), project_id uuid references public.crm_projects(id), title text not null, starts_on date, ends_on date, notes text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_documents (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), project_id uuid references public.crm_projects(id), quote_id uuid references public.crm_quotes(id), invoice_id uuid references public.crm_invoices(id), name text not null, category text default 'Allgemein', path text not null unique, mime text not null, size bigint not null check(size>=0), immutable boolean default false, retained_until date, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_notifications (id uuid primary key default gen_random_uuid(), user_id uuid references public.crm_users(id), title text not null, href text not null default '/crm', event_key text unique, read_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_integrations (id uuid primary key default gen_random_uuid(), provider text not null unique, enabled boolean default false, encrypted_config text, config jsonb default '{}', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_workflows (id uuid primary key default gen_random_uuid(), name text not null, trigger text not null check(trigger in ('lead.created','quote.issued','quote.sent','quote.accepted','scheduled')), action text not null check(action in ('task','notification','convert')), enabled boolean default true, config jsonb default '{}', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_workflow_runs (id uuid primary key default gen_random_uuid(), workflow_id uuid references public.crm_workflows(id), event_key text not null, created_at timestamptz default now(), unique(workflow_id,event_key));
create table public.crm_audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid, entity text not null, entity_id uuid, action text not null, before_data jsonb, after_data jsonb, created_at timestamptz default now());
create table public.crm_website_inquiries (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), request_key text not null unique, data jsonb not null, created_at timestamptz default now());
create table public.crm_job_runs (key text primary key, lease_until timestamptz not null, last_success timestamptz);

-- RLS: only provisioned, enabled staff. Private credentials never exposed through RLS.
do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='public' and tablename like 'crm_%' loop
  execute format('alter table public.%I enable row level security',t);
  if t not in ('crm_integrations','crm_number_counters','crm_webhook_events','crm_job_runs','crm_workflow_runs') then
   execute format('create policy staff_read on public.%I for select to authenticated using(public.crm_role() is not null)',t);
  end if;
  if t in ('crm_company_settings','crm_workflows','crm_email_accounts','crm_recurring_invoices') then
   execute format('create policy admin_write on public.%I for all to authenticated using(public.crm_role()=''administrator'') with check(public.crm_role()=''administrator'')',t);
  elsif t in ('crm_invoices','crm_invoice_items','crm_payments','crm_invoice_deductions') then
   execute format('create policy accounting_write on public.%I for all to authenticated using(public.crm_role() in (''administrator'',''buchhaltung'')) with check(public.crm_role() in (''administrator'',''buchhaltung''))',t);
  elsif t not in ('crm_users','crm_roles','crm_integrations','crm_number_counters','crm_webhook_events','crm_job_runs','crm_workflow_runs','crm_audit_logs','crm_lead_status_history','crm_call_recordings','crm_website_inquiries') then
   execute format('create policy staff_write on public.%I for all to authenticated using(public.crm_role() in (''administrator'',''vertrieb'')) with check(public.crm_role() in (''administrator'',''vertrieb''))',t);
  end if;
 end loop;
end $$;
-- Read accounting data only for accounting/admin. Sales can access quotes.
do $$ declare t text; begin
 foreach t in array array['crm_invoices','crm_invoice_items','crm_payments','crm_invoice_deductions','crm_audit_logs','crm_company_settings'] loop
  execute format('drop policy staff_read on public.%I',t);
  execute format('create policy restricted_read on public.%I for select to authenticated using(public.crm_role() in (''administrator'',''buchhaltung''))',t);
 end loop;
end $$;

create function public.crm_audit() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ begin
 insert into crm_audit_logs(actor_id,entity,entity_id,action,before_data,after_data) values(auth.uid(),tg_table_name,coalesce(new.id,old.id),tg_op,case when tg_op<>'INSERT' then to_jsonb(old) end,case when tg_op<>'DELETE' then to_jsonb(new) end);
 if tg_table_name='crm_companies' and tg_op='UPDATE' and new.status is distinct from old.status then insert into crm_lead_status_history(company_id,old_status,new_status,actor_id) values(new.id,old.status,new.status,auth.uid()); end if;
 return coalesce(new,old); end $$;
create function public.crm_touch() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin
 foreach t in array array['crm_companies','crm_contacts','crm_contact_permissions','crm_calls','crm_emails','crm_follow_ups','crm_projects','crm_tasks','crm_calendar_events','crm_quotes','crm_invoices','crm_payments','crm_documents','crm_company_settings','crm_contracts'] loop
  execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.crm_audit()',t);
 end loop;
 for t in select table_name from information_schema.columns where table_schema='public' and table_name like 'crm_%' and column_name='updated_at' loop
  execute format('create trigger touch before update on public.%I for each row execute function public.crm_touch()',t);
 end loop;
end $$;
create function public.crm_protect_document() returns trigger language plpgsql as $$ begin
 if (to_jsonb(old)->>'issued_at') is not null and current_setting('crm.issuing',true) is distinct from 'on' then
  if tg_op='DELETE' or (to_jsonb(new)-'updated_at'-'status'-'payment_status'-'document_status') is distinct from (to_jsonb(old)-'updated_at'-'status'-'payment_status'-'document_status') then raise exception 'Ausgestellte Dokumente sind unveränderlich. Neue Version oder Storno verwenden.'; end if;
 end if;
 return coalesce(new,old); end $$;
create trigger protect before update or delete on public.crm_quotes for each row execute function public.crm_protect_document();
create trigger protect before update or delete on public.crm_invoices for each row execute function public.crm_protect_document();
create function public.crm_protect_item() returns trigger language plpgsql as $$ declare issued timestamptz; begin
 if tg_table_name='crm_quote_items' then select issued_at into issued from crm_quotes where id=coalesce(new.quote_id,old.quote_id); else select issued_at into issued from crm_invoices where id=coalesce(new.invoice_id,old.invoice_id); end if;
 if issued is not null then raise exception 'Positionen eines ausgestellten Dokuments sind unveränderlich.'; end if; return coalesce(new,old); end $$;
create trigger protect before insert or update or delete on public.crm_quote_items for each row execute function public.crm_protect_item();
create trigger protect before insert or update or delete on public.crm_invoice_items for each row execute function public.crm_protect_item();
create function public.crm_payment_state() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ declare iid uuid; paid numeric; due numeric; begin
 iid=coalesce(new.invoice_id,old.invoice_id); select coalesce(sum(amount),0) into paid from crm_payments where invoice_id=iid; select total into due from crm_invoices where id=iid;
 update crm_invoices set payment_status=case when paid>=due then 'Bezahlt' when paid>0 then 'Teilweise bezahlt' else 'Offen' end where id=iid; return coalesce(new,old); end $$;
create trigger payment_state after insert or update or delete on public.crm_payments for each row execute function public.crm_payment_state();

-- Issuance is atomic. Numeric calculations, locked counters, frozen business/customer/items.
create function public.crm_issue(doc_kind text, doc_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare doc jsonb; biz jsonb; customer jsonb; lines jsonb; amount numeric; deduction numeric=0; yr integer=extract(year from (now() at time zone 'Europe/Berlin')::date); num integer; doc_number text; frozen jsonb; adv record;
begin
 if public.crm_role() is null or public.crm_role() not in ('administrator','buchhaltung') and not(doc_kind='quote' and public.crm_role()='vertrieb') then raise exception 'Kein Zugriff'; end if;
 select data into biz from crm_company_settings where key='business';
 if doc_kind='invoice' and coalesce(biz->>'taxNumber','')='' and coalesce(biz->>'vatId','')='' then raise exception 'Steuernummer oder USt-ID in den CRM-Einstellungen fehlt.'; end if;
 if doc_kind='quote' then
  select to_jsonb(q) into doc from crm_quotes q where id=doc_id for update;
  select jsonb_agg(to_jsonb(i) order by position,created_at),sum(round(quantity*unit_price*(1-coalesce((doc->>'discount')::numeric,0)/100)*(1+case when (biz->>'smallBusiness')::boolean then 0 else tax_rate/100 end),2)) into lines,amount from crm_quote_items i where quote_id=doc_id;
 elsif doc_kind='invoice' then
  select to_jsonb(i) into doc from crm_invoices i where id=doc_id for update;
  select jsonb_agg(to_jsonb(i) order by position,created_at),sum(round(quantity*unit_price*(1-coalesce((doc->>'discount')::numeric,0)/100)*(1+case when (biz->>'smallBusiness')::boolean then 0 else tax_rate/100 end),2)) into lines,amount from crm_invoice_items i where invoice_id=doc_id;
 else raise exception 'Ungültiger Dokumenttyp'; end if;
 if doc is null or doc->>'issued_at' is not null or lines is null then raise exception 'Dokument fehlt, ist bereits ausgestellt oder hat keine Positionen.'; end if;
 if doc_kind='invoice' and doc->>'service_date' is null then raise exception 'Leistungsdatum fehlt.'; end if;
 select to_jsonb(c) into customer from crm_companies c where id=(doc->>'company_id')::uuid;
 if coalesce(customer->>'street','')='' or coalesce(customer->>'postcode','')='' or coalesce(customer->>'city','')='' then raise exception 'Vollständige Kundenanschrift fehlt.'; end if;
 if doc_kind='invoice' and doc->>'kind'='Schlussrechnung' then
  for adv in select i.* from crm_invoice_deductions d join crm_invoices i on i.id=d.advance_id where d.invoice_id=doc_id for update of i loop
   if adv.company_id<>(doc->>'company_id')::uuid or adv.kind<>'Anzahlung' or adv.issued_at is null or adv.document_status='Storniert' then raise exception 'Ungültige Anzahlungsverrechnung'; end if;
   deduction=deduction+(select coalesce(sum(p.amount),0) from crm_payments p where invoice_id=adv.id);
  end loop;
  if deduction>amount then raise exception 'Anzahlungen übersteigen die Schlussrechnung'; end if;
 end if;
 insert into crm_number_counters(kind,year,value) values(doc_kind,yr,1) on conflict(kind,year) do update set value=crm_number_counters.value+1 returning value into num;
 doc_number=(case when doc_kind='quote' then 'ANG' else 'RE' end)||'-'||yr||'-'||lpad(num::text,5,'0');
 frozen=jsonb_build_object('business',biz,'customer',customer,'items',lines,'document',doc,'number',doc_number,'date',(now() at time zone 'Europe/Berlin')::date,'subtotal',amount,'deducted',deduction,'total',amount-deduction);
 perform set_config('crm.issuing','on',true);
 if doc_kind='quote' then update crm_quotes set snapshot=frozen,number=doc_number,total=amount,issued_at=now(),status='Ausgestellt' where id=doc_id; else update crm_invoices set snapshot=frozen,number=doc_number,total=amount-deduction,deducted=deduction,issued_at=now(),document_status='Ausgestellt' where id=doc_id; end if;
 if doc_kind='invoice' then select snapshot into frozen from crm_invoices where id=doc_id; end if; return frozen;
end $$;
revoke all on function public.crm_issue(text,uuid) from public; grant execute on function public.crm_issue(text,uuid) to authenticated;

create function public.crm_ingest_inquiry(request_key_in text, payload jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$ declare cid uuid; rid uuid; v_email text=lower(payload->>'email'); begin
 select company_id into cid from crm_website_inquiries where request_key=request_key_in; if cid is not null then return cid; end if;
 insert into crm_companies(name,email,phone,contact_name,source,notes) values(coalesce(nullif(payload->>'company',''),payload->>'name'),v_email,coalesce(payload->>'phone',''),payload->>'name','Website',payload->>'description') on conflict(lower(email)) where email<>'' do update set updated_at=now() returning id into cid;
 insert into crm_website_inquiries(company_id,request_key,data) values(cid,request_key_in,payload);
 insert into crm_tasks(company_id,title,description,due_at) values(cid,'Website-Anfrage beantworten',payload->>'description',now());
 insert into crm_notifications(title,href,event_key) values('Neue Website-Anfrage','/crm/leads/'||cid,'inquiry:'||request_key_in) on conflict(event_key) do nothing;
 if payload->>'mode'='appointment' then
  insert into crm_calendar_events(company_id,title,starts_at,ends_at,status,notes) values(cid,'Terminwunsch: '||(payload->>'name'),(payload->>'appointment')::timestamp at time zone 'Europe/Berlin',((payload->>'appointment')::timestamp at time zone 'Europe/Berlin')+interval '30 minutes','Angefragt',payload->>'description');
 end if;
 return cid;
end $$;
revoke all on function public.crm_ingest_inquiry(text,jsonb) from public,anon,authenticated; grant execute on function public.crm_ingest_inquiry(text,jsonb) to service_role;

create function public.crm_lease(job_key text, seconds integer) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$ declare claimed text; begin
 insert into crm_job_runs(key,lease_until) values(job_key,now()+make_interval(secs=>seconds)) on conflict(key) do update set lease_until=excluded.lease_until where crm_job_runs.lease_until<now() returning key into claimed; return claimed is not null; end $$;
revoke all on function public.crm_lease(text,integer) from public,anon,authenticated; grant execute on function public.crm_lease(text,integer) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('crm-private','crm-private',false,10000000,array['application/pdf','image/png','image/jpeg','text/plain','application/xml','text/xml','message/rfc822']);
create policy crm_storage_read on storage.objects for select to authenticated using(bucket_id='crm-private' and public.crm_role() is not null);
-- Writes only through validated server endpoints. No browser upload or public links.
alter publication supabase_realtime add table public.crm_companies,public.crm_tasks,public.crm_notifications,public.crm_calendar_events,public.crm_calls,public.crm_emails;
create index crm_tasks_due on public.crm_tasks(due_at) where status<>'Erledigt';
create index crm_follow_due on public.crm_follow_ups(due_at) where status<>'Abgeschlossen';
create index crm_invoices_due on public.crm_invoices(due_on) where document_status='Ausgestellt';
create index crm_contacts_company on public.crm_contacts(company_id);
create index crm_calls_company on public.crm_calls(company_id,started_at desc);
create index crm_emails_company on public.crm_emails(company_id,created_at desc);
