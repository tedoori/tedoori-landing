-- 완료 보고에 함께 보여줄 블로그 글 (관리자가 고름). 비어 있으면 '관리 방법' 최신 글이 자동으로 보여요.
-- Supabase → SQL Editor 에 붙여넣고 실행하세요. 여러 번 실행해도 안전해요.
alter table public.quote_requests add column if not exists care_posts text[] not null default '{}';
