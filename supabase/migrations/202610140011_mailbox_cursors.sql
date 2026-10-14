create table public.crm_mailbox_cursors(account_id uuid not null references public.crm_email_accounts(id) on delete cascade,mailbox text not null,last_uid bigint not null default 0,uid_validity text not null,primary key(account_id,mailbox));
alter table public.crm_mailbox_cursors enable row level security;
