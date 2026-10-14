-- Private financial files follow the same role restrictions as invoices.
drop policy staff_read on public.crm_documents;
create policy staff_document_read on public.crm_documents for select to authenticated using(public.crm_role() is not null and (invoice_id is null or public.crm_role() in ('administrator','buchhaltung')));
drop policy crm_storage_read on storage.objects;
create policy crm_storage_read on storage.objects for select to authenticated using(bucket_id='crm-private' and exists(select 1 from public.crm_documents d where d.path=name));
create function public.crm_lookup_phone(number_in text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$ declare found jsonb; begin
 if auth.role()<>'service_role' and public.crm_role() is null then raise exception 'Kein Zugriff'; end if;
 select to_jsonb(c)||jsonb_build_object('person',coalesce(p.name,c.contact_name)) into found from crm_companies c left join crm_contacts p on p.company_id=c.id where regexp_replace(c.phone,'[^0-9]','','g')=regexp_replace(number_in,'[^0-9]','','g') or regexp_replace(p.phone,'[^0-9]','','g')=regexp_replace(number_in,'[^0-9]','','g') limit 1;
 return found;
end $$;
revoke all on function public.crm_lookup_phone(text) from public,anon;grant execute on function public.crm_lookup_phone(text) to authenticated,service_role;
-- Workflow run and its side effect commit together, not in separate HTTP transactions.
create function public.crm_run_event(workflow_in uuid,event_in uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$ declare w crm_workflows; e crm_events; cid uuid; inserted uuid; begin
 select * into w from crm_workflows where id=workflow_in and enabled for update;if not found then return false;end if;
 select * into e from crm_events where id=event_in and name=w.trigger;if not found then return false;end if;
 insert into crm_workflow_runs(workflow_id,event_key) values(w.id,e.event_key) on conflict do nothing returning id into inserted;if inserted is null then return false;end if;
 cid=e.entity_id;if e.name='scheduled' then cid=nullif(w.config->>'companyId','')::uuid;end if;if e.name like 'quote.%' then select company_id into cid from crm_quotes where id=e.entity_id;end if;
 if w.action='convert' and cid is not null then update crm_companies set is_customer=true,status='Kunde gewonnen' where id=cid;
 elsif w.action='task' then insert into crm_tasks(company_id,title,due_at) values(cid,coalesce(w.config->>'title',w.name),now());
 elsif w.action='notification' then insert into crm_notifications(title,href,event_key) values(coalesce(w.config->>'title',w.name),'/crm/leads/'||cid,'workflow:'||w.id||':'||e.event_key) on conflict do nothing;end if;
 return true;
end $$;
revoke all on function public.crm_run_event(uuid,uuid) from public,anon,authenticated;grant execute on function public.crm_run_event(uuid,uuid) to service_role;
create function public.crm_recurring_draft(schedule_in uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$ declare s crm_recurring_invoices;i crm_invoices; result uuid;begin
 select * into s from crm_recurring_invoices where id=schedule_in and enabled and next_on<=(now() at time zone 'Europe/Berlin')::date for update;if not found then return null;end if;
 select * into i from crm_invoices where id=s.invoice_id;
 insert into crm_invoices(company_id,original_id,title,service_date,due_on,discount) values(i.company_id,i.id,i.title,s.next_on,s.next_on+14,i.discount) returning id into result;
 insert into crm_invoice_items(invoice_id,description,quantity,unit_price,tax_rate,position) select result,description,quantity,unit_price,tax_rate,position from crm_invoice_items where invoice_id=i.id;
 update crm_recurring_invoices set next_on=(s.next_on+make_interval(months=>s.interval_months))::date where id=s.id;
 insert into crm_notifications(title,href,event_key) values('Wiederkehrender Rechnungsentwurf','/crm/rechnungen/'||result,'recurring:'||s.id||':'||s.next_on);
 return result;end $$;
revoke all on function public.crm_recurring_draft(uuid) from public,anon,authenticated;grant execute on function public.crm_recurring_draft(uuid) to service_role;
-- Payment records cannot silently replace already documented receipts.
revoke update,delete on public.crm_payments from authenticated;
-- Private query rate buckets used by the server (no customer payloads).
create table public.crm_rate_limits(key text primary key,count integer not null,expires timestamptz not null);
alter table public.crm_rate_limits enable row level security;
create function public.crm_rate_limit(key_in text,limit_in integer,seconds_in integer) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$ declare n integer;begin
 delete from crm_rate_limits where expires<now();
 insert into crm_rate_limits(key,count,expires) values(key_in,1,now()+make_interval(secs=>seconds_in)) on conflict(key) do update set count=crm_rate_limits.count+1 returning count into n;
 return n<=limit_in;end $$;
revoke all on function public.crm_rate_limit(text,integer,integer) from public,anon,authenticated;grant execute on function public.crm_rate_limit(text,integer,integer) to service_role;
