-- 견적서를 보고 3일 동안 응답이 없으면 고객에게 안내 메일 한 번
-- 방식: 매일 아침 9시(한국 시간) 예약 작업이 해당 신청에 estimate_reminded_at 을 적음
--       → 이미 연결된 상태 알림 웹훅(status_notify)이 그 변화를 보고 안내 메일을 보냄
-- Supabase → SQL Editor 에 통째로 붙여넣고 실행하세요. 여러 번 실행해도 안전해요.

-- 1. 안내 메일을 보낸 시각
alter table public.quote_requests add column if not exists estimate_reminded_at timestamptz;

-- 2. 고객은 이 칸을 바꿀 수 없음 (관리자·예약 작업만)
create or replace function public.keep_reminder_field()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' and not public.is_admin() then
    new.estimate_reminded_at := old.estimate_reminded_at;
  end if;
  -- 견적서를 다시 보내면(다른 상태 → 견적 도착) 안내도 다시 한 번 갈 수 있게
  if new.status = 'quoted' and old.status is distinct from 'quoted' then
    new.estimate_reminded_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists quote_keep_reminder_field on public.quote_requests;
create trigger quote_keep_reminder_field
  before update on public.quote_requests
  for each row execute function public.keep_reminder_field();

-- 3. 안내가 필요한 신청에 표시 (견적 도착 상태 · 응답 없음 · 견적서 발행 3일 지남 · 아직 안내 안 함)
create or replace function public.mark_estimate_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  update public.quote_requests q
     set estimate_reminded_at = now()
   where q.status = 'quoted'
     and q.customer_response is null
     and q.estimate_reminded_at is null
     and exists (
       select 1 from public.quote_estimates e
        where e.quote_id = q.id
          and e.issued_at < now() - interval '3 days'
          and (e.valid_until is null or e.valid_until >= current_date)
     );
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.mark_estimate_reminders() from public, anon, authenticated;

-- 4. 매일 아침 9시(한국) = 00:00 UTC 에 실행
create extension if not exists pg_cron;
select cron.unschedule('estimate-reminder') where exists (select 1 from cron.job where jobname = 'estimate-reminder');
select cron.schedule('estimate-reminder', '0 0 * * *', $$select public.mark_estimate_reminders()$$);

-- 확인: select * from cron.job where jobname = 'estimate-reminder';
