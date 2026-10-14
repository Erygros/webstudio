-- Apply once AFTER migrations 001–013, including on an existing CRM project.
begin;
alter table public.crm_companies add column work_closed_at timestamptz;
alter table public.crm_companies drop constraint crm_companies_status_check;
alter table public.crm_companies add constraint crm_companies_status_check check(status in ('Neu','Kontaktiert','Nicht erreicht','Kein Interesse','Follow-up senden','Follow-up gesendet','Interessiert','Kunde gewonnen','Später kontaktieren','E-Mail versendet'));
create table public.crm_work_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.crm_users(id),
 company_id uuid references public.crm_companies(id), source_follow_up uuid references public.crm_follow_ups(id),
 stage integer not null default 1 check(stage between 1 and 5), status text not null default 'active' check(status in ('active','paused','completed','skipped')),
 email_id uuid references public.crm_emails(id), call_id uuid references public.crm_calls(id),
 contact_at timestamptz, planned_at timestamptz, completed_at timestamptz, skipped_until timestamptz,
 state jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index crm_work_one_current on public.crm_work_sessions(user_id) where status in ('active','paused');
create unique index crm_work_company_claim on public.crm_work_sessions(company_id) where status in ('active','paused') and company_id is not null;
create index crm_work_company_history on public.crm_work_sessions(company_id,completed_at);
create index crm_work_due on public.crm_follow_ups(due_at) where status<>'Abgeschlossen';
alter table public.crm_follow_ups add column work_session_id uuid unique references public.crm_work_sessions(id);
alter table public.crm_tasks add column work_follow_up_id uuid unique references public.crm_follow_ups(id);
alter table public.crm_calendar_events add column work_follow_up_id uuid unique references public.crm_follow_ups(id);
-- Edits made in the existing Follow-ups module keep wizard links in sync too.
create function public.crm_work_followup_links() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.due_at is distinct from old.due_at or new.notes is distinct from old.notes or new.status is distinct from old.status then
  update crm_tasks set due_at=new.due_at,description=new.notes,status=case when new.status='Abgeschlossen' then 'Erledigt' when old.status='Abgeschlossen' then 'Offen' else status end where work_follow_up_id=new.id;
  update crm_calendar_events set starts_at=new.due_at,ends_at=new.due_at+interval '15 minutes',notes=new.notes,status=case when new.status='Abgeschlossen' then 'Erledigt' when old.status='Abgeschlossen' then 'Geplant' else status end where work_follow_up_id=new.id;
 end if;
 return new;
end $$;
create trigger work_links after update on public.crm_follow_ups for each row execute function public.crm_work_followup_links();
alter table public.crm_work_sessions enable row level security;
revoke all on public.crm_work_sessions from anon,authenticated;
grant select on public.crm_work_sessions to authenticated;
grant all on public.crm_work_sessions to service_role;
create policy own_work on public.crm_work_sessions for select to authenticated using(user_id=auth.uid() and public.crm_role() in ('administrator','vertrieb'));
create trigger touch before update on public.crm_work_sessions for each row execute function public.crm_touch();
create trigger audit after insert or update on public.crm_work_sessions for each row execute function public.crm_audit();
create function public.crm_work_lead_history() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare event_name text;
begin
 if new.company_id is null then return new; end if;
 event_name=case when tg_op='INSERT' then 'work.started'
  when new.status is distinct from old.status then 'work.'||new.status
  when new.contact_at is distinct from old.contact_at then 'work.contact'
  when new.planned_at is distinct from old.planned_at then 'work.followup'
  when new.email_id is distinct from old.email_id then 'work.draft'
  when new.company_id is distinct from old.company_id then 'work.lead'
  else null end;
 if event_name is not null then insert into crm_audit_logs(actor_id,entity,entity_id,action,after_data)
  values(auth.uid(),'crm_companies',new.company_id,event_name,jsonb_build_object('work_session_id',new.id,'stage',new.stage,'state',new.state-'scratch')); end if;
 return new;
