-- 견적 항목에 '규격' 칸 추가 (예: 600×300×30mm, H1.5m, 20~40mm). 여러 번 실행해도 안전, 기존 데이터 유지.
alter table public.quote_estimate_items add column if not exists spec text;
