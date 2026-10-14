-- Webstudio CRM: vollständige Einrichtung für NEUE Projekte.
-- Auf bestehenden Projekten nur noch fehlende einzelne Migrationen ausführen.
BEGIN;

-- ===== 202610140001_crm.sql =====

-- Webstudio Expert CRM. Run once in a NEW Supabase project; never disables RLS.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create table public.crm_roles (name text primary key check(name in ('administrator','vertrieb','buchhaltung')));
insert into public.crm_roles values ('administrator'),('vertrieb'),('buchhaltung');
create table public.crm_users (id uuid primary key references auth.users(id) on delete cascade, name text not null, role text not null references public.crm_roles(name), enabled boolean not null default true, created_at timestamptz not null default now());
create function public.crm_role() returns text language sql stable security definer set search_path=public,pg_temp as $$ select role from public.crm_users where id=auth.uid() and enabled $$;
revoke all on function public.crm_role() from public; grant execute on function public.crm_role() to authenticated;
create table public.crm_companies (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 200), industry text default '', website text default '', phone text default '', email text default '', contact_name text default '', street text default '', house_number text default '', postcode text default '', city text default '', country text default 'Deutschland', source text default 'Manuell', priority text default 'normal' check(priority in ('niedrig','normal','hoch')), status text not null default 'Neu' check(status in ('Neu','Kontaktiert','Nicht erreicht','Kein Interesse','Follow-up senden','Follow-up gesendet','Interessiert','Kunde gewonnen','Später kontaktieren')), is_customer boolean not null default false, archived boolean default false, blocked boolean default false, estimated_value numeric(14,2) default 0 check(estimated_value>=0), notes text default '', last_contact timestamptz, next_contact timestamptz, contact_attempts integer default 0, created_by uuid references public.crm_users(id), created_at timestamptz default now(), updated_at timestamptz default now());
create index crm_company_search on public.crm_companies using gin(name gin_trgm_ops);
create unique index crm_company_email_unique on public.crm_companies(lower(email)) where email<>'';
create table public.crm_contacts (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id) on delete cascade, name text not null, position text default '', phone text default '', email text default '', notes text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_contact_permissions (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id) on delete cascade, channel text not null check(channel in ('phone','email','sms')), basis text not null, evidence text not null check(length(evidence)>=10), granted_at timestamptz default now(), withdrawn_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_lead_status_history (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id) on delete cascade, old_status text, new_status text not null, actor_id uuid references public.crm_users(id), created_at timestamptz default now());
create table public.crm_calls (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), user_id uuid references public.crm_users(id), phone text not null, direction text not null default 'outbound' check(direction in ('inbound','outbound')), provider text not null default 'manual', provider_sid text unique, status text default 'documented', started_at timestamptz default now(), ended_at timestamptz, duration integer default 0 check(duration>=0), outcome text default '', notes text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_call_recordings (id uuid primary key default gen_random_uuid(), call_id uuid references public.crm_calls(id), consent_evidence jsonb not null, path text not null, retained_until timestamptz not null, created_at timestamptz default now(), check(jsonb_typeof(consent_evidence)='array' and jsonb_array_length(consent_evidence)>1));
create table public.crm_webhook_events (id uuid primary key default gen_random_uuid(), provider text not null, event_key text not null, created_at timestamptz default now(), unique(provider,event_key));
create table public.crm_email_accounts (id uuid primary key default gen_random_uuid(), name text not null, address text not null unique, last_uid bigint default 0, uid_validity text default '', sync_lease timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_emails (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), account_id uuid references public.crm_email_accounts(id), folder text not null default 'draft' check(folder in ('inbox','sent','draft','archive','sending','unknown','failed')), from_address text default '', to_address text not null, subject text not null, body text not null default '', purpose text not null default 'operational' check(purpose in ('operational','marketing')), message_id text unique, sync_key text unique, send_key uuid unique, sent_at timestamptz, error text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_email_templates (id uuid primary key default gen_random_uuid(), name text not null, subject text not null, body text not null, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_follow_ups (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id), title text not null, due_at timestamptz not null, status text not null default 'Geplant' check(status in ('Geplant','Fällig','E-Mail gesendet','Antwort erhalten','Abgeschlossen')), template_id uuid references public.crm_email_templates(id), email_id uuid references public.crm_emails(id), notes text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_projects (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id), name text not null, description text default '', status text not null default 'Geplant' check(status in ('Geplant','In Arbeit','Wartet auf Kunden','Abnahme','Abgeschlossen')), starts_on date, due_on date, budget numeric(14,2) default 0 check(budget>=0), created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_tasks (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), project_id uuid references public.crm_projects(id), title text not null, description text default '', priority text default 'normal' check(priority in ('niedrig','normal','hoch')), status text default 'Offen' check(status in ('Offen','In Arbeit','Erledigt')), due_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_project_tasks (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.crm_projects(id) on delete cascade, title text not null, kind text default 'task' check(kind in ('task','checklist','milestone')), done boolean default false, due_on date, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_time_entries (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.crm_projects(id), user_id uuid references public.crm_users(id), description text not null, minutes integer not null check(minutes>0), hourly_rate numeric(12,2) not null default 0 check(hourly_rate>=0), worked_on date not null default (now() at time zone 'Europe/Berlin')::date, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_calendar_events (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), project_id uuid references public.crm_projects(id), title text not null, starts_at timestamptz not null, ends_at timestamptz not null, status text default 'Geplant' check(status in ('Angefragt','Geplant','Bestätigt','Abgesagt','Erledigt')), kind text default 'Termin', recurrence text default '' check(recurrence in ('','weekly','monthly')), notes text default '', created_at timestamptz default now(), updated_at timestamptz default now(), check(ends_at>starts_at));
create table public.crm_company_settings (id uuid primary key default gen_random_uuid(), key text not null unique, data jsonb not null default '{}', created_at timestamptz default now(), updated_at timestamptz default now());
insert into public.crm_company_settings(key,data) values ('business','{"name":"Webstudio Expert","owner":"Enrico Gross","street":"Karinstraße 5","postcode":"44388","city":"Dortmund","email":"kontakt@webstudio-expert.de","phone":"+49 155 67504871","smallBusiness":true,"taxNumber":"","vatId":"","iban":"","paymentDays":14,"signature":"Enrico Gross\nWebstudio Expert\nkontakt@webstudio-expert.de\n+49 155 67504871"}');
create table public.crm_number_counters (kind text not null, year integer not null, value integer not null default 0, primary key(kind,year));
create table public.crm_quotes (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id), number text unique, version integer not null default 1, previous_id uuid references public.crm_quotes(id), title text not null, status text default 'Entwurf' check(status in ('Entwurf','Ausgestellt','Versendet','Angenommen','Abgelehnt','Abgelaufen')), valid_until date, service_date date, terms text default 'Zahlung nach Vereinbarung', discount numeric(5,2) default 0 check(discount between 0 and 100), total numeric(14,2) not null default 0, snapshot jsonb, issued_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_quote_items (id uuid primary key default gen_random_uuid(), quote_id uuid not null references public.crm_quotes(id) on delete cascade, description text not null, quantity numeric(12,3) not null default 1 check(quantity>0), unit_price numeric(14,2) not null check(unit_price>=0), tax_rate numeric(5,2) default 0 check(tax_rate between 0 and 100), position integer default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_invoices (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id), quote_id uuid references public.crm_quotes(id), original_id uuid references public.crm_invoices(id), number text unique, title text not null, document_status text default 'Entwurf' check(document_status in ('Entwurf','Ausgestellt','Storniert')), payment_status text default 'Offen' check(payment_status in ('Offen','Teilweise bezahlt','Bezahlt','Überfällig')), kind text default 'Rechnung' check(kind in ('Rechnung','Anzahlung','Schlussrechnung','Storno','Korrektur')), service_date date, due_on date, discount numeric(5,2) default 0 check(discount between 0 and 100), total numeric(14,2) not null default 0, deducted numeric(14,2) not null default 0, snapshot jsonb, issued_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_invoice_items (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.crm_invoices(id) on delete cascade, description text not null, quantity numeric(12,3) not null default 1 check(quantity>0), unit_price numeric(14,2) not null check(unit_price>=0), tax_rate numeric(5,2) default 0 check(tax_rate between 0 and 100), position integer default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_payments (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.crm_invoices(id), amount numeric(14,2) not null check(amount>0), paid_on date not null default (now() at time zone 'Europe/Berlin')::date, reference text default '', created_at timestamptz default now());
create table public.crm_invoice_deductions (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.crm_invoices(id), advance_id uuid not null references public.crm_invoices(id), unique(invoice_id,advance_id), unique(advance_id), check(invoice_id<>advance_id));
create table public.crm_recurring_invoices (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.crm_invoices(id), next_on date not null, interval_months integer default 1 check(interval_months>0), enabled boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_contracts (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.crm_companies(id), project_id uuid references public.crm_projects(id), title text not null, starts_on date, ends_on date, notes text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_documents (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), project_id uuid references public.crm_projects(id), quote_id uuid references public.crm_quotes(id), invoice_id uuid references public.crm_invoices(id), name text not null, category text default 'Allgemein', path text not null unique, mime text not null, size bigint not null check(size>=0), immutable boolean default false, retained_until date, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_notifications (id uuid primary key default gen_random_uuid(), user_id uuid references public.crm_users(id), title text not null, href text not null default '/crm', event_key text unique, read_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_integrations (id uuid primary key default gen_random_uuid(), provider text not null unique, enabled boolean default false, encrypted_config text, config jsonb default '{}', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_workflows (id uuid primary key default gen_random_uuid(), name text not null, trigger text not null check(trigger in ('lead.created','quote.issued','quote.sent','quote.accepted','scheduled')), action text not null check(action in ('task','notification','convert')), enabled boolean default true, config jsonb default '{}', created_at timestamptz default now(), updated_at timestamptz default now());
create table public.crm_workflow_runs (id uuid primary key default gen_random_uuid(), workflow_id uuid references public.crm_workflows(id), event_key text not null, created_at timestamptz default now(), unique(workflow_id,event_key));
create table public.crm_audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid, entity text not null, entity_id uuid, action text not null, before_data jsonb, after_data jsonb, created_at timestamptz default now());
create table public.crm_website_inquiries (id uuid primary key default gen_random_uuid(), company_id uuid references public.crm_companies(id), request_key text not null unique, data jsonb not null, created_at timestamptz default now());
create table public.crm_job_runs (key text primary key, lease_until timestamptz not null, last_success timestamptz);

-- RLS: only provisioned, enabled staff. Private credentials never exposed through RLS.
do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='public' and tablename like 'crm_%' loop
  execute format('alter table public.%I enable row level security',t);
  if t not in ('crm_integrations','crm_number_counters','crm_webhook_events','crm_job_runs','crm_workflow_runs') then
   execute format('create policy staff_read on public.%I for select to authenticated using(public.crm_role() is not null)',t);
  end if;
  if t in ('crm_company_settings','crm_workflows','crm_email_accounts','crm_recurring_invoices') then
   execute format('create policy admin_write on public.%I for all to authenticated using(public.crm_role()=''administrator'') with check(public.crm_role()=''administrator'')',t);
  elsif t in ('crm_invoices','crm_invoice_items','crm_payments','crm_invoice_deductions') then
   execute format('create policy accounting_write on public.%I for all to authenticated using(public.crm_role() in (''administrator'',''buchhaltung'')) with check(public.crm_role() in (''administrator'',''buchhaltung''))',t);
  elsif t not in ('crm_users','crm_roles','crm_integrations','crm_number_counters','crm_webhook_events','crm_job_runs','crm_workflow_runs','crm_audit_logs','crm_lead_status_history','crm_call_recordings','crm_website_inquiries') then
   execute format('create policy staff_write on public.%I for all to authenticated using(public.crm_role() in (''administrator'',''vertrieb'')) with check(public.crm_role() in (''administrator'',''vertrieb''))',t);
  end if;
 end loop;
end $$;
-- Read accounting data only for accounting/admin. Sales can access quotes.
do $$ declare t text; begin
 foreach t in array array['crm_invoices','crm_invoice_items','crm_payments','crm_invoice_deductions','crm_audit_logs','crm_company_settings'] loop
  execute format('drop policy staff_read on public.%I',t);
  execute format('create policy restricted_read on public.%I for select to authenticated using(public.crm_role() in (''administrator'',''buchhaltung''))',t);
 end loop;
end $$;

create function public.crm_audit() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ begin
 insert into crm_audit_logs(actor_id,entity,entity_id,action,before_data,after_data) values(auth.uid(),tg_table_name,coalesce(new.id,old.id),tg_op,case when tg_op<>'INSERT' then to_jsonb(old) end,case when tg_op<>'DELETE' then to_jsonb(new) end);
 if tg_table_name='crm_companies' and tg_op='UPDATE' and new.status is distinct from old.status then insert into crm_lead_status_history(company_id,old_status,new_status,actor_id) values(new.id,old.status,new.status,auth.uid()); end if;
 return coalesce(new,old); end $$;
create function public.crm_touch() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin
 foreach t in array array['crm_companies','crm_contacts','crm_contact_permissions','crm_calls','crm_emails','crm_follow_ups','crm_projects','crm_tasks','crm_calendar_events','crm_quotes','crm_invoices','crm_payments','crm_documents','crm_company_settings','crm_contracts'] loop
  execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.crm_audit()',t);
 end loop;
 for t in select table_name from information_schema.columns where table_schema='public' and table_name like 'crm_%' and column_name='updated_at' loop
  execute format('create trigger touch before update on public.%I for each row execute function public.crm_touch()',t);
 end loop;
end $$;
create function public.crm_protect_document() returns trigger language plpgsql as $$ begin
 if (to_jsonb(old)->>'issued_at') is not null and current_setting('crm.issuing',true) is distinct from 'on' then
  if tg_op='DELETE' or (to_jsonb(new)-'updated_at'-'status'-'payment_status'-'document_status') is distinct from (to_jsonb(old)-'updated_at'-'status'-'payment_status'-'document_status') then raise exception 'Ausgestellte Dokumente sind unveränderlich. Neue Version oder Storno verwenden.'; end if;
 end if;
 return coalesce(new,old); end $$;
create trigger protect before update or delete on public.crm_quotes for each row execute function public.crm_protect_document();
create trigger protect before update or delete on public.crm_invoices for each row execute function public.crm_protect_document();
create function public.crm_protect_item() returns trigger language plpgsql as $$ declare issued timestamptz; begin
 if tg_table_name='crm_quote_items' then select issued_at into issued from crm_quotes where id=coalesce(new.quote_id,old.quote_id); else select issued_at into issued from crm_invoices where id=coalesce(new.invoice_id,old.invoice_id); end if;
 if issued is not null then raise exception 'Positionen eines ausgestellten Dokuments sind unveränderlich.'; end if; return coalesce(new,old); end $$;
create trigger protect before insert or update or delete on public.crm_quote_items for each row execute function public.crm_protect_item();
create trigger protect before insert or update or delete on public.crm_invoice_items for each row execute function public.crm_protect_item();
create function public.crm_payment_state() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ declare iid uuid; paid numeric; due numeric; begin
 iid=coalesce(new.invoice_id,old.invoice_id); select coalesce(sum(amount),0) into paid from crm_payments where invoice_id=iid; select total into due from crm_invoices where id=iid;
 update crm_invoices set payment_status=case when paid>=due then 'Bezahlt' when paid>0 then 'Teilweise bezahlt' else 'Offen' end where id=iid; return coalesce(new,old); end $$;
create trigger payment_state after insert or update or delete on public.crm_payments for each row execute function public.crm_payment_state();

-- Issuance is atomic. Numeric calculations, locked counters, frozen business/customer/items.
create function public.crm_issue(doc_kind text, doc_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare doc jsonb; biz jsonb; customer jsonb; lines jsonb; amount numeric; deduction numeric=0; yr integer=extract(year from (now() at time zone 'Europe/Berlin')::date); num integer; doc_number text; frozen jsonb; adv record;
begin
 if public.crm_role() is null or public.crm_role() not in ('administrator','buchhaltung') and not(doc_kind='quote' and public.crm_role()='vertrieb') then raise exception 'Kein Zugriff'; end if;
 select data into biz from crm_company_settings where key='business';
 if doc_kind='invoice' and coalesce(biz->>'taxNumber','')='' and coalesce(biz->>'vatId','')='' then raise exception 'Steuernummer oder USt-ID in den CRM-Einstellungen fehlt.'; end if;
 if doc_kind='quote' then
  select to_jsonb(q) into doc from crm_quotes q where id=doc_id for update;
  select jsonb_agg(to_jsonb(i) order by position,created_at),sum(round(quantity*unit_price*(1-coalesce((doc->>'discount')::numeric,0)/100)*(1+case when (biz->>'smallBusiness')::boolean then 0 else tax_rate/100 end),2)) into lines,amount from crm_quote_items i where quote_id=doc_id;
 elsif doc_kind='invoice' then
  select to_jsonb(i) into doc from crm_invoices i where id=doc_id for update;
  select jsonb_agg(to_jsonb(i) order by position,created_at),sum(round(quantity*unit_price*(1-coalesce((doc->>'discount')::numeric,0)/100)*(1+case when (biz->>'smallBusiness')::boolean then 0 else tax_rate/100 end),2)) into lines,amount from crm_invoice_items i where invoice_id=doc_id;
 else raise exception 'Ungültiger Dokumenttyp'; end if;
 if doc is null or doc->>'issued_at' is not null or lines is null then raise exception 'Dokument fehlt, ist bereits ausgestellt oder hat keine Positionen.'; end if;
 if doc_kind='invoice' and doc->>'service_date' is null then raise exception 'Leistungsdatum fehlt.'; end if;
 select to_jsonb(c) into customer from crm_companies c where id=(doc->>'company_id')::uuid;
 if coalesce(customer->>'street','')='' or coalesce(customer->>'postcode','')='' or coalesce(customer->>'city','')='' then raise exception 'Vollständige Kundenanschrift fehlt.'; end if;
 if doc_kind='invoice' and doc->>'kind'='Schlussrechnung' then
  for adv in select i.* from crm_invoice_deductions d join crm_invoices i on i.id=d.advance_id where d.invoice_id=doc_id for update of i loop
   if adv.company_id<>(doc->>'company_id')::uuid or adv.kind<>'Anzahlung' or adv.issued_at is null or adv.document_status='Storniert' then raise exception 'Ungültige Anzahlungsverrechnung'; end if;
   deduction=deduction+(select coalesce(sum(p.amount),0) from crm_payments p where invoice_id=adv.id);
  end loop;
  if deduction>amount then raise exception 'Anzahlungen übersteigen die Schlussrechnung'; end if;
 end if;
 insert into crm_number_counters(kind,year,value) values(doc_kind,yr,1) on conflict(kind,year) do update set value=crm_number_counters.value+1 returning value into num;
 doc_number=(case when doc_kind='quote' then 'ANG' else 'RE' end)||'-'||yr||'-'||lpad(num::text,5,'0');
 frozen=jsonb_build_object('business',biz,'customer',customer,'items',lines,'document',doc,'number',doc_number,'date',(now() at time zone 'Europe/Berlin')::date,'subtotal',amount,'deducted',deduction,'total',amount-deduction);
 perform set_config('crm.issuing','on',true);
 if doc_kind='quote' then update crm_quotes set snapshot=frozen,number=doc_number,total=amount,issued_at=now(),status='Ausgestellt' where id=doc_id; else update crm_invoices set snapshot=frozen,number=doc_number,total=amount-deduction,deducted=deduction,issued_at=now(),document_status='Ausgestellt' where id=doc_id; end if;
 if doc_kind='invoice' then select snapshot into frozen from crm_invoices where id=doc_id; end if; return frozen;
end $$;
revoke all on function public.crm_issue(text,uuid) from public; grant execute on function public.crm_issue(text,uuid) to authenticated;

create function public.crm_ingest_inquiry(request_key_in text, payload jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$ declare cid uuid; rid uuid; v_email text=lower(payload->>'email'); begin
 select company_id into cid from crm_website_inquiries where request_key=request_key_in; if cid is not null then return cid; end if;
 insert into crm_companies(name,email,phone,contact_name,source,notes) values(coalesce(nullif(payload->>'company',''),payload->>'name'),v_email,coalesce(payload->>'phone',''),payload->>'name','Website',payload->>'description') on conflict(lower(email)) where email<>'' do update set updated_at=now() returning id into cid;
 insert into crm_website_inquiries(company_id,request_key,data) values(cid,request_key_in,payload);
 insert into crm_tasks(company_id,title,description,due_at) values(cid,'Website-Anfrage beantworten',payload->>'description',now());
 insert into crm_notifications(title,href,event_key) values('Neue Website-Anfrage','/crm/leads/'||cid,'inquiry:'||request_key_in) on conflict(event_key) do nothing;
 if payload->>'mode'='appointment' then
  insert into crm_calendar_events(company_id,title,starts_at,ends_at,status,notes) values(cid,'Terminwunsch: '||(payload->>'name'),(payload->>'appointment')::timestamp at time zone 'Europe/Berlin',((payload->>'appointment')::timestamp at time zone 'Europe/Berlin')+interval '30 minutes','Angefragt',payload->>'description');
 end if;
 return cid;
end $$;
revoke all on function public.crm_ingest_inquiry(text,jsonb) from public,anon,authenticated; grant execute on function public.crm_ingest_inquiry(text,jsonb) to service_role;

create function public.crm_lease(job_key text, seconds integer) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$ declare claimed text; begin
 insert into crm_job_runs(key,lease_until) values(job_key,now()+make_interval(secs=>seconds)) on conflict(key) do update set lease_until=excluded.lease_until where crm_job_runs.lease_until<now() returning key into claimed; return claimed is not null; end $$;
revoke all on function public.crm_lease(text,integer) from public,anon,authenticated; grant execute on function public.crm_lease(text,integer) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('crm-private','crm-private',false,10000000,array['application/pdf','image/png','image/jpeg','text/plain','application/xml','text/xml','message/rfc822']);
create policy crm_storage_read on storage.objects for select to authenticated using(bucket_id='crm-private' and public.crm_role() is not null);
-- Writes only through validated server endpoints. No browser upload or public links.
alter publication supabase_realtime add table public.crm_companies,public.crm_tasks,public.crm_notifications,public.crm_calendar_events,public.crm_calls,public.crm_emails;
create index crm_tasks_due on public.crm_tasks(due_at) where status<>'Erledigt';
create index crm_follow_due on public.crm_follow_ups(due_at) where status<>'Abgeschlossen';
create index crm_invoices_due on public.crm_invoices(due_on) where document_status='Ausgestellt';
create index crm_contacts_company on public.crm_contacts(company_id);
create index crm_calls_company on public.crm_calls(company_id,started_at desc);
create index crm_emails_company on public.crm_emails(company_id,created_at desc);


-- ===== 202610140002_operations.sql =====

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


-- ===== 202610140003_hardening.sql =====

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


-- ===== 202610140004_financial_integrity.sql =====

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


-- ===== 202610140005_field_permissions.sql =====

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


-- ===== 202610140006_totals_calendar.sql =====

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


-- ===== 202610140007_notifications.sql =====

alter table public.crm_notifications add column push_sent_at timestamptz;
alter table public.crm_emails add column attachment_ids uuid[] not null default '{}';
-- Inbound originals retain their correspondence link.
alter table public.crm_documents add column email_id uuid references public.crm_emails(id);


-- ===== 202610140008_email_roles.sql =====

create policy accounting_emails_write on public.crm_emails for all to authenticated using(public.crm_role()='buchhaltung' and purpose='operational') with check(public.crm_role()='buchhaltung' and purpose='operational');


-- ===== 202610140009_workflow_queue.sql =====

create function public.crm_pending_events(workflow_in uuid) returns setof uuid language sql security definer set search_path=public,pg_temp as $$ select e.id from crm_events e join crm_workflows w on w.id=workflow_in and w.enabled and w.trigger=e.name where (w.trigger<>'scheduled' or e.entity_id=w.id) and not exists(select 1 from crm_workflow_runs r where r.workflow_id=w.id and r.event_key=e.event_key) order by e.created_at limit 50 $$;
revoke all on function public.crm_pending_events(uuid) from public,anon,authenticated;grant execute on function public.crm_pending_events(uuid) to service_role;
create function public.crm_schedule_workflows() returns void language plpgsql security definer set search_path=public,pg_temp as $$ declare w crm_workflows;begin
 for w in select * from crm_workflows where enabled and trigger='scheduled' loop
  insert into crm_events(name,entity_id,event_key) values('scheduled',w.id,'scheduled:'||w.id||':'||(now() at time zone 'Europe/Berlin')::date) on conflict do nothing;
 end loop;end $$;
revoke all on function public.crm_schedule_workflows() from public,anon,authenticated;grant execute on function public.crm_schedule_workflows() to service_role;


-- ===== 202610140010_sent_state.sql =====

create function public.crm_quote_sent_event() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if new.status='Versendet' and old.status<>'Versendet' then insert into crm_events(name,entity_id,event_key) values('quote.sent',new.id,'quote-sent:'||new.id) on conflict do nothing;end if;return new;end $$;
create trigger quote_sent_event after update on public.crm_quotes for each row execute function public.crm_quote_sent_event();


-- ===== 202610140011_mailbox_cursors.sql =====

create table public.crm_mailbox_cursors(account_id uuid not null references public.crm_email_accounts(id) on delete cascade,mailbox text not null,last_uid bigint not null default 0,uid_validity text not null,primary key(account_id,mailbox));
alter table public.crm_mailbox_cursors enable row level security;


-- ===== 202610140012_inquiry_contacts.sql =====

create function public.crm_inquiry_contact() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if not exists(select 1 from crm_contacts where company_id=new.company_id and lower(email)=lower(new.data->>'email') and name=new.data->>'name') then
  insert into crm_contacts(company_id,name,email,phone) values(new.company_id,new.data->>'name',coalesce(new.data->>'email',''),coalesce(new.data->>'phone',''));
 end if;return new;end $$;
create trigger inquiry_contact after insert on public.crm_website_inquiries for each row execute function public.crm_inquiry_contact();


-- ===== 202610140013_call_status.sql =====

create function public.crm_call_status(event_in text,sid_in text,status_in text,duration_in integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare inserted uuid;begin
 insert into crm_webhook_events(provider,event_key) values('twilio',event_in) on conflict do nothing returning id into inserted;if inserted is null then return;end if;
 if not exists(select 1 from crm_calls where provider_sid=sid_in) then raise exception 'Anruf noch nicht gespeichert';end if;
 if status_in in ('completed','failed','busy','no-answer','canceled') then update crm_calls set status=status_in,ended_at=now(),duration=greatest(0,duration_in) where provider_sid=sid_in;
 else update crm_calls set status=status_in where provider_sid=sid_in and ended_at is null;end if;end $$;
revoke all on function public.crm_call_status(text,text,text,integer) from public,anon,authenticated;grant execute on function public.crm_call_status(text,text,text,integer) to service_role;


COMMIT;


-- ===== 202610140014_work.sql =====

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


-- ===== 202610140015_osm_import.sql =====

-- Existing CRM: run ONLY this migration once. No second lead table is created.
begin;
set local search_path=public,extensions,pg_temp;
create extension if not exists fuzzystrmatch with schema extensions;
create function public.crm_phone_key(value text) returns text language plpgsql immutable set search_path=public,pg_temp as $$
declare digits text;
begin
 value=regexp_replace(trim(split_part(coalesce(value,''),';',1)),'^(\+49|0049)\s*\(0\)','\1');
 digits=regexp_replace(value,'[^0-9]','','g');
 if length(digits)<7 or length(digits)>18 then return ''; end if;
 if left(digits,2)='00' then digits=substring(digits from 3);
 elsif left(digits,1)='0' then digits='49'||substring(digits from 2); end if;
 if left(digits,3)='490' then digits='49'||substring(digits from 4); end if;
 return digits;
end $$;
create function public.crm_name_key(value text) returns text language sql immutable set search_path=public,pg_temp as $$
 with normalized as (select trim(regexp_replace(lower(replace(replace(replace(replace(lower(coalesce(value,'')),'ä','ae'),'ö','oe'),'ü','ue'),'ß','ss')),'[^a-z0-9]+',' ','g')) name),
 cleaned as (select name,trim(regexp_replace(name,'\m(gmbh|ug|ag|kg|ohg|gbr|mbh|haftungsbeschraenkt)\M','','g')) stripped from normalized)
 select coalesce((select string_agg(token,' ' order by token) from regexp_split_to_table(case when stripped='' then name else stripped end,'\s+') token where token<>''),'') from cleaned;
$$;
create index crm_company_phone_key on public.crm_companies(public.crm_phone_key(phone));
create index crm_contact_phone_key on public.crm_contacts(public.crm_phone_key(phone));
create index crm_company_name_key on public.crm_companies using gin(public.crm_name_key(name) gin_trgm_ops);
create index crm_company_email_key on public.crm_companies(lower(trim(email)));
create index crm_contact_email_key on public.crm_contacts(lower(trim(email)));

-- All company/contact writes take the same transaction lock as the final import.
-- Existing legacy duplicates remain untouched; new identical contacts are blocked.
create function public.crm_import_contact_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare pk text=public.crm_phone_key(new.phone); ek text=lower(trim(coalesce(new.email,''))); owner_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('crm-company-import',0));
 if tg_table_name='crm_companies' then owner_id=new.id;else owner_id=new.company_id;end if;
 if pk<>'' and (tg_op='INSERT' or pk is distinct from public.crm_phone_key(old.phone)) then
  if exists(select 1 from crm_companies where id<>owner_id and public.crm_phone_key(phone)=pk)
   or exists(select 1 from crm_contacts where company_id<>owner_id and public.crm_phone_key(phone)=pk) then raise exception 'Telefonnummer bereits einem bestehenden Unternehmen zugeordnet'; end if;
 end if;
 if ek<>'' and (tg_op='INSERT' or ek is distinct from lower(trim(coalesce(old.email,'')))) then
  if exists(select 1 from crm_companies where id<>owner_id and lower(trim(email))=ek)
   or exists(select 1 from crm_contacts where company_id<>owner_id and lower(trim(email))=ek) then raise exception 'E-Mail-Adresse bereits einem bestehenden Unternehmen zugeordnet'; end if;
 end if;
 return new;
end $$;
create trigger import_contact_guard before insert or update of name,phone,email on public.crm_companies for each row execute function public.crm_import_contact_guard();
create trigger import_contact_guard before insert or update of phone,email on public.crm_contacts for each row execute function public.crm_import_contact_guard();

-- One classifier is used by preview and final import. Region-free name matches
-- are held for review, never silently merged or used to overwrite a company.
create function public.crm_osm_classify(rows_in jsonb,postcode_in text) returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp set pg_trgm.similarity_threshold='0.4' as $$
declare result jsonb='[]'; prior jsonb='[]'; item jsonb; earlier jsonb; c crm_companies; state text; reason text; nk text; pk text; ek text; n integer=0; matching jsonb;
begin
 if jsonb_typeof(rows_in)<>'array' or jsonb_array_length(rows_in)>200 then raise exception 'Maximal 200 Ergebnisse'; end if;
 for item in select value from jsonb_array_elements(rows_in) loop
  state='new';reason='Neues Unternehmen';matching=null;nk=public.crm_name_key(item->>'name');pk=public.crm_phone_key(item->>'phone');ek=lower(trim(coalesce(item->>'email','')));
  select * into c from crm_companies company where company.id in (
   select id from crm_companies where (pk<>'' and public.crm_phone_key(phone)=pk) or (ek<>'' and lower(trim(email))=ek)
   union select company_id from crm_contacts where (pk<>'' and public.crm_phone_key(phone)=pk) or (ek<>'' and lower(trim(email))=ek))
   order by company.id limit 1;
  if c.id is not null then state='duplicate';reason='Telefon oder E-Mail bereits im CRM';
  else
   select * into c from crm_companies company where public.crm_name_key(company.name)=nk and nk<>'' order by (coalesce(company.postcode,'')=postcode_in) desc,company.id limit 1;
   if c.id is not null then
    if coalesce(c.postcode,'')=postcode_in and length(nk)>=6 and not
     ((pk<>'' and public.crm_phone_key(c.phone)<>'' and pk<>public.crm_phone_key(c.phone)) or (ek<>'' and coalesce(c.email,'')<>'' and ek<>lower(trim(c.email)))) then state='duplicate';reason='Gleicher Firmenname in derselben PLZ';
    else state='review';reason='Gleicher Firmenname im CRM; Region oder Identität nicht eindeutig';end if;
   else
    select * into c from crm_companies company where length(nk)>=6 and length(public.crm_name_key(company.name))>=6 and public.crm_name_key(company.name) % nk and
     (similarity(public.crm_name_key(company.name),nk)>=0.72 or
      (length(nk)<=255 and length(public.crm_name_key(company.name))<=255 and abs(length(nk)-length(public.crm_name_key(company.name)))<=2 and levenshtein_less_equal(left(public.crm_name_key(company.name),255),left(nk,255),2)<=2))
     order by similarity(public.crm_name_key(company.name),nk) desc,company.id limit 1;
    if c.id is not null then state='review';reason='Ähnlicher Firmenname im CRM: manuell prüfen';end if;
   end if;
  end if;
  if c.id is not null then matching=jsonb_build_object('id',c.id,'name',c.name,'phone',c.phone,'email',c.email,'industry',c.industry);end if;
  if state<>'duplicate' then
   for earlier in select value from jsonb_array_elements(prior) loop
    if (pk<>'' and pk=public.crm_phone_key(earlier->>'phone')) or (ek<>'' and ek=lower(trim(earlier->>'email'))) then
     state='duplicate';reason='Doppelt innerhalb dieser Suche';matching=earlier;exit;
    elsif nk<>'' and nk=public.crm_name_key(earlier->>'name') then
     if (pk<>'' and public.crm_phone_key(earlier->>'phone')<>'' and pk<>public.crm_phone_key(earlier->>'phone')) or (ek<>'' and coalesce(earlier->>'email','')<>'' and ek<>lower(trim(earlier->>'email'))) then
      state='review';reason='Gleicher Name, abweichende Kontakte: manuell prüfen';matching=earlier;
     else state='duplicate';reason='Doppelt innerhalb dieser Suche';matching=earlier;exit;end if;
    elsif state='new' and length(nk)>=6 and length(public.crm_name_key(earlier->>'name'))>=6 and
     (similarity(nk,public.crm_name_key(earlier->>'name'))>=0.72 or
      (length(nk)<=255 and length(public.crm_name_key(earlier->>'name'))<=255 and abs(length(nk)-length(public.crm_name_key(earlier->>'name')))<=2 and levenshtein_less_equal(left(nk,255),left(public.crm_name_key(earlier->>'name'),255),2)<=2)) then
     state='review';reason='Ähnlicher Firmenname innerhalb dieser Suche: manuell prüfen';matching=earlier;
    end if;
   end loop;
  end if;
  result=result||jsonb_build_array(jsonb_build_object('index',n,'name',item->>'name','phone',coalesce(item->>'phone',''),'email',coalesce(item->>'email',''),'industry',item->>'industry','state',state,'reason',reason,'match',matching));
  prior=prior||jsonb_build_array(item);n=n+1;
 end loop;
 return result;
end $$;
revoke all on function public.crm_osm_classify(jsonb,text) from public,anon,authenticated;grant execute on function public.crm_osm_classify(jsonb,text) to service_role;

create function public.crm_osm_import(rows_in jsonb,postcode_in text,selected_in integer[],reviewed_in integer[],actor_in uuid,batch_in uuid) returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare classified jsonb; item jsonb; created integer=0; duplicates integer=0; held integer=0; lead_id uuid; outcomes jsonb='[]'; row_index integer; row_error text; claimed uuid;
begin
 if not exists(select 1 from crm_users where id=actor_in and enabled and role in ('administrator','vertrieb')) then raise exception 'Kein Zugriff';end if;
 if jsonb_typeof(rows_in)<>'array' or jsonb_array_length(rows_in)>200 then raise exception 'Maximal 200 Ergebnisse';end if;
 perform pg_advisory_xact_lock(hashtextextended('crm-company-import',0));
 insert into crm_webhook_events(provider,event_key) values('osm-import',actor_in::text||':'||batch_in::text) on conflict do nothing returning id into claimed;
 if claimed is null then return jsonb_build_object('alreadyImported',true,'created',0,'duplicates',0,'held',0,'outcomes','[]'::jsonb);end if;
 classified=public.crm_osm_classify(rows_in,postcode_in);
 for item in select value from jsonb_array_elements(classified) loop
  row_index=(item->>'index')::integer;
  if not(row_index=any(selected_in)) then continue;end if;
  if item->>'state'='duplicate' then duplicates=duplicates+1;outcomes=outcomes||jsonb_build_array(jsonb_build_object('index',row_index,'state','duplicate','reason',item->>'reason'));continue;end if;
  if item->>'state'='review' and not(row_index=any(reviewed_in)) then held=held+1;outcomes=outcomes||jsonb_build_array(jsonb_build_object('index',row_index,'state','review','reason',item->>'reason'));continue;end if;
  begin
   if length(trim(item->>'name')) not between 1 and 200 or length(coalesce(item->>'phone',''))>80 or length(coalesce(item->>'email',''))>254 or length(item->>'industry') not between 1 and 100 then raise exception 'Ungültige Unternehmensdaten';end if;
   insert into crm_companies(name,phone,email,industry,status) values(trim(item->>'name'),coalesce(item->>'phone',''),lower(trim(coalesce(item->>'email',''))),item->>'industry','Neu') returning id into lead_id;
   insert into crm_audit_logs(actor_id,entity,entity_id,action,after_data) values(actor_in,'crm_companies',lead_id,'osm.import',jsonb_build_object('name',item->>'name','phone',item->>'phone','email',item->>'email','industry',item->>'industry'));
   created=created+1;outcomes=outcomes||jsonb_build_array(jsonb_build_object('index',row_index,'state','imported','id',lead_id));
  exception when unique_violation then
   duplicates=duplicates+1;outcomes=outcomes||jsonb_build_array(jsonb_build_object('index',row_index,'state','duplicate','reason','Zwischenzeitlich bereits vorhanden'));
  when others then
   get stacked diagnostics row_error=message_text;
   outcomes=outcomes||jsonb_build_array(jsonb_build_object('index',row_index,'state','error','reason',left(row_error,200)));
  end;
 end loop;
 return jsonb_build_object('created',created,'duplicates',duplicates,'held',held,'outcomes',outcomes);
end $$;
revoke all on function public.crm_osm_import(jsonb,text,integer[],integer[],uuid,uuid) from public,anon,authenticated;grant execute on function public.crm_osm_import(jsonb,text,integer[],integer[],uuid,uuid) to service_role;
commit;
