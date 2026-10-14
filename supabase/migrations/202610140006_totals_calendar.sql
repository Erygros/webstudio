create or replace function public.crm_protect_item() returns trigger language plpgsql as $$ declare locked boolean; begin
 if tg_table_name='crm_quote_items' then select exists(select 1 from crm_quotes where id in(new.quote_id,old.quote_id) and issued_at is not null) into locked;
 else select exists(select 1 from crm_invoices where id in(new.invoice_id,old.invoice_id) and issued_at is not null) into locked;end if;
 if locked then raise exception 'Positionen/Anzahlungsverrechnungen eines ausgestellten Dokuments sind unveränderlich.';end if;return coalesce(new,old);end $$;
create function public.crm_draft_total() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ declare small_business boolean; amount numeric;begin
 if new.issued_at is not null then return new;end if;
 select coalesce((data->>'smallBusiness')::boolean,true) into small_business from crm_company_settings where key='business';
 if tg_table_name='crm_quotes' then select coalesce(sum(round(quantity*unit_price*(1-coalesce(new.discount,0)/100)*(1+case when small_business then 0 else tax_rate/100 end),2)),0) into amount from crm_quote_items where quote_id=new.id;
 else select coalesce(sum(round(quantity*unit_price*(1-coalesce(new.discount,0)/100)*(1+case when small_business then 0 else tax_rate/100 end),2)),0) into amount from crm_invoice_items where invoice_id=new.id;end if;
 new.total=amount;return new;end $$;
create trigger draft_total before insert or update on public.crm_quotes for each row execute function public.crm_draft_total();
create trigger draft_total before insert or update on public.crm_invoices for each row execute function public.crm_draft_total();
create function public.crm_refresh_draft() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if tg_table_name='crm_quote_items' then update crm_quotes set updated_at=now() where id in(new.quote_id,old.quote_id);else update crm_invoices set updated_at=now() where id in(new.invoice_id,old.invoice_id);end if;return coalesce(new,old);end $$;
create trigger refresh_draft after insert or update or delete on public.crm_quote_items for each row execute function public.crm_refresh_draft();
create trigger refresh_draft after insert or update or delete on public.crm_invoice_items for each row execute function public.crm_refresh_draft();
alter table public.crm_calendar_events add constraint crm_confirmed_no_overlap exclude using gist (tstzrange(starts_at,ends_at,'[)') with &&) where(status='Bestätigt');
