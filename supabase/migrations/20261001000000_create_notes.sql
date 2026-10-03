create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null
    constraint notes_title_not_blank check (title !~ '^[[:space:]]*$'),
  content text not null
    constraint notes_content_not_blank check (content !~ '^[[:space:]]*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;
alter table public.notes force row level security;

revoke all on public.notes from public, anon, authenticated;
grant select, insert, update, delete on public.notes to authenticated;

create policy "Users can select their own notes"
  on public.notes for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can insert their own notes"
  on public.notes for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Users can update their own notes"
  on public.notes for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users can delete their own notes"
  on public.notes for delete to authenticated
  using ((select auth.uid()) = owner_id);

create function public.set_note_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_note_updated_at();
