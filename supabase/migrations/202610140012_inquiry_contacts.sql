create function public.crm_inquiry_contact() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if not exists(select 1 from crm_contacts where company_id=new.company_id and lower(email)=lower(new.data->>'email') and name=new.data->>'name') then
  insert into crm_contacts(company_id,name,email,phone) values(new.company_id,new.data->>'name',coalesce(new.data->>'email',''),coalesce(new.data->>'phone',''));
 end if;return new;end $$;
create trigger inquiry_contact after insert on public.crm_website_inquiries for each row execute function public.crm_inquiry_contact();
