-- Run this once in Supabase Dashboard > SQL Editor.
-- Every tips row and image is restricted to its signed-in owner.

create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text,
  image_path text,
  source_url text,
  memo text,
  category text,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done', 'trash')),
  scheduled_date date,
  priority integer not null default 50 check (priority between 1 and 100),
  after_memo text,
  is_in_my_tips boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tips_user_created_at_idx
  on public.tips (user_id, created_at desc);

alter table public.tips enable row level security;

drop policy if exists "tips_select_own" on public.tips;
create policy "tips_select_own" on public.tips
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "tips_insert_own" on public.tips;
create policy "tips_insert_own" on public.tips
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "tips_update_own" on public.tips;
create policy "tips_update_own" on public.tips
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "tips_delete_own" on public.tips;
create policy "tips_delete_own" on public.tips
  for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('tip-images', 'tip-images', false)
on conflict (id) do update set public = false;

drop policy if exists "tip_images_select_own" on storage.objects;
create policy "tip_images_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'tip-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "tip_images_insert_own" on storage.objects;
create policy "tip_images_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'tip-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "tip_images_delete_own" on storage.objects;
create policy "tip_images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'tip-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
