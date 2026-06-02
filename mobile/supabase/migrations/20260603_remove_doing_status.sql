-- Run this once in Supabase Dashboard > SQL Editor.
-- It removes the unused "doing" status and returns existing held tips to Todo.

update public.tips
set status = 'todo'
where status = 'doing';

alter table public.tips
  drop constraint if exists tips_status_check;

alter table public.tips
  add constraint tips_status_check
  check (status in ('todo', 'done', 'trash'));