end $$;
create trigger lead_history after insert or update on public.crm_work_sessions for each row execute function public.crm_work_lead_history();
alter publication supabase_realtime add table public.crm_work_sessions;

create function public.crm_work_queue() returns table(company_id uuid,label text,rank integer,due_at timestamptz,follow_up_id uuid) language sql stable security definer set search_path=public,pg_temp as $$
 with eligible as (
  select c.* from crm_companies c where public.crm_role() in ('administrator','vertrieb')
   and not coalesce(c.blocked,false) and not coalesce(c.archived,false) and not coalesce(c.is_customer,false)
   and c.work_closed_at is null and c.status not in ('Kein Interesse','Kunde gewonnen')
   and not exists(select 1 from crm_work_sessions w where w.company_id=c.id and w.status in ('active','paused'))
   and not exists(select 1 from crm_work_sessions w where w.company_id=c.id and w.status='skipped' and w.skipped_until>now())
 ), candidates as (
  select c.id,c.name,
   case when (f.due_at at time zone 'Europe/Berlin')::date < (now() at time zone 'Europe/Berlin')::date then 1 else 2 end priority,f.due_at,f.id followup,c.priority cp
  from eligible c join lateral (select * from crm_follow_ups f where f.company_id=c.id and f.status<>'Abgeschlossen' and f.due_at<=now() order by f.due_at limit 1) f on true
  union all
  select c.id,c.name,case when c.contact_attempts>0 or c.last_contact is not null then 3 else 4 end,null::timestamptz,null::uuid,c.priority
  from eligible c where not exists(select 1 from crm_follow_ups f where f.company_id=c.id and f.status<>'Abgeschlossen')
   and not exists(select 1 from crm_work_sessions w where w.company_id=c.id and w.status='completed')
 ) select id,name,priority,due_at,followup from candidates order by priority,due_at nulls last,case cp when 'hoch' then 0 when 'normal' then 1 else 2 end,id limit 100;
$$;
revoke all on function public.crm_work_queue() from public; grant execute on function public.crm_work_queue() to authenticated;

