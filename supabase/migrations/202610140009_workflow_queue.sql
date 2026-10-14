create function public.crm_pending_events(workflow_in uuid) returns setof uuid language sql security definer set search_path=public,pg_temp as $$ select e.id from crm_events e join crm_workflows w on w.id=workflow_in and w.enabled and w.trigger=e.name where (w.trigger<>'scheduled' or e.entity_id=w.id) and not exists(select 1 from crm_workflow_runs r where r.workflow_id=w.id and r.event_key=e.event_key) order by e.created_at limit 50 $$;
revoke all on function public.crm_pending_events(uuid) from public,anon,authenticated;grant execute on function public.crm_pending_events(uuid) to service_role;
create function public.crm_schedule_workflows() returns void language plpgsql security definer set search_path=public,pg_temp as $$ declare w crm_workflows;begin
 for w in select * from crm_workflows where enabled and trigger='scheduled' loop
  insert into crm_events(name,entity_id,event_key) values('scheduled',w.id,'scheduled:'||w.id||':'||(now() at time zone 'Europe/Berlin')::date) on conflict do nothing;
 end loop;end $$;
revoke all on function public.crm_schedule_workflows() from public,anon,authenticated;grant execute on function public.crm_schedule_workflows() to service_role;
