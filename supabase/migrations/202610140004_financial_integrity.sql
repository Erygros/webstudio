create trigger protect before insert or update or delete on public.crm_invoice_deductions for each row execute function public.crm_protect_item();
create function public.crm_payment_check() returns trigger language plpgsql as $$ declare bill crm_invoices; paid numeric;begin
 select * into bill from crm_invoices where id=new.invoice_id for update;
 if bill.issued_at is null or bill.document_status='Storniert' or bill.kind='Storno' then raise exception 'Zahlungen nur auf gültige ausgestellte Rechnungen';end if;
 select coalesce(sum(amount),0) into paid from crm_payments where invoice_id=new.invoice_id;
 if paid+new.amount>bill.total then raise exception 'Zahlung übersteigt den offenen Rechnungsbetrag';end if;return new;end $$;
create trigger payment_check before insert on public.crm_payments for each row execute function public.crm_payment_check();
-- The original is only cancelled once a matching cancellation is itself issued.
create function public.crm_credit_amount() returns trigger language plpgsql as $$ declare original crm_invoices;begin
 if new.kind='Storno' and new.issued_at is not null and old.issued_at is null then
  select * into original from crm_invoices where id=new.original_id for update;
  if original.issued_at is null or original.kind='Storno' or original.document_status='Storniert' or original.company_id<>new.company_id then raise exception 'Ungültiger Stornobezug';end if;
  new.total=-original.total;
  new.snapshot=jsonb_set(new.snapshot,'{items}',original.snapshot->'items');
  new.snapshot=jsonb_set(new.snapshot,'{document,discount}',coalesce(original.snapshot#>'{document,discount}','0'::jsonb));
  new.snapshot=jsonb_set(jsonb_set(jsonb_set(jsonb_set(new.snapshot,'{total}',to_jsonb(new.total)),'{originalNumber}',to_jsonb(original.number)),'{subtotal}',to_jsonb(-coalesce((original.snapshot->>'subtotal')::numeric,original.total))),'{deducted}',to_jsonb(-original.deducted));
  update crm_invoices set document_status='Storniert' where id=original.id;
 elsif new.kind='Korrektur' and new.issued_at is not null and old.issued_at is null then
  select * into original from crm_invoices where id=new.original_id;
  if original.document_status is distinct from 'Storniert' or original.company_id<>new.company_id then raise exception 'Korrektur erfordert eine bereits stornierte Ursprungsrechnung';end if;
  new.snapshot=jsonb_set(new.snapshot,'{originalNumber}',to_jsonb(original.number));
 end if;return new;end $$;
create trigger credit_amount before update on public.crm_invoices for each row execute function public.crm_credit_amount();
-- Audit retention and immutable PDFs: no client-side modification of protected document metadata.
create function public.crm_guard_file() returns trigger language plpgsql as $$ begin
 if old.immutable or old.retained_until>=(now() at time zone 'Europe/Berlin')::date then
  if tg_op='DELETE' or (to_jsonb(new)-'updated_at'-'name'-'category') is distinct from (to_jsonb(old)-'updated_at'-'name'-'category') then raise exception 'Datei steht unter Dokumentenschutz oder Aufbewahrung';end if;
 end if;return coalesce(new,old);end $$;
create trigger guard_file before update or delete on public.crm_documents for each row execute function public.crm_guard_file();
-- Accounting users may issue quotes and access their line items too.
create policy quote_accounting_write on public.crm_quotes for all to authenticated using(public.crm_role()='buchhaltung') with check(public.crm_role()='buchhaltung');
create policy quote_items_accounting_write on public.crm_quote_items for all to authenticated using(public.crm_role()='buchhaltung') with check(public.crm_role()='buchhaltung');