create function public.crm_work_state() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare w crm_work_sessions; c crm_companies; day_start timestamptz=date_trunc('day',now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin'; day_end timestamptz=(date_trunc('day',now() at time zone 'Europe/Berlin')+interval '1 day') at time zone 'Europe/Berlin';
begin
 if public.crm_role() is null or public.crm_role() not in ('administrator','vertrieb') then raise exception 'Kein Zugriff'; end if;
 select * into w from crm_work_sessions where user_id=auth.uid() and status in ('active','paused') limit 1;
 if w.id is null then select * into w from crm_work_sessions where user_id=auth.uid() order by updated_at desc limit 1; end if;
 select * into c from crm_companies where id=w.company_id;
 return jsonb_build_object(
 'session',case when w.id is not null then to_jsonb(w) end,'company',case when c.id is not null then to_jsonb(c) end,
 'email',(select to_jsonb(e) from crm_emails e where e.id=w.email_id),
 'followup',(select to_jsonb(f) from crm_follow_ups f where f.id=w.source_follow_up),
 'lastEmail',(select to_jsonb(e) from crm_emails e where e.company_id=c.id and e.sent_at is not null order by e.sent_at desc limit 1),
 'calls',coalesce((select jsonb_agg(to_jsonb(t)) from (select * from crm_calls where company_id=c.id order by started_at desc limit 8)t),'[]'),
 'history',coalesce((select jsonb_agg(to_jsonb(t)) from (select * from crm_lead_status_history where company_id=c.id order by created_at desc limit 10)t),'[]'),
 'activity',coalesce((select jsonb_agg(to_jsonb(t)) from (select id,action,created_at from crm_audit_logs where entity='crm_companies' and entity_id=c.id and action like 'work.%' order by created_at desc limit 10)t),'[]'),
 'templates',coalesce((select jsonb_agg(to_jsonb(t)) from (select * from crm_email_templates order by name limit 100)t),'[]'),
 'documents',coalesce((select jsonb_agg(to_jsonb(t)) from (select id,name from crm_documents where company_id=c.id order by created_at desc limit 100)t),'[]'),
 'permissions',coalesce((select jsonb_agg(to_jsonb(p)) from crm_contact_permissions p where company_id=c.id and withdrawn_at is null),'[]'),
 'signature',coalesce((select data->>'signature' from crm_company_settings where key='business'),''),
 'queue',coalesce((select jsonb_agg(to_jsonb(q)) from crm_work_queue()q),'[]'),
 'stats',jsonb_build_object(
 'leads',(select count(distinct company_id) from crm_work_sessions where user_id=auth.uid() and status='completed' and completed_at>=day_start and completed_at<day_end),
 'emails',(select count(*) from crm_emails where sent_at>=day_start and sent_at<day_end and send_key is not null),
 'calls',(select count(*) from crm_calls where user_id=auth.uid() and provider<>'manual' and ended_at>=day_start and ended_at<day_end and duration>0),
 'followups',(select count(*) from crm_follow_ups f join crm_work_sessions s on s.id=f.work_session_id where s.user_id=auth.uid() and f.created_at>=day_start and f.created_at<day_end),
 'tasks',(select count(*) from crm_tasks where status<>'Erledigt')));
end $$;
revoke all on function public.crm_work_state() from public; grant execute on function public.crm_work_state() to authenticated;

create function public.crm_work_action(action_in text,session_in uuid default null,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare w crm_work_sessions; c crm_companies; f crm_follow_ups; e crm_emails; call_record crm_calls; picked record; next_due timestamptz; follow_id uuid; channel text; vals jsonb; existing uuid; attachments uuid[];
begin
 if public.crm_role() is null or public.crm_role() not in ('administrator','vertrieb') then raise exception 'Kein Zugriff'; end if;
 perform pg_advisory_xact_lock(hashtextextended('work-user:'||auth.uid()::text,0));
 if action_in in ('start','new','select') then
  select * into w from crm_work_sessions where user_id=auth.uid() and status in ('active','paused') for update;
  if w.id is not null then
   if action_in='start' then return to_jsonb(w); end if;
   if action_in<>'select' or w.company_id is not null then raise exception 'Aktuellen Vorgang zuerst überspringen oder abschließen'; end if;
  end if;
  if action_in='select' then
   select * into c from crm_companies where id=(payload->>'company_id')::uuid for update;
   if not found then raise exception 'Lead fehlt'; end if;
   select * into f from crm_follow_ups where company_id=c.id and status<>'Abgeschlossen' and due_at<=now() order by due_at limit 1;
   if f.id is null and exists(select 1 from crm_follow_ups where company_id=c.id and status<>'Abgeschlossen') then raise exception 'Für diesen Lead ist bereits eine künftige Wiedervorlage geplant'; end if;
   if exists(select 1 from crm_work_sessions where company_id=c.id and status='completed') and f.id is null then raise exception 'Lead bereits bearbeitet. Wiedervorlage abwarten'; end if;
  elsif action_in='start' then
   select * into picked from crm_work_queue() limit 1;
   if picked.company_id is null then return null; end if;
   select * into c from crm_companies where id=picked.company_id for update;
   select * into f from crm_follow_ups where id=picked.follow_up_id;
  end if;
  if c.id is not null and (coalesce(c.blocked,false) or coalesce(c.archived,false) or coalesce(c.is_customer,false) or c.work_closed_at is not null or c.status in ('Kein Interesse','Kunde gewonnen')) then raise exception 'Dieser Lead ist gesperrt oder abgeschlossen'; end if;
  if w.id is not null then update crm_work_sessions set company_id=c.id,source_follow_up=f.id,stage=2,state='{}' where id=w.id returning * into w;
  else insert into crm_work_sessions(user_id,company_id,source_follow_up,stage) values(auth.uid(),c.id,f.id,case when c.id is null then 1 else 2 end) returning * into w; end if;
  return to_jsonb(w);
 end if;
 select * into w from crm_work_sessions where id=session_in and user_id=auth.uid() for update;
 if not found then raise exception 'Vorgang fehlt'; end if;
 if w.status in ('completed','skipped') then
  if action_in in ('complete','skip','plan','close') then return to_jsonb(w); end if;
  raise exception 'Vorgang bereits beendet';
 end if;
 select * into c from crm_companies where id=w.company_id for update;
 if action_in='pause' then update crm_work_sessions set status='paused' where id=w.id returning * into w; return to_jsonb(w); end if;
 if action_in='resume' then update crm_work_sessions set status='active' where id=w.id returning * into w; return to_jsonb(w); end if;
 if action_in='skip' then update crm_work_sessions set status='skipped',skipped_until=now()+interval '1 day' where id=w.id returning * into w; return to_jsonb(w); end if;
 if c.id is not null and (coalesce(c.blocked,false) or coalesce(c.archived,false) or coalesce(c.is_customer,false) or c.work_closed_at is not null or c.status in ('Kein Interesse','Kunde gewonnen')) then
  if action_in not in ('close','complete','sync','scratch') then raise exception 'Lead gesperrt oder abgeschlossen. Vorgang beenden'; end if;
 end if;
 if action_in='scratch' then
  if length(payload::text)>35000 then raise exception 'Entwurf zu groß'; end if;
  update crm_work_sessions set state=state||jsonb_build_object('scratch',payload) where id=w.id;
 elsif action_in='lead' then
  vals=payload->'lead';
  if length(trim(vals->>'name')) not between 1 and 200 then raise exception 'Firmenname fehlt'; end if;
  perform pg_advisory_xact_lock(hashtextextended('work-lead:'||lower(trim(vals->>'name')),0));
  select id into existing from crm_companies where id is distinct from c.id and (
   lower(trim(name))=lower(trim(vals->>'name')) or (coalesce(vals->>'email','')<>'' and lower(email)=lower(vals->>'email')) or
   (coalesce(vals->>'phone','')<>'' and regexp_replace(phone,'[^0-9]','','g')=regexp_replace(vals->>'phone','[^0-9]','','g')) or
   (coalesce(vals->>'website','')<>'' and lower(rtrim(website,'/'))=lower(rtrim(vals->>'website','/')))) limit 1;
  if existing is not null then raise exception 'Unternehmen bereits vorhanden. Bitte vorhandenen Lead auswählen'; end if;
  if c.id is null then
   insert into crm_companies(name,website,contact_name,phone,email,status,created_by) values(trim(vals->>'name'),coalesce(vals->>'website',''),coalesce(vals->>'contact_name',''),coalesce(vals->>'phone',''),coalesce(vals->>'email',''),coalesce(vals->>'status','Neu'),auth.uid()) returning * into c;
  else update crm_companies set name=trim(vals->>'name'),website=coalesce(vals->>'website',''),contact_name=coalesce(vals->>'contact_name',''),phone=coalesce(vals->>'phone',''),email=coalesce(vals->>'email',''),status=coalesce(vals->>'status',status) where id=c.id returning * into c; end if;
  update crm_work_sessions set company_id=c.id,stage=greatest(stage,2),state=state-'scratch' where id=w.id returning * into w;
 elsif action_in='draft' then
  if c.id is null or w.contact_at is not null then raise exception 'Kein offener Kontakt-Schritt'; end if;
  select * into e from crm_emails where id=w.email_id for update;
  if e.id is not null and e.folder<>'draft' then raise exception 'Dieser Entwurf wurde bereits zum Versand übergeben'; end if;
  attachments=array(select value::uuid from jsonb_array_elements_text(coalesce(payload->'attachment_ids','[]')) as a(value));
  if cardinality(attachments)>5 then raise exception 'Höchstens fünf Anhänge'; end if;
  if e.id is null then
   insert into crm_emails(company_id,to_address,subject,body,purpose,attachment_ids) values(c.id,payload->>'to_address',payload->>'subject',payload->>'body','marketing',attachments) returning * into e;
   update crm_work_sessions set email_id=e.id where id=w.id;
  else update crm_emails set to_address=payload->>'to_address',subject=payload->>'subject',body=payload->>'body',attachment_ids=attachments where id=e.id; end if;
 elsif action_in='sync' then
  if w.contact_at is null then
   select * into e from crm_emails where id=w.email_id and sent_at is not null and send_key is not null;
   select * into call_record from crm_calls where company_id=c.id and started_at>=w.created_at and outcome<>'' and (provider='manual' or ended_at is not null) order by started_at desc limit 1;
   if e.id is not null then
    update crm_companies set status='E-Mail versendet',last_contact=e.sent_at where id=c.id;
    update crm_work_sessions set contact_at=e.sent_at,stage=greatest(stage,3),state=jsonb_set(state,'{scratch,view}','3',true) where id=w.id;
   elsif call_record.id is not null then
    update crm_work_sessions set call_id=call_record.id,contact_at=coalesce(call_record.ended_at,call_record.started_at),stage=greatest(stage,3),state=jsonb_set(state,'{scratch,view}','3',true) where id=w.id;
   end if;
  end if;
 elsif action_in='plan' then
  if w.state->>'mode'='closed' then raise exception 'Lead bereits abgeschlossen'; end if;
  if w.contact_at is null and w.source_follow_up is null then raise exception 'Zuerst Kontaktaufnahme dokumentieren'; end if;
  channel=payload->>'channel'; next_due=(payload->>'due')::timestamptz;
  if channel is null or channel not in ('email','phone') or next_due is null or next_due<=now() then raise exception 'Zukünftige Wiedervorlage und Kontaktweg erforderlich'; end if;
  if coalesce(c.blocked,false) then raise exception 'Kontakt gesperrt'; end if;
  select id into follow_id from crm_follow_ups where work_session_id=w.id;
  if follow_id is not null then
   update crm_follow_ups set due_at=next_due,notes=payload->>'reason',title=case channel when 'email' then 'Follow-up per E-Mail' else 'Follow-up per Telefon' end where id=follow_id;
  elsif w.source_follow_up is not null and w.contact_at is null then
   update crm_follow_ups set due_at=next_due,status='Geplant',notes=payload->>'reason' where id=w.source_follow_up returning id into follow_id;
  else
   insert into crm_follow_ups(company_id,title,due_at,notes,work_session_id) values(c.id,case channel when 'email' then 'Follow-up per E-Mail' else 'Follow-up per Telefon' end,next_due,payload->>'reason',w.id) returning id into follow_id;
  end if;
  insert into crm_tasks(company_id,title,description,due_at,work_follow_up_id) values(c.id,'Wiedervorlage: '||c.name,payload->>'reason',next_due,follow_id)
   on conflict(work_follow_up_id) do update set due_at=excluded.due_at,description=excluded.description,status='Offen';
  insert into crm_calendar_events(company_id,title,starts_at,ends_at,kind,notes,work_follow_up_id) values(c.id,case channel when 'email' then 'Follow-up per E-Mail: ' else 'Rückruf: ' end||c.name,next_due,next_due+interval '15 minutes','Wiedervorlage',payload->>'reason',follow_id)
   on conflict(work_follow_up_id) do update set title=excluded.title,starts_at=excluded.starts_at,ends_at=excluded.ends_at,notes=excluded.notes,status='Geplant';
  update crm_companies set next_contact=next_due,status='Später kontaktieren' where id=c.id;
  update crm_work_sessions set planned_at=now(),stage=4,state=jsonb_build_object('channel',channel,'due',next_due,'reason',payload->>'reason','mode',case when w.contact_at is null then 'reschedule' else 'followup' end) where id=w.id;
 elsif action_in='close' then
  if c.id is null then raise exception 'Kein Lead ausgewählt'; end if;
  update crm_companies set work_closed_at=now(),next_contact=null where id=c.id;
  update crm_follow_ups set status='Abgeschlossen' where company_id=c.id and status<>'Abgeschlossen';
  update crm_tasks set status='Erledigt' where work_follow_up_id in(select id from crm_follow_ups where company_id=c.id);
  update crm_calendar_events set status='Erledigt' where work_follow_up_id in(select id from crm_follow_ups where company_id=c.id);
  update crm_work_sessions set planned_at=now(),stage=4,state=jsonb_build_object('mode','closed') where id=w.id;
 elsif action_in='complete' then
  if w.stage<4 then raise exception 'Wiedervorlage oder Abschluss fehlt'; end if;
  if w.source_follow_up is not null and w.state->>'mode'<>'reschedule' then
   update crm_follow_ups set status='Abgeschlossen' where id=w.source_follow_up;
   update crm_tasks set status='Erledigt' where work_follow_up_id=w.source_follow_up;
   update crm_calendar_events set status='Erledigt' where work_follow_up_id=w.source_follow_up;
  end if;
  update crm_work_sessions set stage=5,status='completed',completed_at=now() where id=w.id;
 else raise exception 'Unbekannte Arbeitsaktion'; end if;
 select * into w from crm_work_sessions where id=w.id; return to_jsonb(w);
end $$;
revoke all on function public.crm_work_action(text,uuid,jsonb) from public; grant execute on function public.crm_work_action(text,uuid,jsonb) to authenticated;
-- Keep the existing call-completion operation. Within the wizard, its next
-- contact is planned once by crm_work_action, instead of creating two reminders.
create or replace function public.crm_finish_call(call_id_in uuid, outcome_in text, notes_in text, callback_in timestamptz) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c crm_calls; next_status text; wizard_active boolean;
begin
 if public.crm_role() is null or public.crm_role() not in ('administrator','vertrieb') then raise exception 'Kein Zugriff'; end if;
 if outcome_in not in ('Interessiert','Nicht erreicht','Kein Interesse','Später erneut anrufen','Follow-up-E-Mail senden','Angebot gewünscht','Kunde gewonnen') then raise exception 'Ungültiges Ergebnis'; end if;
 select * into c from crm_calls where id=call_id_in for update; if not found then raise exception 'Anruf fehlt'; end if;
 update crm_calls set outcome=outcome_in,notes=notes_in,user_id=coalesce(user_id,auth.uid()) where id=c.id;
 if c.company_id is not null then
  next_status=case outcome_in when 'Später erneut anrufen' then 'Später kontaktieren' when 'Follow-up-E-Mail senden' then 'Follow-up senden' when 'Angebot gewünscht' then 'Interessiert' else outcome_in end;
  update crm_companies set status=next_status,is_customer=case when next_status='Kunde gewonnen' then true else is_customer end,last_contact=now(),next_contact=callback_in where id=c.company_id;
  wizard_active=exists(select 1 from crm_work_sessions where company_id=c.company_id and user_id=auth.uid() and status in ('active','paused'));
  if not wizard_active then
   if callback_in is not null then insert into crm_calendar_events(company_id,title,starts_at,ends_at,kind,notes) values(c.company_id,'Rückruf',callback_in,callback_in+interval '30 minutes','Rückruf',notes_in); end if;
   if outcome_in='Follow-up-E-Mail senden' then insert into crm_follow_ups(company_id,title,due_at,notes) values(c.company_id,'Follow-up vorbereiten',coalesce(callback_in,now()),notes_in); end if;
  end if;
 end if;
end $$;
commit;
