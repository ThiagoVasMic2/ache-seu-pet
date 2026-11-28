create extension if not exists pgcrypto;

create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    event_type text not null check (event_type in (
        'Meu animal está perdido',
        'Encontrei um animal',
        'Encontrei um animal abandonado',
        'Vi um animal perdido',
        'Animal silvestre encontrado',
        'Preciso de ajuda para resgate',
        'Animal para adoção'
    )),
    name text not null default '' check (length(name) <= 100),
    species text not null check (length(trim(species)) between 1 and 80),
    breed text not null default '' check (length(breed) <= 80),
    sex text not null default '' check (sex in ('', 'Macho', 'Fêmea')),
    color text not null default '' check (length(color) <= 100),
    characteristics text not null default '' check (length(characteristics) <= 300),
    event_date date not null,
    city text not null check (length(trim(city)) between 1 and 100),
    region text not null default '' check (length(region) <= 100),
    description text not null check (length(trim(description)) between 1 and 3000),
    photo_path text,
    status text generated always as (
        case event_type
            when 'Meu animal está perdido' then 'Perdido'
            when 'Vi um animal perdido' then 'Perdido'
            when 'Encontrei um animal' then 'Encontrado'
            when 'Encontrei um animal abandonado' then 'Abandonado'
            when 'Animal silvestre encontrado' then 'Silvestre avistado'
            when 'Preciso de ajuda para resgate' then 'Resgate solicitado'
            when 'Animal para adoção' then 'Em Adoção'
        end
    ) stored,
    created_at timestamptz not null default now()
);

alter table public.reports add column if not exists photo_path text;
alter table public.reports add column if not exists reunited_at timestamptz;

alter table public.reports drop constraint if exists reports_event_type_check;
alter table public.reports add constraint reports_event_type_check check (event_type in (
    'Meu animal está perdido',
    'Encontrei um animal',
    'Encontrei um animal abandonado',
    'Vi um animal perdido',
    'Animal silvestre encontrado',
    'Preciso de ajuda para resgate',
    'Animal para adoção'
));

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null default '' check (length(display_name) <= 40),
    avatar_path text,
    created_at timestamptz not null default now()
);

insert into public.profiles (id, display_name, created_at)
select id,
       left(coalesce(
           nullif(raw_user_meta_data->>'display_name', ''),
           nullif(split_part(coalesce(email, ''), '@', 1), ''),
           'Usuário'
       ), 40),
       created_at
from auth.users
on conflict (id) do nothing;

create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null references public.reports(id) on delete cascade,
    owner_id uuid not null references auth.users(id) on delete cascade,
    visitor_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (report_id, visitor_id),
    check (owner_id <> visitor_id)
);

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    sender_id uuid not null references auth.users(id) on delete cascade,
    body text not null check (length(trim(body)) between 1 and 2000),
    created_at timestamptz not null default now()
);

create table if not exists public.abuse_reports (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null,
    reporter_id uuid not null references auth.users(id) on delete cascade,
    reason text not null check (reason in (
        'solicitacao_dinheiro',
        'suspeita_golpe',
        'informacao_falsa',
        'abuso_assedio',
        'suspeita_hack',
        'outro'
    )),
    details text not null default '' check (length(details) <= 2000),
    created_at timestamptz not null default now()
);

create table if not exists public.profile_ratings (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null,
    rater_id uuid not null references auth.users(id) on delete cascade,
    rated_user_id uuid not null references auth.users(id) on delete cascade,
    stars smallint not null check (stars between 1 and 5),
    created_at timestamptz not null default now(),
    unique (conversation_id, rater_id),
    check (rater_id <> rated_user_id)
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_owner_created_at_idx on public.reports (owner_id, created_at desc);
create index if not exists conversations_owner_updated_at_idx on public.conversations (owner_id, updated_at desc);
create index if not exists conversations_visitor_updated_at_idx on public.conversations (visitor_id, updated_at desc);
create index if not exists messages_conversation_created_at_idx on public.messages (conversation_id, created_at);
create index if not exists abuse_reports_created_at_idx on public.abuse_reports (created_at desc);
create index if not exists profile_ratings_rated_user_idx on public.profile_ratings (rated_user_id);

alter table public.reports enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.abuse_reports enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_ratings enable row level security;

insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', false)
on conflict (id) do update set public = excluded.public;

grant usage on schema public to anon, authenticated;
revoke all on public.reports from anon;
grant select on public.reports to authenticated;
grant insert, update, delete on public.reports to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
revoke all on public.abuse_reports from anon, authenticated;
grant insert on public.abuse_reports to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_path) on public.profiles to authenticated;
grant select on public.profile_ratings to authenticated;
grant insert (conversation_id, rater_id, rated_user_id, stars) on public.profile_ratings to authenticated;

