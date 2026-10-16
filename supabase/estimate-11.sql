-- 관리자 '자주 쓰는 문구' 저장. 여러 번 실행해도 안전.
create table if not exists public.admin_phrases (
  id uuid primary key default gen_random_uuid(),
  field text not null,          -- 어느 칸의 문구인지 (visit_note, build_note, next_title …)
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists admin_phrases_field on public.admin_phrases (field);

alter table public.admin_phrases enable row level security;
drop policy if exists "관리자 문구" on public.admin_phrases;
create policy "관리자 문구" on public.admin_phrases for all to authenticated using (public.is_admin()) with check (public.is_admin());
