-- Existing Webstudio CRM required. No existing CRM leads are changed.
begin;
create table public.crm_lead_shop_settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 recipient text not null default '', iban text not null default '', updated_at timestamptz default now()
);
insert into public.crm_lead_shop_settings(id) values(true);
create table public.crm_lead_shop_batches (
 id uuid primary key, source text not null, rights_confirmed_by uuid not null references public.crm_users(id),
 verified_at date not null, created_at timestamptz default now()
);
create sequence public.crm_lead_order_number;
create table public.crm_lead_orders (
 id uuid primary key default gen_random_uuid(), request_key uuid not null unique, request_hash text not null,
 reference text not null unique default ('LEAD-'||lpad(nextval('public.crm_lead_order_number')::text,8,'0')),
 package text not null check(package in ('Standard','Enterprise')),
 quantity integer not null check(quantity between 500 and 5000 and quantity%500=0),
 total_cents integer not null check(total_cents>0), customer jsonb not null, bank jsonb not null,
 terms_version text not null, terms text not null,
 status text not null default 'Zahlung ausstehend' check(status in ('Zahlung ausstehend','Bezahlt','Bereitgestellt','Storniert','Abgelaufen')),
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '14 days',
 paid_at timestamptz, paid_by uuid references public.crm_users(id), payment_reference text unique,
 payment_cents integer, internal_notes text not null default '',
 file_path text, file_sha256 text, ready_at timestamptz,
 token_hash text, token_version integer not null default 1, token_expires_at timestamptz,
 revoked boolean not null default false,
 fulfillment_state text not null default 'pending' check(fulfillment_state in ('pending','processing','done','failed')),
 claim_id uuid, claimed_at timestamptz, error text not null default '',
 check(package<>'Standard' or quantity=500)
);
create table public.crm_lead_catalog (
 id bigint generated always as identity primary key, batch_id uuid not null references public.crm_lead_shop_batches(id),
 name text not null check(length(name) between 2 and 200), phone text not null check(length(phone) between 7 and 60),
 phone_key text not null unique, email text not null unique, website text not null,
 company_key text not null unique, active boolean not null default true,
 reserved_order uuid references public.crm_lead_orders(id), sold_order uuid references public.crm_lead_orders(id),
 created_at timestamptz default now()
);
create index crm_lead_stock on public.crm_lead_catalog(id) where active and reserved_order is null and sold_order is null;
create index crm_lead_reservations on public.crm_lead_catalog(reserved_order) where reserved_order is not null;
create function public.crm_import_sale_leads(batch_in uuid,source_in text,date_in date,actor_in uuid,rows_in jsonb) returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare inserted integer;
begin
 if jsonb_typeof(rows_in)<>'array' or jsonb_array_length(rows_in)>1000 or date_in>current_date or length(source_in)<5 then raise exception 'Import ungültig';end if;
 insert into crm_lead_shop_batches(id,source,rights_confirmed_by,verified_at) values(batch_in,source_in,actor_in,date_in) on conflict do nothing;
 insert into crm_lead_catalog(batch_id,name,phone,phone_key,email,website,company_key)
 select batch_in,r.name,r.phone,r.phone_key,r.email,r.website,r.company_key from jsonb_to_recordset(rows_in) as r(name text,phone text,phone_key text,email text,website text,company_key text) on conflict do nothing;
 get diagnostics inserted=row_count;
 return inserted;
