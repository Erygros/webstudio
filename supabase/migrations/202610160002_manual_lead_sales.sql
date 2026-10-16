-- Apply after 202610160001_lead_shop.sql. Existing orders/data are preserved.
begin;
alter table public.crm_lead_shop_settings add column if not exists manual_delivery boolean not null default true;
alter table public.crm_lead_shop_settings add column if not exists notification_email text not null default 'bewerbung.enricogross30@gmail.com';
-- Activate explicitly after deploying the matching application and reviewing local delivery.
update public.crm_lead_shop_settings set enabled=false where id;
alter table public.crm_lead_orders add column if not exists delivery_mode text not null default 'manual';
alter table public.crm_lead_orders add column if not exists fulfilled_at timestamptz;
alter table public.crm_lead_orders add column if not exists fulfilled_by uuid references public.crm_users(id);
alter table public.crm_lead_orders add column if not exists delivery_note text not null default '';
alter table public.crm_lead_orders drop constraint if exists crm_lead_orders_status_check;
alter table public.crm_lead_orders add constraint crm_lead_orders_status_check check(status in ('Zahlung ausstehend','Bezahlt','Bereitgestellt','Versendet','Storniert','Abgelaufen'));
alter table public.crm_lead_shop_mail add column if not exists to_address text;
alter table public.crm_lead_shop_mail drop constraint if exists crm_lead_shop_mail_kind_check;
alter table public.crm_lead_shop_mail add constraint crm_lead_shop_mail_kind_check check(kind in ('confirmation','download','owner_order','owner_payment','owner_sent','owner_cancelled'));
alter table public.crm_lead_shop_mail drop constraint if exists crm_lead_shop_mail_status_check;
alter table public.crm_lead_shop_mail add constraint crm_lead_shop_mail_status_check check(status in ('pending','sending','sent','unknown','cancelled'));
update public.crm_lead_shop_mail set status='cancelled',error='Manuelle Auslieferung: automatischer Downloadversand deaktiviert' where kind='download' and status in ('pending','sending');
update public.crm_lead_shop_mail m set to_address=o.customer->>'email' from public.crm_lead_orders o where o.id=m.order_id and m.kind='confirmation' and m.to_address is null;

-- Legacy workers cannot claim new notification jobs or produce any new CSV files.
create or replace function public.crm_claim_lead_fulfillment() returns setof public.crm_lead_orders language plpgsql security definer set search_path=public,pg_temp as $$ begin return; end $$;
create or replace function public.crm_claim_lead_mail() returns setof public.crm_lead_shop_mail language plpgsql security definer set search_path=public,pg_temp as $$ begin return; end $$;
create or replace function public.crm_expire_lead_orders() returns void language plpgsql security definer set search_path=public,pg_temp as $$ begin return; end $$;

