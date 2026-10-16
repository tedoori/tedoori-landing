-- 견적서 보완 (조경업체 확인 반영)
-- Supabase SQL Editor 에 붙여 넣고 Run. 여러 번 실행해도 안전, 기존 데이터 유지.
-- (표를 새로 만들지 않아 RLS 경고는 뜨지 않아야 해요. 떠도 초록 버튼을 누르면 돼요)

-- 1. 현장 특이사항: 땅이 질다, 배수가 안 된다 등 (시공 방법·추가 비용에 영향)
alter table public.quote_estimates add column if not exists site_issues text;

-- 2. 추가 비용 (견적서 전체 기준, 원)
alter table public.quote_estimates add column if not exists equipment_cost int not null default 0 check (equipment_cost >= 0);   -- 장비비 (굴삭기·운반 장비 등)
alter table public.quote_estimates add column if not exists waste_cost int not null default 0 check (waste_cost >= 0);           -- 폐기물 처리비 (기존 흙·잡석 반출 등)
alter table public.quote_estimates add column if not exists extra_labor_cost int not null default 0 check (extra_labor_cost >= 0); -- 추가 인건비 (시공비 외 인력)
alter table public.quote_estimates add column if not exists extra_note text;                                                      -- 추가 비용 설명

-- 3. 식비 등 현장 경비: 시공비에 포함(true) / 별도 청구(false)
alter table public.quote_estimates add column if not exists meals_included boolean not null default true;

-- 참고: 수량(quantity)은 자유 글자라 '20㎡', '1파레트', '8장', '3그루' 처럼 때에 맞게 적으면 돼요.
