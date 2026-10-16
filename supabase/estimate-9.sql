-- estimate-8.sql(관리자) 다음에 실행하세요.
-- 진행 범위 저장 (자재 / 배송 / 시공). 여러 번 실행해도 안전, 기존 데이터 유지.
-- 운영자가 전화로 정했을 때는 Table Editor 에서 build_scope 를 {labor} 처럼 직접 넣어도 돼요.

alter table public.quote_requests add column if not exists build_scope text[];   -- 예: {material,delivery} / {material,delivery,labor}

-- 고객이 못 바꾸는 칸에 build_scope 추가 (관리자 예외는 estimate-8.sql 그대로 유지)
create or replace function public.keep_operator_fields()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated'
     and not public.is_admin()
     and coalesce(current_setting('tedoori.respond', true), '') <> '1' then
    new.status := old.status;
    new.visit_at := old.visit_at;
    new.visit_note := old.visit_note;
    new.build_at := old.build_at;
    new.build_note := old.build_note;
    new.build_scope := old.build_scope;
    new.customer_response := old.customer_response;
    new.responded_at := old.responded_at;
  end if;
  return new;
end;
$$;

-- 응답 함수: 진행할 때 범위도 함께 저장 (예전 2개 인자 버전은 지움)
drop function if exists public.respond_estimate(uuid, text);
create or replace function public.respond_estimate(qid uuid, choice text, scope text[] default null)
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
  if scope is not null and not (scope <@ array['material', 'delivery', 'labor']) then
    raise exception 'invalid scope';
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
        responded_at = now(),
        build_scope = case when choice = 'go' then scope else build_scope end
    where id = qid;
  return choice;
end;
$$;

revoke all on function public.respond_estimate(uuid, text, text[]) from public;
grant execute on function public.respond_estimate(uuid, text, text[]) to authenticated;
