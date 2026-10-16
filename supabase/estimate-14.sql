-- 견적서를 조경업체 방식으로: 공종명 · 규격 · 단위 · 수량 · 단가 · 금액, 아래 계 · 공과잡비(%) · 합계 · 부가세
-- 예전 칸(자재비·배송비·시공비, 장비비 등)은 지우지 않아요. 예전 견적서는 그대로 보이고, 고치면 새 방식으로 바뀌어요.
-- Supabase → SQL Editor 에 붙여넣고 실행하세요. 여러 번 실행해도 안전해요.

alter table public.quote_estimate_items add column if not exists unit text;                               -- 단위: 식 · 빠렛 · 주 · 일 · 타 · ㎡ …
alter table public.quote_estimate_items add column if not exists qty numeric(12, 2);                      -- 수량 (숫자)
alter table public.quote_estimate_items add column if not exists unit_price bigint not null default 0 check (unit_price >= 0); -- 단가

alter table public.quote_estimate_items add column if not exists kind text not null default 'material' check (kind in ('material', 'delivery', 'labor')); -- 구분: 자재 · 배송 · 시공

alter table public.quote_estimates add column if not exists overhead_rate numeric(5, 2) not null default 0 check (overhead_rate between 0 and 50); -- 공과잡비 %