create or replace function public.crm_create_lead_order(request_in uuid,hash_in text,package_in text,quantity_in integer,quoted_in integer,customer_in jsonb,version_in text,terms_in text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare cfg crm_lead_shop_settings; row crm_lead_orders; amount integer=crm_lead_price(quantity_in);
begin
 perform pg_advisory_xact_lock(hashtextextended('lead-shop-order:'||request_in::text,0));
 select * into row from crm_lead_orders where request_key=request_in;
 if found then
  if row.request_hash<>hash_in then raise exception 'Bestellschlüssel bereits für andere Angaben verwendet';end if;
  return to_jsonb(row);
 end if;
 select * into cfg from crm_lead_shop_settings where id for share;
 if not found or not cfg.enabled or not cfg.manual_delivery or cfg.recipient='' or cfg.iban='' or cfg.notification_email='' then raise exception 'Bestellungen derzeit nicht verfügbar';end if;
 if amount is null or quoted_in<>amount or (package_in='Standard' and quantity_in<>500) then raise exception 'Preis oder Paket ungültig';end if;
 insert into crm_lead_orders(request_key,request_hash,package,quantity,total_cents,customer,bank,terms_version,terms,delivery_mode)
 values(request_in,hash_in,package_in,quantity_in,amount,customer_in,jsonb_build_object('recipient',cfg.recipient,'iban',cfg.iban),version_in,terms_in,'manual') returning * into row;
 insert into crm_lead_shop_mail(order_id,kind,to_address) values(row.id,'confirmation',customer_in->>'email'),(row.id,'owner_order',cfg.notification_email);
 insert into crm_lead_shop_events(order_id,action,detail) values(row.id,'order.created',jsonb_build_object('quantity',quantity_in,'cents',amount,'delivery','manual'));
 return to_jsonb(row);
end $$;
create or replace function public.crm_pay_lead_order(id_in uuid,actor_in uuid,reference_in text,cents_in integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare row crm_lead_orders;
begin
 select * into row from crm_lead_orders where id=id_in for update;
 if not found or row.status<>'Zahlung ausstehend' then raise exception 'Bestellung nicht zur Zahlungserfassung verfügbar';end if;
 if cents_in<>row.total_cents or length(trim(reference_in))<4 then raise exception 'Vollständigen Betrag und Banktransaktionsreferenz prüfen';end if;
 -- No catalog allocation, file generation or customer download mail.
 update crm_lead_orders set status='Bezahlt',paid_at=now(),paid_by=actor_in,payment_reference=trim(reference_in),payment_cents=cents_in where id=id_in;
 insert into crm_lead_shop_mail(order_id,kind,to_address) select id_in,'owner_payment',notification_email from crm_lead_shop_settings where id on conflict do nothing;
 insert into crm_lead_shop_events(order_id,actor_id,action,detail) values(id_in,actor_in,'payment.confirmed',jsonb_build_object('cents',cents_in,'reference',trim(reference_in)));
end $$;
create or replace function public.crm_cancel_lead_order(id_in uuid,actor_in uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update crm_lead_orders set status='Storniert' where id=id_in and status='Zahlung ausstehend';
 if not found then raise exception 'Nur unbezahlte Bestellungen können storniert werden';end if;
 insert into crm_lead_shop_mail(order_id,kind,to_address) select id_in,'owner_cancelled',notification_email from crm_lead_shop_settings where id on conflict do nothing;
 insert into crm_lead_shop_events(order_id,actor_id,action) values(id_in,actor_in,'order.cancelled');
end $$;
create or replace function public.crm_mark_lead_sent(id_in uuid,actor_in uuid,note_in text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update crm_lead_orders set status='Versendet',fulfilled_at=now(),fulfilled_by=actor_in,delivery_note=note_in where id=id_in and status='Bezahlt' and paid_at is not null;
 if not found then raise exception 'Nur bezahlte Bestellungen können als extern versendet markiert werden';end if;
 insert into crm_lead_shop_mail(order_id,kind,to_address) select id_in,'owner_sent',notification_email from crm_lead_shop_settings where id on conflict do nothing;
 insert into crm_lead_shop_events(order_id,actor_id,action,detail) values(id_in,actor_in,'delivery.manually_confirmed',jsonb_build_object('note',note_in));
end $$;
create or replace function public.crm_claim_lead_manual_mail(order_in uuid default null) returns setof public.crm_lead_shop_mail language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update crm_lead_shop_mail set status='unknown',error='Versand unterbrochen; Postfach vor erneutem Versand prüfen' where status='sending' and claimed_at<now()-interval '10 minutes';
 return query update crm_lead_shop_mail set status='sending',claimed_at=now(),claim_id=gen_random_uuid()
 where id=(select m.id from crm_lead_shop_mail m join crm_lead_orders o on o.id=m.order_id where m.status='pending' and m.kind<>'download' and (order_in is null or m.order_id=order_in) order by o.created_at,m.kind for update of m skip locked limit 1) returning *;
end $$;
create or replace function public.crm_lead_shop_tick() returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare secret text;
begin
 update crm_lead_shop_automation set last_tick=now() where id;
 select decrypted_secret into secret from vault.decrypted_secrets where name='webstudio_review_cron_secret' limit 1;
 if secret is not null and (exists(select 1 from crm_lead_shop_mail where kind<>'download' and status in ('pending','sending')) or exists(select 1 from crm_lead_shop_automation where worker_seen is null or worker_seen<now()-interval '5 minutes')) then
  perform net.http_post(url:='https://www.webstudio-expert.de/api/internal/lead-shop',headers:=jsonb_build_object('Authorization','Bearer '||secret,'Content-Type','application/json'),body:='{}'::jsonb,timeout_milliseconds:=65000);
 end if;
end $$;
revoke all on function public.crm_mark_lead_sent(uuid,uuid,text),public.crm_claim_lead_manual_mail(uuid) from public,anon,authenticated;
grant execute on function public.crm_mark_lead_sent(uuid,uuid,text),public.crm_claim_lead_manual_mail(uuid) to service_role;
select cron.schedule('webstudio-lead-shop','* * * * *','select public.crm_lead_shop_tick();');
-- Retained legacy storage/files stay private; no destructive data cleanup.
notify pgrst,'reload schema';
commit;
