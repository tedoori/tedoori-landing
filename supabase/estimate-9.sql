-- '완료'(completed) 상태 + 완료 보고(남길 말·사진). 여러 번 실행해도 안전, 기존 데이터 유지.
-- done = 진행 확정 (고객이 진행하기로 함) / completed = 완료 (시공·배송·자재까지 모두 끝나 거래 종료)

-- 1. 완료 보고 칸
alter table public.quote_requests add column if not exists completed_at timestamptz;
alter table public.quote_requests add column if not exists completion_note text;                    -- 업체·운영자가 남기는 말 (관리법 안내 등)
alter table public.quote_requests add column if not exists completion_photos text[] not null default '{}'; -- 완료 사진: quote-photos 의 '<고객 user_id>/complete/파일명'

-- 2. 고객이 못 바꾸는 칸에 완료 보고 추가
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
    new.customer_response := old.customer_response;
    new.responded_at := old.responded_at;
    new.completed_at := old.completed_at;
    new.completion_note := old.completion_note;
    new.completion_photos := old.completion_photos;
  end if;
  return new;
end;
$$;

-- 3. 후기는 '완료' 된 신청에 남김 (예전 방식: 진행 확정 + 시공일 지남 도 허용)
drop policy if exists "본인 후기 등록" on public.quote_reviews;
create policy "본인 후기 등록" on public.quote_reviews
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and approved = false
    and exists (
      select 1 from public.quote_requests q
      where q.id = quote_id and q.user_id = auth.uid()
        and (q.status = 'completed' or (q.status = 'done' and q.build_at is not null and q.build_at <= now()))
    )
  );
