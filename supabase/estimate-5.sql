-- 방문 주소 수집 동의 시각 (주소 저장할 때 고객이 체크). 여러 번 실행해도 안전.
alter table public.quote_requests add column if not exists visit_address_agreed_at timestamptz;
