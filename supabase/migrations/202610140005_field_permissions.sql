-- Column privileges stop authenticated API clients from fabricating issued documents.
revoke insert,update on public.crm_invoices from authenticated;
grant insert(company_id,quote_id,original_id,title,kind,service_date,due_on,discount) on public.crm_invoices to authenticated;
grant update(company_id,quote_id,original_id,title,kind,service_date,due_on,discount) on public.crm_invoices to authenticated;
revoke insert,update on public.crm_quotes from authenticated;
grant insert(company_id,title,previous_id,version,valid_until,service_date,terms,discount) on public.crm_quotes to authenticated;
grant update(company_id,title,valid_until,service_date,terms,discount,status) on public.crm_quotes to authenticated;
revoke insert,update on public.crm_calls from authenticated;
grant insert(company_id,user_id,phone,direction,duration,outcome,notes) on public.crm_calls to authenticated;
grant update(outcome,notes,duration) on public.crm_calls to authenticated;
create function public.crm_quote_status_check() returns trigger language plpgsql as $$begin if new.status<>'Entwurf' and new.issued_at is null then raise exception 'Ein Entwurf kann erst nach Ausstellung den Dokumentstatus wechseln';end if;return new;end $$;
create trigger quote_status_check before insert or update on public.crm_quotes for each row execute function public.crm_quote_status_check();
create policy accounting_documents_insert on public.crm_documents for insert to authenticated with check(public.crm_role()='buchhaltung');
create policy accounting_documents_update on public.crm_documents for update to authenticated using(public.crm_role()='buchhaltung') with check(public.crm_role()='buchhaltung');