drop policy if exists "Anyone can read reports" on public.reports;
drop policy if exists "Authenticated users can read reports" on public.reports;
create policy "Authenticated users can read reports"
    on public.reports for select to authenticated
    using (true);

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
    on public.profiles for select to authenticated
    using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
    on public.profiles for update to authenticated
    using (id = (select auth.uid()))
    with check (id = (select auth.uid()));

drop policy if exists "Authenticated users can read ratings" on public.profile_ratings;
create policy "Authenticated users can read ratings"
    on public.profile_ratings for select to authenticated
    using (true);

drop policy if exists "Participants can rate after reunion" on public.profile_ratings;
create policy "Participants can rate after reunion"
    on public.profile_ratings for insert to authenticated
    with check (
        rater_id = (select auth.uid())
        and exists (
            select 1
            from public.conversations
            join public.reports on reports.id = conversations.report_id
            where conversations.id = profile_ratings.conversation_id
              and reports.reunited_at is not null
              and reports.event_type = 'Meu animal está perdido'
              and (
                  (conversations.owner_id = profile_ratings.rater_id
                   and conversations.visitor_id = profile_ratings.rated_user_id)
                  or
                  (conversations.visitor_id = profile_ratings.rater_id
                   and conversations.owner_id = profile_ratings.rated_user_id)
              )
        )
    );

drop policy if exists "Users can create their own reports" on public.reports;
create policy "Users can create their own reports"
    on public.reports for insert
    with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can update their reports" on public.reports;
create policy "Owners can update their reports"
    on public.reports for update
    using (owner_id = (select auth.uid()))
    with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can delete their reports" on public.reports;
create policy "Owners can delete their reports"
    on public.reports for delete
    using (owner_id = (select auth.uid()));

drop policy if exists "Authenticated users can report other reports" on public.abuse_reports;
create policy "Authenticated users can report other reports"
    on public.abuse_reports for insert to authenticated
    with check (
        reporter_id = (select auth.uid())
        and exists (
            select 1
            from public.reports
            where reports.id = abuse_reports.report_id
              and reports.owner_id <> (select auth.uid())
        )
    );

drop policy if exists "Anyone can view report photos" on storage.objects;
create policy "Anyone can view report photos"
    on storage.objects for select
    using (bucket_id = 'report-photos');

drop policy if exists "Users can upload their own report photos" on storage.objects;
create policy "Users can upload their own report photos"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'report-photos'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Users can delete their own report photos" on storage.objects;
create policy "Users can delete their own report photos"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'report-photos'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Authenticated users can read profile avatars" on storage.objects;
create policy "Authenticated users can read profile avatars"
    on storage.objects for select to authenticated
    using (bucket_id = 'profile-avatars');

drop policy if exists "Users can upload their own profile avatars" on storage.objects;
create policy "Users can upload their own profile avatars"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Users can delete their own profile avatars" on storage.objects;
create policy "Users can delete their own profile avatars"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Participants can read conversations" on public.conversations;
create policy "Participants can read conversations"
    on public.conversations for select
    using (
        owner_id = (select auth.uid())
        or visitor_id = (select auth.uid())
    );

drop policy if exists "Visitors can start conversations about lost pets" on public.conversations;
create policy "Visitors can start conversations about lost pets"
    on public.conversations for insert
    with check (
        visitor_id = (select auth.uid())
        and owner_id <> visitor_id
        and exists (
            select 1
            from public.reports
            where reports.id = conversations.report_id
              and reports.owner_id = conversations.owner_id
              and reports.status = 'Perdido'
              and reports.reunited_at is null
        )
    );

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
    on public.messages for select
    using (
        exists (
            select 1
            from public.conversations
            where conversations.id = messages.conversation_id
              and (
                  conversations.owner_id = (select auth.uid())
                  or conversations.visitor_id = (select auth.uid())
              )
        )
    );

drop policy if exists "Participants can send messages as themselves" on public.messages;
create policy "Participants can send messages as themselves"
    on public.messages for insert
    with check (
        sender_id = (select auth.uid())
        and exists (
            select 1
            from public.conversations
            where conversations.id = messages.conversation_id
              and (
                  conversations.owner_id = (select auth.uid())
                  or conversations.visitor_id = (select auth.uid())
              )
        )
    );

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    update public.conversations
    set updated_at = now()
    where id = new.conversation_id;
    return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
    after insert on public.messages
    for each row execute function public.touch_conversation_on_message();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    insert into public.profiles (id, display_name)
    values (
        new.id,
        left(coalesce(
            nullif(new.raw_user_meta_data->>'display_name', ''),
            nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
            'Usuário'
        ), 40)
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists auth_user_created_profile on auth.users;
create trigger auth_user_created_profile
    after insert on auth.users
    for each row execute function public.create_profile_for_new_user();

do $$
begin
    alter publication supabase_realtime add table public.conversations;
exception
    when duplicate_object then null;
end;
$$;

do $$
begin
    alter publication supabase_realtime add table public.messages;
exception
    when duplicate_object then null;
end;
$$;
