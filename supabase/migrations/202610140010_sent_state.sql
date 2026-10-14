create function public.crm_quote_sent_event() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if new.status='Versendet' and old.status<>'Versendet' then insert into crm_events(name,entity_id,event_key) values('quote.sent',new.id,'quote-sent:'||new.id) on conflict do nothing;end if;return new;end $$;
create trigger quote_sent_event after update on public.crm_quotes for each row execute function public.crm_quote_sent_event();
