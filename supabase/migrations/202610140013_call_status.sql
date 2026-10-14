create function public.crm_call_status(event_in text,sid_in text,status_in text,duration_in integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare inserted uuid;begin
 insert into crm_webhook_events(provider,event_key) values('twilio',event_in) on conflict do nothing returning id into inserted;if inserted is null then return;end if;
 if not exists(select 1 from crm_calls where provider_sid=sid_in) then raise exception 'Anruf noch nicht gespeichert';end if;
 if status_in in ('completed','failed','busy','no-answer','canceled') then update crm_calls set status=status_in,ended_at=now(),duration=greatest(0,duration_in) where provider_sid=sid_in;
 else update crm_calls set status=status_in where provider_sid=sid_in and ended_at is null;end if;end $$;
revoke all on function public.crm_call_status(text,text,text,integer) from public,anon,authenticated;grant execute on function public.crm_call_status(text,text,text,integer) to service_role;