end $$;
create table public.crm_lead_order_items (
 order_id uuid not null references public.crm_lead_orders(id), lead_id bigint not null references public.crm_lead_catalog(id),
 name text not null, phone text not null, email text not null, website text not null, primary key(order_id,lead_id)
);
create table public.crm_lead_shop_events (
 id bigint generated always as identity primary key, order_id uuid references public.crm_lead_orders(id),
 actor_id uuid references public.crm_users(id), action text not null, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.crm_lead_shop_mail (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.crm_lead_orders(id),
 kind text not null check(kind in ('confirmation','download')), unique(order_id,kind),
 status text not null default 'pending' check(status in ('pending','sending','sent','unknown')),
 claim_id uuid, claimed_at timestamptz, sent_at timestamptz, error text not null default '',
 subject text, body text, message_id text
);
create table public.crm_lead_shop_automation (
 id boolean primary key default true check(id), last_tick timestamptz, worker_seen timestamptz, payment_reminded_at timestamptz
);
insert into public.crm_lead_shop_automation(id) values(true);

-- All access is through server endpoints with explicit CRM role checks.
do $$ declare t text; begin
 foreach t in array array['crm_lead_shop_settings','crm_lead_shop_batches','crm_lead_orders','crm_lead_catalog','crm_lead_order_items','crm_lead_shop_events','crm_lead_shop_mail','crm_lead_shop_automation'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant usage,select on sequence public.crm_lead_catalog_id_seq,public.crm_lead_shop_events_id_seq,public.crm_lead_order_number to service_role;
revoke all on function public.crm_import_sale_leads(uuid,text,date,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.crm_import_sale_leads(uuid,text,date,uuid,jsonb) to service_role;

create function public.crm_lead_price(n integer) returns integer language sql immutable set search_path=public,pg_temp as $$
 select case n when 500 then 14900 when 1000 then 26900 when 1500 then 38900 when 2000 then 49900 when 2500 then 59900 when 3000 then 69900 when 3500 then 78900 when 4000 then 87900 when 4500 then 93900 when 5000 then 99900 else null end;
$$;
create function public.crm_expire_lead_orders() returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare row crm_lead_orders;
begin
 perform pg_advisory_xact_lock(hashtextextended('lead-shop-stock',0));
 for row in select * from crm_lead_orders where status='Zahlung ausstehend' and expires_at<now() for update loop
  update crm_lead_orders set status='Abgelaufen' where id=row.id;
  update crm_lead_catalog set reserved_order=null where reserved_order=row.id and sold_order is null;
  insert into crm_lead_shop_events(order_id,action) values(row.id,'reservation.expired');
 end loop;
end $$;
create function public.crm_create_lead_order(request_in uuid,hash_in text,package_in text,quantity_in integer,quoted_in integer,customer_in jsonb,version_in text,terms_in text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare cfg crm_lead_shop_settings; row crm_lead_orders; ids bigint[]; amount integer=crm_lead_price(quantity_in);
begin
 perform pg_advisory_xact_lock(hashtextextended('lead-shop-stock',0));
 select * into row from crm_lead_orders where request_key=request_in;
 if found then
  if row.request_hash<>hash_in then raise exception 'Bestellschlüssel bereits für andere Angaben verwendet';end if;
  return to_jsonb(row);
 end if;
 perform crm_expire_lead_orders();
 select * into cfg from crm_lead_shop_settings where id for share;
 if not found or not cfg.enabled or cfg.recipient='' or cfg.iban='' then raise exception 'Bestellungen derzeit nicht verfügbar';end if;
 if amount is null or quoted_in<>amount or (package_in='Standard' and quantity_in<>500) then raise exception 'Preis oder Paket ungültig';end if;
 select array_agg(id) into ids from (select id from crm_lead_catalog where active and reserved_order is null and sold_order is null order by id limit quantity_in for update) pool;
 if coalesce(array_length(ids,1),0)<>quantity_in then raise exception 'Für diese Menge sind nicht genügend exklusive Kontakte verfügbar';end if;
 insert into crm_lead_orders(request_key,request_hash,package,quantity,total_cents,customer,bank,terms_version,terms)
 values(request_in,hash_in,package_in,quantity_in,amount,customer_in,jsonb_build_object('recipient',cfg.recipient,'iban',cfg.iban),version_in,terms_in) returning * into row;
 update crm_lead_catalog set reserved_order=row.id where id=any(ids);
 insert into crm_lead_order_items(order_id,lead_id,name,phone,email,website) select row.id,id,name,phone,email,website from crm_lead_catalog where id=any(ids);
 insert into crm_lead_shop_mail(order_id,kind) values(row.id,'confirmation');
 insert into crm_lead_shop_events(order_id,action,detail) values(row.id,'order.created',jsonb_build_object('quantity',quantity_in,'cents',amount));
 return to_jsonb(row);
end $$;
create function public.crm_pay_lead_order(id_in uuid,actor_in uuid,reference_in text,cents_in integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare row crm_lead_orders; changed integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('lead-shop-stock',0));
 select * into row from crm_lead_orders where id=id_in for update;
 if not found or row.status<>'Zahlung ausstehend' or row.expires_at<now() then raise exception 'Bestellung nicht mehr zur Zahlungserfassung verfügbar';end if;
 if cents_in<>row.total_cents or length(trim(reference_in))<4 then raise exception 'Vollständigen Betrag und Banktransaktionsreferenz prüfen';end if;
 update crm_lead_catalog set sold_order=row.id where reserved_order=row.id and sold_order is null;
 get diagnostics changed=row_count;
 if changed<>row.quantity then raise exception 'Reservierung unvollständig. Keine Freigabe';end if;
 update crm_lead_orders set status='Bezahlt',paid_at=now(),paid_by=actor_in,payment_reference=trim(reference_in),payment_cents=cents_in where id=id_in;
 insert into crm_lead_shop_events(order_id,actor_id,action,detail) values(id_in,actor_in,'payment.confirmed',jsonb_build_object('cents',cents_in,'reference',trim(reference_in)));
end $$;
create function public.crm_cancel_lead_order(id_in uuid,actor_in uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('lead-shop-stock',0));
 update crm_lead_orders set status='Storniert' where id=id_in and status='Zahlung ausstehend';
 if not found then raise exception 'Nur unbezahlte Bestellungen können storniert werden';end if;
 update crm_lead_catalog set reserved_order=null where reserved_order=id_in and sold_order is null;
 insert into crm_lead_shop_events(order_id,actor_id,action) values(id_in,actor_in,'order.cancelled');
end $$;
create function public.crm_claim_lead_fulfillment() returns setof public.crm_lead_orders language plpgsql security definer set search_path=public,pg_temp as $$
begin
 return query update crm_lead_orders set fulfillment_state='processing',claim_id=gen_random_uuid(),claimed_at=now(),error=''
 where id=(select id from crm_lead_orders where paid_at is not null and status='Bezahlt' and not revoked and (fulfillment_state='pending' or (fulfillment_state='processing' and claimed_at<now()-interval '10 minutes')) order by paid_at for update skip locked limit 1) returning *;
end $$;
create function public.crm_finish_lead_fulfillment(id_in uuid,claim_in uuid,path_in text,sha_in text,token_hash_in text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update crm_lead_orders set fulfillment_state='done',status='Bereitgestellt',file_path=path_in,file_sha256=sha_in,token_hash=token_hash_in,token_expires_at=now()+interval '90 days',ready_at=now()
 where id=id_in and claim_id=claim_in and status='Bezahlt' and paid_at is not null and not revoked;
 if not found then raise exception 'Freigabe zwischenzeitlich geändert';end if;
 insert into crm_lead_shop_mail(order_id,kind) values(id_in,'download') on conflict do nothing;
 insert into crm_lead_shop_events(order_id,action,detail) values(id_in,'download.released',jsonb_build_object('sha256',sha_in));
end $$;
create function public.crm_claim_lead_mail() returns setof public.crm_lead_shop_mail language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update crm_lead_shop_mail set status='unknown',error='Versand unterbrochen; Postfach vor erneutem Versand prüfen' where status='sending' and claimed_at<now()-interval '10 minutes';
 return query update crm_lead_shop_mail set status='sending',claimed_at=now(),claim_id=gen_random_uuid()
 where id=(select m.id from crm_lead_shop_mail m join crm_lead_orders o on o.id=m.order_id where m.status='pending' and (m.kind='confirmation' or (o.status='Bereitgestellt' and not o.revoked)) order by o.created_at,m.kind for update of m skip locked limit 1) returning *;
end $$;
create function public.crm_lead_order_change_log() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if (new.status,new.revoked,new.token_version,new.token_expires_at,new.fulfillment_state) is distinct from (old.status,old.revoked,old.token_version,old.token_expires_at,old.fulfillment_state) then
  insert into crm_lead_shop_events(order_id,action,detail) values(new.id,'order.state_changed',jsonb_build_object('status',new.status,'revoked',new.revoked,'token_version',new.token_version,'fulfillment',new.fulfillment_state));
 end if;
 return new;
end $$;
create trigger lead_order_change_log after update on public.crm_lead_orders for each row execute function public.crm_lead_order_change_log();
revoke all on function public.crm_lead_order_change_log() from public,anon,authenticated;
create function public.crm_renew_lead_download(id_in uuid,actor_in uuid,version_in integer,hash_in text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare row crm_lead_orders; mail_state text;
begin
 select * into row from crm_lead_orders where id=id_in for update;
 if not found or row.status<>'Bereitgestellt' or row.paid_at is null or version_in<>row.token_version+1 then raise exception 'Downloadstatus geändert';end if;
 select status into mail_state from crm_lead_shop_mail where order_id=id_in and kind='download' for update;
 if mail_state='sending' then raise exception 'Versand läuft bereits. Bitte danach erneut versuchen';end if;
 update crm_lead_orders set revoked=false,token_version=version_in,token_hash=hash_in,token_expires_at=now()+interval '90 days' where id=id_in;
 insert into crm_lead_shop_mail(order_id,kind,status) values(id_in,'download','pending') on conflict(order_id,kind) do update set status='pending',error='';
 insert into crm_lead_shop_events(order_id,actor_id,action) values(id_in,actor_in,'download.link_rotated');
end $$;
revoke all on function public.crm_renew_lead_download(uuid,uuid,integer,text) from public,anon,authenticated;
grant execute on function public.crm_renew_lead_download(uuid,uuid,integer,text) to service_role;
create function public.crm_lead_shop_tick() returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare secret text;
begin
 perform crm_expire_lead_orders();
 update crm_lead_shop_automation set last_tick=now() where id;
 if exists(select 1 from crm_lead_orders where status='Zahlung ausstehend') and exists(select 1 from crm_lead_shop_automation where payment_reminded_at is null or payment_reminded_at<now()-interval '15 minutes') then
  insert into crm_notifications(user_id,title,href,event_key) select id,'Lead-Verkauf: Bankeingänge und offene Bestellungen prüfen','/crm/lead-verkauf','lead-payments:'||id::text||':'||floor(extract(epoch from now())/900)::text from crm_users where enabled and role in ('administrator','buchhaltung') on conflict(event_key) do nothing;
  update crm_lead_shop_automation set payment_reminded_at=now() where id;
 end if;
 select decrypted_secret into secret from vault.decrypted_secrets where name='webstudio_review_cron_secret' limit 1;
 if secret is not null and (exists(select 1 from crm_lead_shop_mail where status in ('pending','sending')) or exists(select 1 from crm_lead_orders where status='Bezahlt' and fulfillment_state in ('pending','processing')) or exists(select 1 from crm_lead_shop_automation where worker_seen is null or worker_seen<now()-interval '5 minutes')) then
  perform net.http_post(url:='https://www.webstudio-expert.de/api/internal/lead-shop',headers:=jsonb_build_object('Authorization','Bearer '||secret,'Content-Type','application/json'),body:='{}'::jsonb,timeout_milliseconds:=65000);
 end if;
end $$;
-- Reuses the existing Vault CRON_SECRET; no new secret or external provider.
select cron.schedule('webstudio-lead-shop','* * * * *','select public.crm_lead_shop_tick();');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('lead-shop-private','lead-shop-private',false,25000000,array['text/csv','application/pdf']) on conflict(id) do update set public=false;
-- No storage policies for anon/authenticated: download only through the server.
revoke all on function public.crm_lead_price(integer),public.crm_expire_lead_orders(),public.crm_create_lead_order(uuid,text,text,integer,integer,jsonb,text,text),public.crm_pay_lead_order(uuid,uuid,text,integer),public.crm_cancel_lead_order(uuid,uuid),public.crm_claim_lead_fulfillment(),public.crm_finish_lead_fulfillment(uuid,uuid,text,text,text),public.crm_claim_lead_mail(),public.crm_lead_shop_tick() from public,anon,authenticated;
grant execute on function public.crm_lead_price(integer),public.crm_expire_lead_orders(),public.crm_create_lead_order(uuid,text,text,integer,integer,jsonb,text,text),public.crm_pay_lead_order(uuid,uuid,text,integer),public.crm_cancel_lead_order(uuid,uuid),public.crm_claim_lead_fulfillment(),public.crm_finish_lead_fulfillment(uuid,uuid,text,text,text),public.crm_claim_lead_mail(),public.crm_lead_shop_tick() to service_role;
notify pgrst,'reload schema';
commit;
