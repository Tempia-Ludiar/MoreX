-- Run this once in Supabase Dashboard > SQL Editor.
-- It marks the initial demo tips so each user can remove only those tips.

alter table public.tips
  add column if not exists is_sample boolean not null default false;

update public.tips
set is_sample = true
where (
  title = 'ClaudeでLP構成を作るTips'
  and content = 'Claudeにターゲット、課題、オファー、CTAを渡してLP構成を3案出してもらう。最後に一番強い構成を選び、見出しだけ人間が磨く。'
) or (
  title = 'Codexに仕様書を渡して実装させるTips'
  and content = '設計書、禁止事項、画面一覧、データ型、完了条件をまとめてからCodexに渡すと、実装のブレが減る。'
) or (
  title = 'ChatGPTでKindle章構成を整理するTips'
  and content = '読者の悩み、到達点、章ごとの役割を先に決めてから、章タイトルと見出しを生成する。'
);
