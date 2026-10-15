-- Existing CRM: copy this entire file into Supabase SQL Editor.
-- No destructive reset. Configure the scheduler separately afterwards.
begin;

-- Existing CRM: run this migration, not the full installation script.
create table if not exists public.crm_review_requests (
 id uuid primary key default gen_random_uuid(), request_key text not null unique,
 reference text not null unique default ('BW-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
 platform text not null check(length(platform) between 1 and 100), review_url text not null check(length(review_url) between 10 and 2048),
 name text not null check(length(name) between 2 and 100), email text not null check(length(email) between 3 and 254),
 phone text not null default '', company text not null default '', description text not null default '',
 status text not null default 'Offen' check(status in ('Offen','Abgeschlossen','Storniert')),
 payment_status text not null default 'Ausstehend' check(payment_status in ('Ausstehend','Eingegangen','Erstattung erforderlich','Erstattet')),
 result text not null default 'Ungeprüft' check(result in ('Ungeprüft','In Prüfung','Erfolgreich entfernt','Nicht entfernt')),
 internal_notes text not null default '', price numeric(10,2) not null default 59 check(price=59),
 commissioned_at timestamptz, starts_after timestamptz, order_data jsonb, conditions_version text,
 paid_at timestamptz, refunded_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists crm_reviews_inbox on public.crm_review_requests(status,created_at desc);
create table if not exists public.crm_review_mail_jobs (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.crm_review_requests(id),
 kind text not null check(kind in ('acknowledgment','order_confirmation')),
 status text not null default 'pending' check(status in ('pending','sending','sent','unknown','failed','cancelled')),
 due_at timestamptz not null, claimed_at timestamptz, claim_id uuid, sent_at timestamptz,
 message_id text, subject text, body text, html text, error text not null default '', created_at timestamptz not null default now(), unique(request_id,kind)
);
create index if not exists crm_reviews_mail_due on public.crm_review_mail_jobs(due_at) where status='pending';
create table if not exists public.crm_review_automation_state (
 id boolean primary key default true check(id), enabled boolean not null default false, last_tick timestamptz, worker_last_seen timestamptz
);
insert into public.crm_review_automation_state(id) values(true) on conflict do nothing;
alter table public.crm_review_requests enable row level security;
alter table public.crm_review_mail_jobs enable row level security;
alter table public.crm_review_automation_state enable row level security;
revoke all on public.crm_review_requests,public.crm_review_mail_jobs,public.crm_review_automation_state from anon,authenticated;
grant select on public.crm_review_requests,public.crm_review_mail_jobs to authenticated;
grant update(status,payment_status,result,internal_notes) on public.crm_review_requests to authenticated;
grant all on public.crm_review_requests,public.crm_review_mail_jobs,public.crm_review_automation_state to service_role;
drop policy if exists review_staff_read on public.crm_review_requests;
create policy review_staff_read on public.crm_review_requests for select to authenticated using(public.crm_role() in ('administrator','vertrieb'));
drop policy if exists review_staff_update on public.crm_review_requests;
create policy review_staff_update on public.crm_review_requests for update to authenticated using(public.crm_role() in ('administrator','vertrieb')) with check(public.crm_role() in ('administrator','vertrieb'));
drop policy if exists review_mail_staff_read on public.crm_review_mail_jobs;
create policy review_mail_staff_read on public.crm_review_mail_jobs for select to authenticated using(public.crm_role() in ('administrator','vertrieb'));

create or replace function public.crm_review_before_update() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 new.updated_at=now();
 if old.payment_status='Erstattet' and new.payment_status<>'Erstattet' then raise exception 'Eine dokumentierte Erstattung darf nicht zurückgesetzt werden';end if;
 if old.paid_at is not null and new.payment_status='Ausstehend' then raise exception 'Eine eingegangene Vorauszahlung kann nicht auf ausstehend gesetzt werden';end if;
 if new.payment_status='Erstattung erforderlich' and new.paid_at is null then raise exception 'Keine dokumentierte Vorauszahlung vorhanden';end if;
 if new.payment_status='Eingegangen' and new.commissioned_at is null then raise exception 'Vor Zahlungserfassung ist eine Beauftragung erforderlich'; end if;
 if new.payment_status='Eingegangen' and new.paid_at is null then new.paid_at=now();end if;
 if new.paid_at is not null and (new.result='Nicht entfernt' or (new.status='Storniert' and new.result<>'Erfolgreich entfernt')) and new.payment_status<>'Erstattet' then new.payment_status='Erstattung erforderlich';end if;
 if new.payment_status='Erstattet' then
  if new.paid_at is null then raise exception 'Keine dokumentierte Vorauszahlung vorhanden';end if;
  if new.refunded_at is null then new.refunded_at=now();end if;
 end if;
 if old.paid_at is not null and new.paid_at is distinct from old.paid_at then raise exception 'Dokumentierter Zahlungseingang darf nicht überschrieben werden';end if;
 if old.refunded_at is not null and new.refunded_at is distinct from old.refunded_at then raise exception 'Dokumentierte Rücküberweisung darf nicht überschrieben werden';end if;
 return new;
end $$;
drop trigger if exists review_before_update on public.crm_review_requests;
create trigger review_before_update before update on public.crm_review_requests for each row execute function public.crm_review_before_update();
create or replace function public.crm_review_cancel_mail() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.status<>'Offen' then update crm_review_mail_jobs set status='cancelled',error='Vorgang vor Versand geschlossen' where request_id=new.id and status='pending' and kind='acknowledgment';end if;
 return new;
end $$;
drop trigger if exists review_cancel_mail on public.crm_review_requests;
create trigger review_cancel_mail after update of status on public.crm_review_requests for each row execute function public.crm_review_cancel_mail();
-- Dedicated audit record: no assumptions about lead fields in the common trigger.
create or replace function public.crm_review_audit() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into crm_audit_logs(actor_id,entity,entity_id,action,before_data,after_data) values(auth.uid(),'crm_review_requests',new.id,tg_op,case when tg_op='UPDATE' then to_jsonb(old) end,to_jsonb(new));
 return new;
end $$;
drop trigger if exists review_audit on public.crm_review_requests;
create trigger review_audit after insert or update on public.crm_review_requests for each row execute function public.crm_review_audit();

create or replace function public.crm_ingest_review(key_in text,payload jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare item crm_review_requests;
begin
 if key_in !~ '^[a-f0-9]{64}$' or length(coalesce(payload->>'name',''))<2 or length(coalesce(payload->>'email',''))<3 then raise exception 'Ungültige Anfrage';end if;
 insert into crm_review_requests(request_key,platform,review_url,name,email,phone,company,description)
 values(key_in,payload->>'platform',payload->>'reviewUrl',payload->>'name',lower(payload->>'email'),coalesce(payload->>'phone',''),coalesce(payload->>'company',''),coalesce(payload->>'description',''))
 on conflict(request_key) do nothing returning * into item;
 if item.id is null then select * into item from crm_review_requests where request_key=key_in;end if;
 insert into crm_review_mail_jobs(request_id,kind,due_at) values(item.id,'acknowledgment',item.created_at+interval '7 minutes') on conflict(request_id,kind) do nothing;
 return jsonb_build_object('id',item.id,'reference',item.reference);
end $$;
create or replace function public.crm_commission_review(id_in uuid,order_in jsonb,version_in text,early_in boolean) returns timestamptz language plpgsql security definer set search_path=public,pg_temp as $$
declare item crm_review_requests; commissioned timestamptz;
begin
 select * into item from crm_review_requests where id=id_in for update;
 if item.id is null or item.status<>'Offen' then raise exception 'Vorgang nicht verfügbar';end if;
 if item.commissioned_at is not null then return item.commissioned_at;end if;
 if item.created_at<now()-interval '30 days' then raise exception 'Angebot abgelaufen. Bitte eine neue kostenlose Anfrage stellen';end if;
 commissioned=now();
 update crm_review_requests set commissioned_at=commissioned,order_data=order_in,conditions_version=version_in,
 -- Internal minimum waiting marker only, not a calculation of every possible
 -- legal deadline (e.g. regional holidays). The lawyers check the actual period.
 starts_after=case when order_in->>'customerType'='consumer' and not early_in then (((commissioned at time zone 'Europe/Berlin')::date+15)::timestamp at time zone 'Europe/Berlin') else commissioned end where id=id_in;
 insert into crm_review_mail_jobs(request_id,kind,due_at) values(id_in,'order_confirmation',now()) on conflict(request_id,kind) do nothing;
 return commissioned;
end $$;
create or replace function public.crm_claim_review_mail() returns setof public.crm_review_mail_jobs language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update crm_review_automation_state set worker_last_seen=now() where id;
 update crm_review_mail_jobs set status='unknown',error='Versand abgebrochen. Postfach vor erneutem Versand prüfen.' where status='sending' and claimed_at<now()-interval '10 minutes';
 return query update crm_review_mail_jobs j set status='sending',claimed_at=now(),claim_id=gen_random_uuid()
 where j.id=(select q.id from crm_review_mail_jobs q join crm_review_requests r on r.id=q.request_id
 where q.status='pending' and q.due_at<=now() and (r.status='Offen' or q.kind='order_confirmation') order by q.due_at limit 1 for update of q skip locked) returning j.*;
end $$;
revoke all on function public.crm_ingest_review(text,jsonb),public.crm_commission_review(uuid,jsonb,text,boolean),public.crm_claim_review_mail() from public,anon,authenticated;
grant execute on function public.crm_ingest_review(text,jsonb),public.crm_commission_review(uuid,jsonb,text,boolean),public.crm_claim_review_mail() to service_role;
notify pgrst,'reload schema';

-- Uses the EXISTING Supabase project. No separate scheduling provider.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.crm_review_tick() returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare secret text;
begin
 if not exists(select 1 from crm_review_automation_state where id and enabled) then return;end if;
 update crm_review_automation_state set last_tick=now() where id;
 select decrypted_secret into secret from vault.decrypted_secrets where name='webstudio_review_cron_secret' limit 1;
 if secret is null then return;end if;
 -- Wake only for due mail, stale claims, or a periodic no-mail health heartbeat.
 if exists(select 1 from crm_review_mail_jobs where (status='pending' and due_at<=now()) or (status='sending' and claimed_at<now()-interval '10 minutes'))
 or exists(select 1 from crm_review_automation_state where worker_last_seen is null or worker_last_seen<now()-interval '5 minutes') then
  perform net.http_post(
   url:='https://www.webstudio-expert.de/api/internal/review-mail',
   headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret),
   body:='{}'::jsonb,timeout_milliseconds:=65000
  );
 end if;
end $$;
create or replace function public.crm_configure_review_scheduler(secret_in text) returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare secret_id uuid;
begin
 if length(secret_in)<32 or secret_in~'[[:space:]]' or secret_in ilike '%HIER_DEIN%' then raise exception 'Bitte exakt den mindestens 32 Zeichen langen CRON_SECRET aus Vercel einsetzen';end if;
 select id into secret_id from vault.secrets where name='webstudio_review_cron_secret' limit 1;
 if secret_id is null then perform vault.create_secret(secret_in,'webstudio_review_cron_secret');
 else perform vault.update_secret(secret_id,secret_in);end if;
 perform cron.schedule('webstudio-review-mail','* * * * *','select public.crm_review_tick();');
 update crm_review_automation_state set enabled=true,last_tick=null,worker_last_seen=null where id;
 return 'Bewertungsversand eingerichtet. Nach dem Deployment und innerhalb der nächsten Minuten im CRM unter Bewertungen prüfen.';
end $$;
revoke all on function public.crm_review_tick(),public.crm_configure_review_scheduler(text) from public,anon,authenticated;
grant execute on function public.crm_review_tick(),public.crm_configure_review_scheduler(text) to service_role;
notify pgrst,'reload schema';

commit;
