-- 테두리 견적서 (1단계)
-- Supabase 대시보드 → SQL Editor → New query 에 이 파일 전체를 붙여 넣고 Run 을 누르세요.
-- 여러 번 실행해도 안전하도록 작성했습니다. 기존 신청 데이터는 건드리지 않습니다.

-- 1. 신청에 실측 일정 칸 추가 (상태 'visit' 일 때 고객 화면에 표시)
alter table public.quote_requests add column if not exists visit_at timestamptz;
alter table public.quote_requests add column if not exists visit_note text;

-- 2. 견적서: 신청 하나에 여러 번 낼 수 있음(수정본). 고객에겐 공개(published)된 것 중 가장 최근 것만 보임
create table if not exists public.quote_estimates (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quote_requests (id) on delete cascade,
  published boolean not null default false,       -- 다 쓰고 true 로 바꾸면 고객에게 보임
  issued_at date not null default (now() at time zone 'Asia/Seoul')::date,
  valid_until date,                                -- 비우면 발행일 + 14일로 표시
  vat_included boolean not null default true,      -- 금액에 부가세 포함 여부
  measure_note text,                               -- 실측 메모 (현장 상태 등)
  schedule_note text,                              -- 예상 일정 (예: 계약 후 2주 안, 하루 작업)
  exclusions text,                                 -- 포함되지 않는 것·조건
  photo_paths text[] not null default '{}',        -- 실측 사진: quote-photos 보관함의 '<고객 user_id>/estimate/파일명'
  created_at timestamptz not null default now()
);
create index if not exists quote_estimates_quote_id on public.quote_estimates (quote_id);

-- 3. 견적서 항목 (한 줄 = 한 작업)
create table if not exists public.quote_estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.quote_estimates (id) on delete cascade,
  sort int not null default 0,                     -- 보이는 순서 (작은 수가 위)
  work text not null,                              -- 작업: 잔디 · 자갈 · 디딤석 · 화단 · 식재 · 기타
  material text,                                   -- 자재 (예: 한국잔디 롤)
  quantity text,                                   -- 수량·면적 (예: 20㎡, 3그루)
  material_cost int not null default 0 check (material_cost >= 0),
  delivery_cost int not null default 0 check (delivery_cost >= 0),
  labor_cost int not null default 0 check (labor_cost >= 0),
  note text
);
create index if not exists quote_estimate_items_estimate_id on public.quote_estimate_items (estimate_id);

-- 4. 접근 규칙: 고객은 자기 신청의 '공개된' 견적서만 읽기. 쓰기는 대시보드(관리자)에서만
alter table public.quote_estimates enable row level security;
alter table public.quote_estimate_items enable row level security;

drop policy if exists "본인 견적서 조회" on public.quote_estimates;
create policy "본인 견적서 조회" on public.quote_estimates
  for select to authenticated
  using (
    published
    and exists (select 1 from public.quote_requests q where q.id = quote_id and q.user_id = auth.uid())
  );

drop policy if exists "본인 견적 항목 조회" on public.quote_estimate_items;
create policy "본인 견적 항목 조회" on public.quote_estimate_items
  for select to authenticated
  using (
    exists (
      select 1 from public.quote_estimates e
      join public.quote_requests q on q.id = e.quote_id
      where e.id = estimate_id and e.published and q.user_id = auth.uid()
    )
  );

-- 5. 고객이 직접 바꾸면 안 되는 칸 보호: 로그인한 고객이 수정해도 상태·실측 일정은 그대로 유지
--    (대시보드·서버 관리자 키로 바꿀 때는 그대로 반영)
create or replace function public.keep_operator_fields()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    new.status := old.status;
    new.visit_at := old.visit_at;
    new.visit_note := old.visit_note;
  end if;
  return new;
end;
$$;

drop trigger if exists quote_keep_operator_fields on public.quote_requests;
create trigger quote_keep_operator_fields
  before update on public.quote_requests
  for each row execute function public.keep_operator_fields();
