-- 고객 화면 문구를 관리자가 직접 바꾸는 칸. 여러 번 실행해도 안전, 기존 데이터 유지.

alter table public.quote_requests add column if not exists build_scope text[];   -- 작업 종류: labor(시공) / delivery(배송) / material(자재 준비)
alter table public.quote_requests add column if not exists next_title text;      -- 홈 '지금 할 일' 제목 (비우면 자동 문구)
alter table public.quote_requests add column if not exists next_desc text;       -- 홈 '지금 할 일' 설명

-- 고객이 못 바꾸는 칸에 추가
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
    new.completed_at := old.completed_at;
    new.completion_note := old.completion_note;
    new.completion_photos := old.completion_photos;
    new.next_title := old.next_title;
    new.next_desc := old.next_desc;
  end if;
  return new;
end;
$$;
