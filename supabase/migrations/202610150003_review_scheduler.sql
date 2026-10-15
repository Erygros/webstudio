-- Uses the EXISTING Supabase project. No separate scheduling provider.
begin;
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
