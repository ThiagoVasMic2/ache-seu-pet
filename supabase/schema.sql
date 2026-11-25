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
        'Preciso de ajuda para resgate'
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
    status text generated always as (
        case event_type
            when 'Meu animal está perdido' then 'Perdido'
            when 'Vi um animal perdido' then 'Perdido'
            when 'Encontrei um animal' then 'Encontrado'
            when 'Encontrei um animal abandonado' then 'Abandonado'
            when 'Animal silvestre encontrado' then 'Silvestre avistado'
            when 'Preciso de ajuda para resgate' then 'Resgate solicitado'
        end
    ) stored,
    created_at timestamptz not null default now()
);

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

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_owner_created_at_idx on public.reports (owner_id, created_at desc);
create index if not exists conversations_owner_updated_at_idx on public.conversations (owner_id, updated_at desc);
create index if not exists conversations_visitor_updated_at_idx on public.conversations (visitor_id, updated_at desc);
create index if not exists messages_conversation_created_at_idx on public.messages (conversation_id, created_at);

alter table public.reports enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.reports to anon, authenticated;
grant insert, update, delete on public.reports to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;

drop policy if exists "Anyone can read reports" on public.reports;
create policy "Anyone can read reports"
    on public.reports for select
    using (true);

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
