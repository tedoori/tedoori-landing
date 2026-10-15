-- 미션 6: 견적 신청 CRUD 확장
-- 기존 quote_requests 데이터와 등록 흐름은 유지하고,
-- 수정 시각·수정 정책·삭제 정책·사진 삭제 정책만 추가합니다.

-- 1. 수정 시각
alter table public.quote_requests
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_quote_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quote_updated_at on public.quote_requests;
create trigger quote_updated_at
  before update on public.quote_requests
  for each row execute function public.set_quote_updated_at();

-- 2. 본인 신청 수정·삭제
drop policy if exists "본인 신청 수정" on public.quote_requests;
create policy "본인 신청 수정" on public.quote_requests
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and lower(email) = lower(auth.jwt() ->> 'email')
  );

drop policy if exists "본인 신청 삭제" on public.quote_requests;
create policy "본인 신청 삭제" on public.quote_requests
  for delete to authenticated
  using (user_id = auth.uid());

-- 3. 본인 사진 삭제
drop policy if exists "본인 사진 삭제" on storage.objects;
create policy "본인 사진 삭제" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'quote-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. 목록 조회와 최신순 정렬을 위한 인덱스
create index if not exists quote_requests_user_created_idx
  on public.quote_requests (user_id, created_at desc);
