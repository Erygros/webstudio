-- Apply after all existing CRM migrations. No demo data, no payments simulated.
begin;
create table public.crm_service_bookings (
 id uuid primary key default gen_random_uuid(), request_key uuid not null unique, request_hash text not null,
 reference text not null unique default ('BU-'||to_char(now(),'YYYY')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 kind text not null check(kind in ('booking','consultation')), company_id uuid not null references public.crm_companies(id),
 project_id uuid references public.crm_projects(id), package jsonb not null, customer jsonb not null, bank jsonb not null default '{}', terms jsonb not null,
 description text not null, requirements text not null default '', callback text not null default '',
 status text not null check(status in ('Beratung angefragt','Buchung eingegangen','Wartet auf Zahlung','Bezahlt','In Bearbeitung','Abgeschlossen','Storniert')),
 amount_cents integer not null check(amount_cents>=0), interval text not null check(interval in ('once','monthly')),
 service_start date, next_on date, ends_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.crm_booking_cycles (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.crm_service_bookings(id),
 cycle integer not null check(cycle>0), period_on date, invoice_id uuid not null unique references public.crm_invoices(id),
 payment_id uuid unique references public.crm_payments(id), unique(booking_id,cycle)
);
create table public.crm_booking_declarations (
 id uuid primary key default gen_random_uuid(), request_key uuid not null unique, request_hash text not null,
 booking_id uuid references public.crm_service_bookings(id), kind text not null check(kind in ('withdrawal','cancellation')),
 data jsonb not null, received_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid references public.crm_users(id)
);
create table public.crm_booking_events (
 id bigint generated always as identity primary key, booking_id uuid references public.crm_service_bookings(id),
 actor uuid references public.crm_users(id), event text not null, data jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.crm_booking_mail (
 id uuid primary key default gen_random_uuid(), event_key text not null unique, booking_id uuid references public.crm_service_bookings(id),
 invoice_id uuid references public.crm_invoices(id), recipient text not null, subject text not null, body text not null,
 status text not null default 'queued' check(status in ('queued','sending','sent','unknown')), claim uuid, claimed_at timestamptz,
 sent_at timestamptz, attempts integer not null default 0, next_attempt_at timestamptz not null default now(), error text not null default '', created_at timestamptz not null default now()
);
create index crm_booking_recent on public.crm_service_bookings(created_at desc);
create index crm_booking_due on public.crm_service_bookings(next_on) where next_on is not null;
create index crm_booking_mail_queue on public.crm_booking_mail(created_at) where status='queued';
do $$ declare t text; begin
 foreach t in array array['crm_service_bookings','crm_booking_cycles','crm_booking_declarations','crm_booking_events','crm_booking_mail'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 execute format('create policy staff_read on public.%I for select to authenticated using(public.crm_role() in (''administrator'',''vertrieb'',''buchhaltung''))',t);
 end loop;
end $$;

-- Queue content inside the same transaction as the business operation.
create function public.crm_booking_queue(bid uuid, key_in text, recipient_in text, subject_in text, body_in text, invoice_in uuid default null)
returns void language sql security definer set search_path=public,pg_temp as $$
 insert into crm_booking_mail(booking_id,event_key,recipient,subject,body,invoice_id)
 values(bid,key_in,recipient_in,subject_in,body_in,invoice_in) on conflict(event_key) do nothing;
$$;
revoke all on function public.crm_booking_queue(uuid,text,text,text,text,uuid) from public,anon,authenticated;

-- Invoice creation stays in the existing ledger; issuance uses crm_issue below.
create function public.crm_booking_invoice(bid uuid, cycle_in integer, period_in date) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare b crm_service_bookings; iid uuid; biz jsonb; rate numeric; frozen jsonb;
begin
 select * into strict b from crm_service_bookings where id=bid for update;
 select invoice_id into iid from crm_booking_cycles where booking_id=bid and cycle=cycle_in;
 if iid is not null then return iid; end if;
 select data into strict biz from crm_company_settings where key='business';
 rate=case when ((biz->>'smallBusiness'))::boolean then 0 else ((biz->>'vatRate'))::numeric end;
 if rate is null or rate not between 0 and 100 then raise exception 'Umsatzsteuerkonfiguration fehlt'; end if;
 insert into crm_invoices(company_id,title,kind,service_date,due_on) values(b.company_id,
 (b.package->>'name')||' · '||b.reference||' · Abschnitt '||cycle_in,
 case when period_in is null then 'Anzahlung' else 'Rechnung' end,period_in,
 (now() at time zone 'Europe/Berlin')::date+((b.bank->>'paymentDays'))::integer) returning id into iid;
 insert into crm_invoice_items(invoice_id,description,quantity,unit_price,tax_rate,position)
 values(iid,(b.package->>'name')||E'\n'||(select string_agg(value,E'\n') from jsonb_array_elements_text(b.package->'scope'))||
 case when period_in is null then E'\nLeistungsbeginn nach Zahlung und Abstimmung; Vorauszahlung.' else E'\nLeistungsbeginn dieses Abschnitts: '||period_in::text end,
 1,round(b.amount_cents::numeric/100/(1+rate/100),2),rate,0);
 insert into crm_booking_cycles(booking_id,cycle,period_on,invoice_id) values(bid,cycle_in,period_in,iid);
 frozen=public.crm_issue('invoice',iid);
 -- The booking's billing address is authoritative, even when the CRM company already exists.
 update crm_invoices set snapshot=jsonb_set(jsonb_set(frozen,'{customer}',b.customer),'{business,iban}',b.bank->'iban') where id=iid;
 if (select total*100 from crm_invoices where id=iid)<>b.amount_cents then raise exception 'Rechnungsbetrag stimmt nicht mit dem gebuchten Endpreis überein'; end if;
 return iid;
end $$;
revoke all on function public.crm_booking_invoice(uuid,integer,date) from public,anon,authenticated;

create function public.crm_booking_create(key_in uuid, hash_in text, payload jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare b crm_service_bookings; cid uuid; iid uuid; p jsonb=payload->'package'; c jsonb=payload->'customer';
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Kein Zugriff'; end if;
 perform pg_advisory_xact_lock(hashtextextended('booking:'||key_in::text,0));
 select * into b from crm_service_bookings where request_key=key_in;
 if found then if b.request_hash<>hash_in then raise exception 'Buchungsschlüssel bereits mit anderen Angaben verwendet'; end if; return to_jsonb(b); end if;
 perform pg_advisory_xact_lock(hashtextextended('customer:'||lower((c->>'email')),0));
 select id into cid from crm_companies where lower(email)=lower((c->>'email')) order by created_at limit 1;
 if cid is null then
 insert into crm_companies(name,contact_name,email,phone,street,house_number,postcode,city,country,source,status,notes)
 values((c->>'name'),(c->>'contact_name'),lower((c->>'email')),(c->>'phone'),(c->>'street'),(c->>'house_number'),(c->>'postcode'),(c->>'city'),'Deutschland','Website-Buchung','Neu','Kontaktdaten aus einer Website-Buchung.') returning id into cid;
 end if;
 insert into crm_service_bookings(request_key,request_hash,kind,company_id,package,customer,bank,terms,description,requirements,callback,status,amount_cents,interval)
 values(key_in,hash_in,(payload->>'kind'),cid,p,c,coalesce(payload->'bank','{}'),payload->'terms',(payload->>'description'),coalesce((payload->>'requirements'),''),coalesce((payload->>'callback'),''),
 case when (payload->>'kind')='consultation' then 'Beratung angefragt' else 'Wartet auf Zahlung' end,
 case when (payload->>'kind')='consultation' then 0 else ((p->>'cents'))::integer end,(p->>'interval')) returning * into b;
 if b.kind='booking' then iid=public.crm_booking_invoice(b.id,1,null); end if;
 insert into crm_tasks(company_id,title,description,priority,due_at)
 values(cid,case when b.kind='consultation' then 'Beratung: ' else 'Neue Buchung: ' end||(p->>'name'),b.reference||E'\n'||b.description||E'\nRückrufwunsch: '||b.callback,'normal',now()+interval '1 day');
 insert into crm_notifications(title,href,event_key) values('Neue '||case when b.kind='consultation' then 'Beratung' else 'Buchung' end||': '||b.reference,'/crm/buchungen?vorgang='||b.id,'booking:'||b.id);
 insert into crm_booking_events(booking_id,event) values(b.id,case when b.kind='booking' then 'Buchung eingegangen; wartet auf Zahlung' else 'Beratung angefragt' end);
 perform public.crm_booking_queue(b.id,'booking:'||b.id||':customer',(c->>'email'),case when b.kind='consultation' then 'Deine kostenlose Beratungsanfrage · ' else 'Deine Buchungsbestätigung · ' end||b.reference,(payload->>'customer_body'),iid);
 perform public.crm_booking_queue(b.id,'booking:'||b.id||':owner','bewerbung.enricogross30@gmail.com','Neues Formular · '||b.reference,
 'Es wurde soeben ein Formular abgeschickt. Rufe es im CRM auf.'||E'\n'||(payload->>'crm_url')||'?vorgang='||b.id||E'\n\n'||b.reference||E'\n'||((c->>'contact_name'))||E'\n'||((c->>'name'))||E'\n'||((c->>'email'))||E'\n'||((c->>'phone'))||E'\n'||((p->>'name'))||E'\nStatus: '||b.status||E'\nBetrag: '||replace(to_char(b.amount_cents::numeric/100,'FM999999990.00'),'.',',')||' EUR'||E'\nIntervall: '||b.interval||E'\n'||b.description||E'\nZusatzwünsche: '||b.requirements);
 return to_jsonb(b);
end $$;
revoke all on function public.crm_booking_create(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.crm_booking_create(uuid,text,jsonb) to service_role;

create function public.crm_booking_manage(bid uuid, action_in text, data_in jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare b crm_service_bookings; cy crm_booking_cycles; bill crm_invoices; pid uuid; start_in date; mailrow crm_booking_mail;
begin
 if public.crm_role() not in ('administrator','buchhaltung','vertrieb') or public.crm_role() is null then raise exception 'Kein Zugriff'; end if;
 if action_in='payment' then
  perform 1 from crm_invoices i join crm_booking_cycles c on c.invoice_id=i.id where c.booking_id=bid and c.id=(data_in->>'cycle_id')::uuid for update of i;
 end if;
 select * into strict b from crm_service_bookings where id=bid for update;
 if action_in in ('payment','reminder','start','end','mail_retry','declaration_review','declaration_link') and public.crm_role() not in ('administrator','buchhaltung') then raise exception 'Nur Administration/Buchhaltung'; end if;
 if action_in='payment' then
  if b.kind<>'booking' or b.status='Storniert' then raise exception 'Keine zahlbare Buchung'; end if;
  select * into strict cy from crm_booking_cycles where booking_id=bid and id=((data_in->>'cycle_id'))::uuid for update;
  if cy.payment_id is null then
   select * into strict bill from crm_invoices where id=cy.invoice_id for update;
   if bill.document_status<>'Ausgestellt' or bill.total<=0 then raise exception 'Ungültige Rechnung'; end if;
   if coalesce((data_in->>'bank_reference'),'')='' then raise exception 'Bankreferenz und tatsächlich geprüfter Zahlungseingang erforderlich'; end if;
   if (data_in->>'paid_on')::date>(now() at time zone 'Europe/Berlin')::date then raise exception 'Zahlungseingang darf nicht in der Zukunft liegen'; end if;
   insert into crm_payments(invoice_id,amount,paid_on,reference)
   values(bill.id,bill.total-(select coalesce(sum(amount),0) from crm_payments where invoice_id=bill.id),((data_in->>'paid_on'))::date,(data_in->>'bank_reference')) returning id into pid;
   update crm_booking_cycles set payment_id=pid where id=cy.id;
   -- Existing ledger payment trigger synchronizes the booking and creates one project atomically.
  end if;
 elsif action_in='start' then
  if b.kind<>'booking' or b.status not in ('Bezahlt','In Bearbeitung') then raise exception 'Zahlung zuerst bestätigen'; end if;
  if b.service_start is not null then raise exception 'Leistungsbeginn wurde bereits festgelegt'; end if;
  start_in=((data_in->>'date'))::date;
  if start_in is null or start_in<(now() at time zone 'Europe/Berlin')::date or
    (coalesce(((b.terms->>'consumer'))::boolean,true) and not(coalesce(((b.terms->>'early_start'))::boolean,false) and coalesce(((b.terms->>'early_loss'))::boolean,false)) and start_in<(b.created_at at time zone 'Europe/Berlin')::date+15)
    then raise exception 'Unzulässiger Leistungsbeginn; Widerrufsfrist und Kundenabsprache beachten'; end if;
  update crm_service_bookings set service_start=start_in,next_on=case when b.interval='monthly' then (start_in+interval '1 month')::date end,status='In Bearbeitung' where id=bid;
  update crm_projects set starts_on=start_in,status='In Arbeit' where id=b.project_id;
  update crm_booking_cycles set period_on=start_in where booking_id=bid and cycle=1;
  perform public.crm_booking_queue(bid,'start:'||bid,(b.customer->>'email'),'Dein Leistungsbeginn · '||b.reference,'Wie mit dir abgestimmt, beginnt die Leistung am '||start_in::text||'.'||case when b.interval='monthly' then E'\nMonatliche Abrechnung im Voraus. Kündigung jederzeit zum Ende des laufenden Leistungsmonats unter der Funktion „Verträge hier kündigen“ auf unserer Website.' else '' end);
 elsif action_in='end' then
  start_in=((data_in->>'date'))::date;
  if b.interval<>'monthly' or b.service_start is null or start_in<b.service_start or start_in is null then raise exception 'Gültiges Vertragsende erforderlich'; end if;
  update crm_service_bookings set ends_on=start_in where id=bid;
  perform public.crm_booking_queue(bid,'end:'||bid||':'||start_in,(b.customer->>'email'),'Bestätigung Vertragsende · '||b.reference,'Das Vertragsende wurde für den '||start_in::text||' bestätigt. Bereits entstandene Zahlungsansprüche und dein Widerrufsrecht bleiben unberührt.');
 elsif action_in='reminder' then
  select * into strict bill from crm_invoices where id=((data_in->>'invoice_id'))::uuid and id in(select invoice_id from crm_booking_cycles where booking_id=bid);
  if bill.payment_status='Bezahlt' or bill.document_status<>'Ausgestellt' then raise exception 'Keine offene Rechnung'; end if;
  perform public.crm_booking_queue(bid,'reminder:'||bill.id||':'||(now() at time zone 'Europe/Berlin')::date,(b.customer->>'email'),'Zahlungserinnerung · '||bill.number,
   'Zu deiner Buchung '||b.reference||' ist noch ein Rechnungsbetrag offen. Falls du inzwischen überwiesen hast, antworte bitte auf diese Nachricht.'||E'\nOffen: '||(bill.total-(select coalesce(sum(amount),0) from crm_payments where invoice_id=bill.id))::text||' EUR'||E'\nEmpfänger: '||((b.bank->>'recipient'))||E'\nIBAN: '||((b.bank->>'iban'))||E'\nVerwendungszweck: '||bill.number,bill.id);
 elsif action_in='status' then
  if (data_in->>'status') not in ('In Bearbeitung','Abgeschlossen','Storniert') then raise exception 'Status nicht zulässig'; end if;
  if (data_in->>'status')='In Bearbeitung' and (b.kind='consultation' or b.project_id is null or b.service_start is null) then raise exception 'Zahlung und Leistungsbeginn zuerst bestätigen'; end if;
  if b.kind='booking' and b.interval='monthly' and (data_in->>'status')='Abgeschlossen' and (b.ends_on is null or b.ends_on>current_date) then raise exception 'Zuerst Vertragsende festlegen; laufende Verträge nicht abschließen'; end if;
  update crm_service_bookings set status=(data_in->>'status'),next_on=case when (data_in->>'status') in ('Abgeschlossen','Storniert') then null else next_on end where id=bid;
  -- Issued invoices remain unchanged. Refunds/cancellations must use the existing ledger workflow.
 elsif action_in='declaration_link' then
  if data_in->>'checked' is distinct from 'true' then raise exception 'Kundenzuordnung zuerst prüfen'; end if;
  update crm_booking_declarations set booking_id=bid where id=(data_in->>'declaration_id')::uuid and booking_id is null and reviewed_at is null;
 elsif action_in='declaration_review' then
  update crm_booking_declarations set reviewed_at=now(),reviewed_by=auth.uid() where id=((data_in->>'declaration_id'))::uuid and booking_id=bid and reviewed_at is null;
 elsif action_in='mail_retry' then
  if (data_in->>'checked') is distinct from 'true' then raise exception 'Zuerst tatsächlichen Nichtversand prüfen'; end if;
  select * into strict mailrow from crm_booking_mail where id=((data_in->>'mail_id'))::uuid and booking_id=bid for update;
  if mailrow.status<>'unknown' then raise exception 'Nur unklare Sendungen nach Prüfung erneut freigeben'; end if;
  update crm_booking_mail set status='queued',claim=null,claimed_at=null,error='' where id=mailrow.id;
 else raise exception 'Unbekannte Aktion'; end if;
 update crm_service_bookings set updated_at=now() where id=bid;
 insert into crm_booking_events(booking_id,actor,event,data) values(bid,auth.uid(),action_in,data_in);
 return (select to_jsonb(x) from crm_service_bookings x where id=bid);
end $$;
revoke all on function public.crm_booking_manage(uuid,text,jsonb) from public,anon;
grant execute on function public.crm_booking_manage(uuid,text,jsonb) to authenticated;

create function public.crm_booking_declare(key_in uuid, hash_in text, kind_in text, data_in jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare did uuid; bid uuid; oldhash text; when_in timestamptz; body_in text;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Kein Zugriff'; end if;
 perform pg_advisory_xact_lock(hashtextextended('declaration:'||key_in::text,0));
 select id,received_at,request_hash into did,when_in,oldhash from crm_booking_declarations where request_key=key_in;
 if did is not null then if oldhash<>hash_in then raise exception 'Vorgangsschlüssel gehört zu anderen Angaben'; end if; return jsonb_build_object('id',did,'received_at',when_in,'receipt',(select body from crm_booking_mail where event_key='declaration:'||did||':customer')); end if;
 select id into bid from crm_service_bookings where reference=upper(trim((data_in->>'reference'))) and lower((customer->>'email'))=lower((data_in->>'email'));
 insert into crm_booking_declarations(request_key,request_hash,booking_id,kind,data) values(key_in,hash_in,bid,kind_in,data_in) returning id,received_at into did,when_in;
 body_in='Eingangsbestätigung deiner '||case when kind_in='withdrawal' then 'Widerrufserklärung' else 'Kündigungserklärung' end||E'\nEingegangen: '||to_char(when_in at time zone 'Europe/Berlin','DD.MM.YYYY HH24:MI:SS')||' (Europe/Berlin)'||E'\nName: '||((data_in->>'name'))||E'\nE-Mail: '||((data_in->>'email'))||E'\nVertrag / Buchungsnummer: '||((data_in->>'reference'))||E'\nKündigungsart: '||coalesce((data_in->>'termination'),'')||E'\nGewünschtes Ende: '||coalesce(nullif((data_in->>'end'),''),'zum nächstmöglichen Zeitpunkt')||E'\nBegründung / Nachricht: '||coalesce((data_in->>'reason'),'')||E'\nDie Erklärung ist gespeichert. Die Bestätigung des Eingangs ist keine abschließende Prüfung der Zuordnung oder des wirksamen Vertragsendes. Deine gesetzlichen Rechte richten sich nach dem Zeitpunkt deiner Erklärung.';
 perform public.crm_booking_queue(bid,'declaration:'||did||':customer',(data_in->>'email'),'Eingangsbestätigung deiner Vertragserklärung',body_in);
 perform public.crm_booking_queue(bid,'declaration:'||did||':owner','bewerbung.enricogross30@gmail.com','Vertragserklärung prüfen',body_in||E'\nCRM: https://www.webstudio-expert.de/crm/buchungen');
 insert into crm_notifications(title,href,event_key) values('Vertragserklärung prüfen','/crm/buchungen','declaration:'||did);
 insert into crm_tasks(company_id,title,description,priority,due_at) values((select company_id from crm_service_bookings where id=bid),'Vertragserklärung prüfen',body_in,'hoch',now());
 return jsonb_build_object('id',did,'received_at',when_in,'receipt',body_in);
end $$;
revoke all on function public.crm_booking_declare(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.crm_booking_declare(uuid,text,text,jsonb) to service_role;

create function public.crm_booking_tick() returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare b crm_service_bookings; iid uuid; cy integer; n integer=0; today date=(now() at time zone 'Europe/Berlin')::date;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Kein Zugriff'; end if;
 for b in select * from crm_service_bookings where interval='monthly' and status='In Bearbeitung' and next_on<=today and (ends_on is null or next_on<=ends_on)
 and not exists(select 1 from crm_booking_declarations d where d.booking_id=crm_service_bookings.id and d.reviewed_at is null)
 order by next_on limit 15 for update skip locked loop
  select coalesce(max(cycle),0)+1 into cy from crm_booking_cycles where booking_id=b.id;
  iid=public.crm_booking_invoice(b.id,cy,b.next_on);
  perform public.crm_booking_queue(b.id,'cycle:'||b.id||':'||cy,(b.customer->>'email'),'Deine Monatsrechnung · '||b.reference,
   'Anbei deine Rechnung für '||((b.package->>'name'))||' zum Leistungsmonat ab '||b.next_on::text||'.'||E'\nBetrag: '||replace(to_char(b.amount_cents::numeric/100,'FM999999990.00'),'.',',')||' EUR'||E'\nEmpfänger: '||((b.bank->>'recipient'))||E'\nIBAN: '||((b.bank->>'iban'))||E'\nVerwendungszweck: Bitte die Rechnungsnummer aus der beigefügten Rechnung verwenden.',iid);
  update crm_service_bookings set next_on=(service_start+make_interval(months=>cy))::date where id=b.id;
  insert into crm_booking_events(booking_id,event,data) values(b.id,'Monatsrechnung erstellt',jsonb_build_object('invoice_id',iid));
  n=n+1;
 end loop;
 update crm_service_bookings set next_on=null where ends_on<today and next_on>ends_on;
 return n;
end $$;
revoke all on function public.crm_booking_tick() from public,anon,authenticated;
grant execute on function public.crm_booking_tick() to service_role;

create function public.crm_booking_claim_mail() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare m crm_booking_mail;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Kein Zugriff'; end if;
 update crm_booking_mail set status='unknown',error='Versandlauf unterbrochen; SMTP/Postfach prüfen.' where status='sending' and claimed_at<now()-interval '5 minutes';
 select * into m from crm_booking_mail where status='queued' and next_attempt_at<=now() order by created_at limit 1 for update skip locked;
 if not found then return null; end if;
 update crm_booking_mail set status='sending',claim=gen_random_uuid(),claimed_at=now(),attempts=attempts+1 where id=m.id returning * into m;
 return to_jsonb(m);
end $$;
revoke all on function public.crm_booking_claim_mail() from public,anon,authenticated;
grant execute on function public.crm_booking_claim_mail() to service_role;

create or replace function public.crm_issue(doc_kind text, doc_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare doc jsonb; biz jsonb; customer jsonb; lines jsonb; amount numeric; deduction numeric=0; yr integer=extract(year from (now() at time zone 'Europe/Berlin')::date); num integer; doc_number text; frozen jsonb; adv record;
begin
 if not (coalesce(public.crm_role() in ('administrator','buchhaltung'),false) or (doc_kind='quote' and coalesce(public.crm_role()='vertrieb',false)) or (auth.role()='service_role' and doc_kind='invoice' and exists(select 1 from crm_booking_cycles where invoice_id=doc_id))) then raise exception 'Kein Zugriff'; end if;
 select data into biz from crm_company_settings where key='business';
 if doc_kind='invoice' and coalesce((biz->>'taxNumber'),'')='' and coalesce((biz->>'vatId'),'')='' then raise exception 'Steuernummer oder USt-ID in den CRM-Einstellungen fehlt.'; end if;
 if doc_kind='quote' then
  select to_jsonb(q) into doc from crm_quotes q where id=doc_id for update;
  select jsonb_agg(to_jsonb(i) order by position,created_at),sum(round(quantity*unit_price*(1-coalesce(((doc->>'discount'))::numeric,0)/100)*(1+case when ((biz->>'smallBusiness'))::boolean then 0 else tax_rate/100 end),2)) into lines,amount from crm_quote_items i where quote_id=doc_id;
 elsif doc_kind='invoice' then
  select to_jsonb(i) into doc from crm_invoices i where id=doc_id for update;
  select jsonb_agg(to_jsonb(i) order by position,created_at),sum(round(quantity*unit_price*(1-coalesce(((doc->>'discount'))::numeric,0)/100)*(1+case when ((biz->>'smallBusiness'))::boolean then 0 else tax_rate/100 end),2)) into lines,amount from crm_invoice_items i where invoice_id=doc_id;
 else raise exception 'Ungültiger Dokumenttyp'; end if;
 if doc is null or (doc->>'issued_at') is not null or lines is null then raise exception 'Dokument fehlt, ist bereits ausgestellt oder hat keine Positionen.'; end if;
 if doc_kind='invoice' and (doc->>'service_date') is null and not ((doc->>'kind')='Anzahlung' and exists(select 1 from crm_booking_cycles where invoice_id=doc_id and cycle=1)) then raise exception 'Leistungsdatum fehlt.'; end if;
 select to_jsonb(c) into customer from crm_companies c where id=((doc->>'company_id'))::uuid;
 if doc_kind='invoice' and exists(select 1 from crm_booking_cycles where invoice_id=doc_id) then select b.customer into customer from crm_service_bookings b join crm_booking_cycles c on c.booking_id=b.id where c.invoice_id=doc_id; end if;
 if coalesce((customer->>'street'),'')='' or coalesce((customer->>'postcode'),'')='' or coalesce((customer->>'city'),'')='' then raise exception 'Vollständige Kundenanschrift fehlt.'; end if;
 if doc_kind='invoice' and (doc->>'kind')='Schlussrechnung' then
  for adv in select i.* from crm_invoice_deductions d join crm_invoices i on i.id=d.advance_id where d.invoice_id=doc_id for update of i loop
   if adv.company_id<>((doc->>'company_id'))::uuid or adv.kind<>'Anzahlung' or adv.issued_at is null or adv.document_status='Storniert' then raise exception 'Ungültige Anzahlungsverrechnung'; end if;
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

grant execute on function public.crm_issue(text,uuid) to service_role;

-- Payments recorded in the existing accounting UI also update the same booking.
create function public.crm_booking_payment_sync() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare cy crm_booking_cycles; b crm_service_bookings; bill crm_invoices; pid uuid;
begin
 select * into cy from crm_booking_cycles where invoice_id=new.invoice_id;
 if not found then return new; end if;
 select * into strict b from crm_service_bookings where id=cy.booking_id for update;
 select * into strict cy from crm_booking_cycles where id=cy.id for update;
 select * into strict bill from crm_invoices where id=new.invoice_id;
 if cy.payment_id is not null or (select coalesce(sum(amount),0) from crm_payments where invoice_id=bill.id)<bill.total then return new; end if;
 update crm_booking_cycles set payment_id=new.id where id=cy.id;
 if b.status='Storniert' then
  insert into crm_tasks(company_id,title,description,priority,due_at) values(b.company_id,'Zahlung für stornierte Buchung prüfen',b.reference||': Rückzahlung/Verrechnung prüfen. Kein Projektstart.','hoch',now());
  insert into crm_booking_events(booking_id,actor,event) values(b.id,auth.uid(),'Zahlung auf stornierte Buchung; Klärung erforderlich');
  return new;
 end if;
 update crm_companies set is_customer=true where id=b.company_id;
 if b.project_id is null then
  insert into crm_projects(company_id,name,description,budget) values(b.company_id,(b.package->>'name')||' · '||b.reference,b.description,b.amount_cents::numeric/100) returning id into pid;
  update crm_service_bookings set project_id=pid where id=b.id;
 end if;
 update crm_service_bookings set status=case when status in ('Wartet auf Zahlung','Buchung eingegangen') then 'Bezahlt' else status end where id=b.id;
 perform public.crm_booking_queue(b.id,'paid:'||cy.id,b.customer->>'email','Zahlung eingegangen · '||b.reference,'Vielen Dank, der Zahlungseingang für '||bill.number||' wurde bestätigt. Den Leistungsbeginn stimmen wir gesondert ab.');
 insert into crm_booking_events(booking_id,actor,event,data) values(b.id,auth.uid(),'Zahlung bestätigt; Projekt zugeordnet',jsonb_build_object('invoice_id',bill.id,'payment_id',new.id));
 return new;
end $$;
revoke all on function public.crm_booking_payment_sync() from public,anon,authenticated;
create trigger booking_payment_sync after insert on public.crm_payments for each row execute function public.crm_booking_payment_sync();


create function public.crm_booking_retry_mail(mail_in uuid, checked_in boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare m crm_booking_mail;
begin
 if coalesce(public.crm_role(),'') not in ('administrator','buchhaltung') or checked_in is distinct from true then raise exception 'Berechtigung und Prüfung des Nichtversands erforderlich'; end if;
 select * into strict m from crm_booking_mail where id=mail_in for update;
 if m.status<>'unknown' then raise exception 'Nur unklare Sendungen nach Prüfung erneut freigeben'; end if;
 update crm_booking_mail set status='queued',claim=null,claimed_at=null,error='',next_attempt_at=now() where id=mail_in;
 insert into crm_booking_events(booking_id,actor,event,data) values(m.booking_id,auth.uid(),'Nichtversand geprüft; erneut freigegeben',jsonb_build_object('mail_id',mail_in));
end $$;
revoke all on function public.crm_booking_retry_mail(uuid,boolean) from public,anon;
grant execute on function public.crm_booking_retry_mail(uuid,boolean) to authenticated;

commit;
