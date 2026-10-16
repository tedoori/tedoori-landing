-- 견적 응답(진행·조정·보류) + 시공 일정. 여러 번 실행해도 안전, 기존 데이터 유지.

-- 1. 칸 추가
alter table public.quote_requests add column if not exists customer_response text;      -- go(진행) / adjust(조정 상담) / hold(보류)
alter table public.quote_requests add column if not exists responded_at timestamptz;
alter table public.quote_requests add column if not exists build_at timestamptz;         -- 시공 일정 (운영자가 입력)
alter table public.quote_requests add column if not exists build_note text;              -- 시공 안내 메모

-- 2. 고객이 직접 못 바꾸는 칸 보호 (응답 함수 안에서만 상태 변경 허용)
create or replace function public.keep_operator_fields()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' and coalesce(current_setting('tedoori.respond', true), '') <> '1' then
    new.status := old.status;
    new.visit_at := old.visit_at;
    new.visit_note := old.visit_note;
    new.build_at := old.build_at;
    new.build_note := old.build_note;
    new.customer_response := old.customer_response;
    new.responded_at := old.responded_at;
  end if;
  return new;
end;
$$;

-- 3. 고객 응답 함수: 본인 신청이고 '견적 도착' 상태일 때만
create or replace function public.respond_estimate(qid uuid, choice text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cur text;
begin
  if choice not in ('go', 'adjust', 'hold') then
    raise exception 'invalid choice';
  end if;
  select status into cur from public.quote_requests where id = qid and user_id = auth.uid();
  if cur is null then
    raise exception 'not found';
  end if;
  if cur <> 'quoted' then
    raise exception 'not quoted';
  end if;
  perform set_config('tedoori.respond', '1', true);
  update public.quote_requests
    set status = case choice when 'go' then 'done' when 'hold' then 'hold' else status end,
        customer_response = choice,
        responded_at = now()
    where id = qid;
  return choice;
end;
$$;

revoke all on function public.respond_estimate(uuid, text) from public;
grant execute on function public.respond_estimate(uuid, text) to authenticated;
