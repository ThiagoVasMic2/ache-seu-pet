alter table public.profiles
    add column if not exists whatsapp_phone text;
alter table public.profiles drop constraint if exists profiles_whatsapp_phone_check;
alter table public.profiles add constraint profiles_whatsapp_phone_check
    check (whatsapp_phone is null or whatsapp_phone ~ '^\+[1-9][0-9]{9,14}$');

update public.profiles p
set whatsapp_phone = u.raw_user_meta_data->>'whatsapp_phone'
from auth.users u
where p.id = u.id
  and p.whatsapp_phone is null
  and u.raw_user_meta_data->>'whatsapp_phone' ~ '^\+[1-9][0-9]{9,14}$';

alter table public.messages
    add column if not exists image_path text;
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages drop constraint if exists messages_check;
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check
    check (image_path is not null or length(trim(body)) between 1 and 2000);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-images', 'chat-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

revoke select on public.profiles from authenticated;
grant select (id, display_name, avatar_path, created_at) on public.profiles to authenticated;
grant update (display_name, avatar_path, whatsapp_phone) on public.profiles to authenticated;

drop policy if exists "Participants can read chat images" on storage.objects;
create policy "Participants can read chat images"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'chat-images'
        and exists (
            select 1
            from public.conversations
            where conversations.id::text = (storage.foldername(name))[1]
              and (
                  conversations.owner_id = (select auth.uid())
                  or conversations.visitor_id = (select auth.uid())
              )
        )
    );

drop policy if exists "Participants can upload chat images" on storage.objects;
create policy "Participants can upload chat images"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'chat-images'
        and (storage.foldername(name))[2] = (select auth.uid())::text
        and exists (
            select 1
            from public.conversations
            where conversations.id::text = (storage.foldername(name))[1]
              and (
                  conversations.owner_id = (select auth.uid())
                  or conversations.visitor_id = (select auth.uid())
              )
        )
    );

drop policy if exists "Participants can delete their chat images" on storage.objects;
create policy "Participants can delete their chat images"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'chat-images'
        and (storage.foldername(name))[2] = (select auth.uid())::text
        and exists (
            select 1
            from public.conversations
            where conversations.id::text = (storage.foldername(name))[1]
              and (
                  conversations.owner_id = (select auth.uid())
                  or conversations.visitor_id = (select auth.uid())
              )
        )
    );

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    insert into public.profiles (id, display_name, whatsapp_phone)
    values (
        new.id,
        left(coalesce(
            nullif(new.raw_user_meta_data->>'display_name', ''),
            nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
            'Usuário'
        ), 40),
        case
            when new.raw_user_meta_data->>'whatsapp_phone' ~ '^\+[1-9][0-9]{9,14}$'
            then new.raw_user_meta_data->>'whatsapp_phone'
        end
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

create or replace function public.get_my_whatsapp_phone()
returns text
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
    select whatsapp_phone
    from public.profiles
    where id = auth.uid()
$$;

revoke all on function public.get_my_whatsapp_phone() from public, anon;
grant execute on function public.get_my_whatsapp_phone() to authenticated;

create or replace function public.get_conversation_contact(p_conversation_id uuid)
returns table (display_name text, email text, whatsapp_phone text)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
    select p.display_name,
           case when u.email_confirmed_at is not null then u.email end,
           case
               when u.phone_confirmed_at is not null and u.phone = p.whatsapp_phone
               then p.whatsapp_phone
           end
    from public.conversations c
    join public.profiles p
      on p.id = case
          when c.owner_id = auth.uid() then c.visitor_id
          else c.owner_id
      end
    join auth.users u on u.id = p.id
    where c.id = p_conversation_id
      and auth.uid() in (c.owner_id, c.visitor_id)
$$;

revoke all on function public.get_conversation_contact(uuid) from public, anon;
grant execute on function public.get_conversation_contact(uuid) to authenticated;
