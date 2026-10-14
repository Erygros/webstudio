alter table public.crm_notifications add column push_sent_at timestamptz;
alter table public.crm_emails add column attachment_ids uuid[] not null default '{}';
-- Inbound originals retain their correspondence link.
alter table public.crm_documents add column email_id uuid references public.crm_emails(id);
