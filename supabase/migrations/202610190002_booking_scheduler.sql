-- Reuses the existing CRON_SECRET in Supabase Vault. No additional provider.
begin;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;
create table public.crm_booking_automation (
 id boolean primary key default true check(id), last_tick timestamptz, worker_last_seen timestamptz,
 last_success timestamptz, error text not null default ''
);
insert into public.crm_booking_automation(id) values(true);
alter table public.crm_booking_automation enable row level security;
revoke all on public.crm_booking_automation from anon,authenticated;
grant select on public.crm_booking_automation to authenticated;
grant all on public.crm_booking_automation to service_role;
create policy staff_read on public.crm_booking_automation for select to authenticated using(public.crm_role() in ('administrator','buchhaltung','vertrieb'));
create function public.crm_booking_wake() returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare secret text;
begin
 update crm_booking_automation set last_tick=now() where id;
 select decrypted_secret into secret from vault.decrypted_secrets where name='webstudio_review_cron_secret' limit 1;
 if secret is null or length(secret)<32 then update crm_booking_automation set error='Bestehendes CRON_SECRET in Supabase Vault fehlt.' where id; return; end if;
 if exists(select 1 from crm_booking_mail where status in ('queued','sending')) or
 exists(select 1 from crm_service_bookings where next_on<=(now() at time zone 'Europe/Berlin')::date and status='In Bearbeitung') or
 exists(select 1 from crm_booking_automation where worker_last_seen is null or worker_last_seen<now()-interval '5 minutes') then
  perform net.http_post(url:='https://www.webstudio-expert.de/api/internal/bookings',
   headers:=jsonb_build_object('Authorization','Bearer '||secret,'Content-Type','application/json'),body:='{}'::jsonb,timeout_milliseconds:=65000);
 end if;
end $$;
revoke all on function public.crm_booking_wake() from public,anon,authenticated;
select cron.schedule('webstudio-service-bookings','* * * * *','select public.crm_booking_wake();');
notify pgrst,'reload schema';
commit;
