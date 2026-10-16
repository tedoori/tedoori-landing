-- 방문 주소 (실측 일정 정할 때 고객이 '내 신청'에서 직접 입력). 여러 번 실행해도 안전, 기존 데이터 유지.
alter table public.quote_requests add column if not exists visit_address text;        -- 도로명 주소 (주소 검색)
alter table public.quote_requests add column if not exists visit_address_detail text; -- 동·호수 등 상세
alter table public.quote_requests add column if not exists visit_memo text;           -- 공동현관·주차 등 방문 메모
