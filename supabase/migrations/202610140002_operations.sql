-- Fix ambiguity, permission checks and add atomic business operations.
create table public.crm_operations (request_key uuid primary key, operation text not null, result_id uuid not null, actor_id uuid not null references public.crm_users(id), created_at timestamptz default now());
alter table public.crm_operations enable row level security;
create table public.crm_events (id uuid primary key default gen_random_uuid(), name text not null, entity_id uuid not null, event_key text not null unique, created_at timestamptz default now());
alter table public.crm_events enable row level security;
create function public.crm_emit_event() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ begin
 if tg_table_name='crm_companies' and tg_op='INSERT' then insert into crm_events(name,entity_id,event_key) values('lead.created',new.id,'lead:'||new.id) on conflict do nothing;
 elsif tg_table_name='crm_quotes' and new.issued_at is not null and old.issued_at is null then insert into crm_events(name,entity_id,event_key) values('quote.issued',new.id,'quote-issued:'||new.id) on conflict do nothing;
 elsif tg_table_name='crm_quotes' and new.status='Angenommen' and old.status<>'Angenommen' then insert into crm_events(name,entity_id,event_key) values('quote.accepted',new.id,'quote-accepted:'||new.id) on conflict do nothing; end if; return new; end $$;
create trigger events after insert on public.crm_companies for each row execute function public.crm_emit_event();
create trigger events after update on public.crm_quotes for each row execute function public.crm_emit_event();
create function public.crm_document_operation(operation text, source_id uuid, request_key_in uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$ declare result uuid; q crm_quotes; i crm_invoices; role text=public.crm_role(); begin
 if role is null then raise exception 'Kein Zugriff'; end if;
 select result_id into result from crm_operations where request_key=request_key_in and actor_id=auth.uid(); if result is not null then return result; end if;
 if operation in ('quote.clone','quote.invoice') then
  select * into q from crm_quotes where id=source_id for update; if not found then raise exception 'Angebot fehlt'; end if;
  if operation='quote.clone' and role in ('administrator','vertrieb','buchhaltung') then
   insert into crm_quotes(company_id,title,previous_id,version,valid_until,service_date,terms,discount) values(q.company_id,q.title,q.id,q.version+1,q.valid_until,q.service_date,q.terms,q.discount) returning id into result;
   insert into crm_quote_items(quote_id,description,quantity,unit_price,tax_rate,position) select result,description,quantity,unit_price,tax_rate,position from crm_quote_items where quote_id=q.id;
  elsif operation='quote.invoice' and role in ('administrator','buchhaltung') then
   insert into crm_invoices(company_id,quote_id,title,service_date,discount,due_on) values(q.company_id,q.id,q.title,q.service_date,q.discount,(now() at time zone 'Europe/Berlin')::date+14) returning id into result;
   insert into crm_invoice_items(invoice_id,description,quantity,unit_price,tax_rate,position) select result,description,quantity,unit_price,tax_rate,position from crm_quote_items where quote_id=q.id;
  else raise exception 'Kein Zugriff'; end if;
 elsif operation in ('invoice.clone','invoice.cancel') and role in ('administrator','buchhaltung') then
  select * into i from crm_invoices where id=source_id for update; if not found then raise exception 'Rechnung fehlt'; end if;
  if operation='invoice.cancel' then
   if i.issued_at is null or i.document_status='Storniert' or i.kind='Storno' then raise exception 'Keine stornierbare Rechnung'; end if;
   insert into crm_invoices(company_id,original_id,title,kind,service_date,discount) values(i.company_id,i.id,'Storno zu '||i.number,'Storno',i.service_date,i.discount) returning id into result;
  else insert into crm_invoices(company_id,original_id,title,kind,service_date,due_on,discount) values(i.company_id,i.id,i.title,case when i.kind='Storno' then 'Rechnung' else i.kind end,(now() at time zone 'Europe/Berlin')::date,(now() at time zone 'Europe/Berlin')::date+14,i.discount) returning id into result; end if;
  insert into crm_invoice_items(invoice_id,description,quantity,unit_price,tax_rate,position) select result,description,quantity,unit_price,tax_rate,position from crm_invoice_items where invoice_id=i.id;
 else raise exception 'Aktion nicht erlaubt'; end if;
 insert into crm_operations(request_key,operation,result_id,actor_id) values(request_key_in,operation,result,auth.uid()); return result;
end $$;
revoke all on function public.crm_document_operation(text,uuid,uuid) from public; grant execute on function public.crm_document_operation(text,uuid,uuid) to authenticated;
create function public.crm_finish_call(call_id_in uuid, outcome_in text, notes_in text, callback_in timestamptz) returns void language plpgsql security definer set search_path=public,pg_temp as $$ declare c crm_calls; next_status text; begin
 if public.crm_role() is null or public.crm_role() not in ('administrator','vertrieb') then raise exception 'Kein Zugriff'; end if;
 if outcome_in not in ('Interessiert','Nicht erreicht','Kein Interesse','Später erneut anrufen','Follow-up-E-Mail senden','Angebot gewünscht','Kunde gewonnen') then raise exception 'Ungültiges Ergebnis'; end if;
 select * into c from crm_calls where id=call_id_in for update; if not found then raise exception 'Anruf fehlt'; end if;
 update crm_calls set outcome=outcome_in,notes=notes_in where id=c.id;
 if c.company_id is not null then
  next_status=case outcome_in when 'Später erneut anrufen' then 'Später kontaktieren' when 'Follow-up-E-Mail senden' then 'Follow-up senden' when 'Angebot gewünscht' then 'Interessiert' else outcome_in end;
  update crm_companies set status=next_status,is_customer=case when next_status='Kunde gewonnen' then true else is_customer end,last_contact=now(),next_contact=callback_in where id=c.company_id;
  if callback_in is not null then insert into crm_calendar_events(company_id,title,starts_at,ends_at,kind,notes) values(c.company_id,'Rückruf',callback_in,callback_in+interval '30 minutes','Rückruf',notes_in); end if;
  if outcome_in='Follow-up-E-Mail senden' then insert into crm_follow_ups(company_id,title,due_at,notes) values(c.company_id,'Follow-up vorbereiten',coalesce(callback_in,now()),notes_in); end if;
 end if;
end $$;
revoke all on function public.crm_finish_call(uuid,text,text,timestamptz) from public; grant execute on function public.crm_finish_call(uuid,text,text,timestamptz) to authenticated;
create function public.crm_count_attempt() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ begin if new.direction='outbound' and new.company_id is not null then update crm_companies set contact_attempts=contact_attempts+1,last_contact=new.started_at where id=new.company_id; end if; return new; end $$;
create trigger count_attempt after insert on public.crm_calls for each row execute function public.crm_count_attempt();
create table public.crm_push_subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.crm_users(id), endpoint text not null unique, subscription jsonb not null, created_at timestamptz default now());
alter table public.crm_push_subscriptions enable row level security;
create policy own_subscription on public.crm_push_subscriptions for all to authenticated using(user_id=auth.uid() and public.crm_role() is not null) with check(user_id=auth.uid() and public.crm_role() is not null);
