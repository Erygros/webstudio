-- Bestehendes CRM: vollständig im Supabase SQL Editor ausführen.
-- Wiederholbar. Keine Datensatzlöschung; RLS bleibt aktiv.
begin;

-- Dieser gemeinsame Trigger läuft auch auf Tabellen OHNE status-Spalte.
create or replace function public.crm_audit()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  previous_row jsonb;
  current_row jsonb;
  entity_id_in uuid;
begin
  if tg_op = 'INSERT' then
    current_row := to_jsonb(new);
    entity_id_in := new.id;
  elsif tg_op = 'DELETE' then
    previous_row := to_jsonb(old);
    entity_id_in := old.id;
  else
    previous_row := to_jsonb(old);
    current_row := to_jsonb(new);
    entity_id_in := new.id;
  end if;
  insert into public.crm_audit_logs(actor_id, entity, entity_id, action, before_data, after_data)
  values(auth.uid(), tg_table_name, entity_id_in, tg_op, previous_row, current_row);
  if tg_table_name = 'crm_companies' and tg_op = 'UPDATE' then
    if (current_row->>'status') is distinct from (previous_row->>'status') then
      insert into public.crm_lead_status_history(company_id, old_status, new_status, actor_id)
      values(entity_id_in, previous_row->>'status', current_row->>'status', auth.uid());
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- E-Mail-Kontakte vor dem INSERT zuordnen: Der bestehende Duplikat-Trigger
-- kann schon vor ON CONFLICT eingreifen. Bestehende Stammdaten bleiben erhalten.
create or replace function public.crm_ingest_inquiry(request_key_in text, payload jsonb)
returns uuid language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  cid uuid;
  rid uuid;
  v_email text := lower(trim(coalesce(payload->>'email', '')));
  v_name text := trim(coalesce(payload->>'name', ''));
begin
  if v_email = '' or v_name = '' or coalesce(request_key_in, '') = '' then
    raise exception 'Unvollständige Anfrage';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('crm-company-import', 0));
  select company_id into cid from public.crm_website_inquiries where request_key = request_key_in;
  if cid is not null then return cid; end if;
  select id into cid from public.crm_companies
    where lower(trim(email)) = v_email order by created_at, id limit 1;
  if cid is null then
    select company_id into cid from public.crm_contacts
      where lower(trim(email)) = v_email order by created_at, id limit 1;
  end if;
  if cid is null then
    insert into public.crm_companies(name, email, phone, contact_name, source, notes)
    values(coalesce(nullif(trim(payload->>'company'), ''), v_name), v_email,
      coalesce(payload->>'phone', ''), v_name, 'Website', payload->>'description')
    returning id into cid;
  end if;
  insert into public.crm_website_inquiries(company_id, request_key, data)
  values(cid, request_key_in, payload) returning id into rid;
  insert into public.crm_tasks(company_id, title, description, due_at)
  values(cid, 'Website-Anfrage beantworten', payload->>'description', now());
  insert into public.crm_notifications(title, href, event_key)
  values('Neue Website-Anfrage', '/crm/anfragen/' || rid, 'inquiry:' || request_key_in)
  on conflict(event_key) do nothing;
  if payload->>'mode' = 'appointment' then
    insert into public.crm_calendar_events(company_id, title, starts_at, ends_at, status, notes)
    values(cid, 'Terminwunsch: ' || v_name,
      (payload->>'appointment')::timestamp at time zone 'Europe/Berlin',
      ((payload->>'appointment')::timestamp at time zone 'Europe/Berlin') + interval '30 minutes',
      'Angefragt', payload->>'description');
  end if;
  return cid;
end;
$$;
revoke all on function public.crm_ingest_inquiry(text, jsonb) from public, anon, authenticated;
grant execute on function public.crm_ingest_inquiry(text, jsonb) to service_role;

-- Versionsnachweis für die geschützte Statusanzeige; legt keine Probe-Daten an.
create or replace function public.crm_website_schema_status()
returns jsonb language sql stable security definer
set search_path = public, pg_temp
as $$ select jsonb_build_object('version', '202610150001', 'audit_repaired', true) $$;
revoke all on function public.crm_website_schema_status() from public, anon, authenticated;
grant execute on function public.crm_website_schema_status() to service_role;

notify pgrst, 'reload schema';
commit;
