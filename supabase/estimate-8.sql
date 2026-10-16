-- 관리자 권한. 여러 번 실행해도 안전, 기존 데이터 유지.
-- ★ 맨 아래 insert 의 이메일을 관리자로 쓸 이메일로 바꾼 뒤 실행하세요. (그 이메일로 확인 코드를 받아 로그인해요)

-- 1. 관리자 명단
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- 명단은 아무도 화면에서 읽거나 바꾸지 못함 (SQL Editor 에서만 관리)

-- 2. 지금 로그인한 사람이 관리자인지
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
grant execute on function public.is_admin() to authenticated;

-- 3. 관리자는 모든 신청을 보고 고칠 수 있음
drop policy if exists "관리자 신청 조회" on public.quote_requests;
create policy "관리자 신청 조회" on public.quote_requests for select to authenticated using (public.is_admin());
drop policy if exists "관리자 신청 수정" on public.quote_requests;
create policy "관리자 신청 수정" on public.quote_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4. 견적서·항목: 관리자는 쓰기까지
drop policy if exists "관리자 견적서" on public.quote_estimates;
create policy "관리자 견적서" on public.quote_estimates for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "관리자 견적 항목" on public.quote_estimate_items;
create policy "관리자 견적 항목" on public.quote_estimate_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5. 후기: 관리자는 보고 공개 승인
drop policy if exists "관리자 후기 조회" on public.quote_reviews;
create policy "관리자 후기 조회" on public.quote_reviews for select to authenticated using (public.is_admin());
drop policy if exists "관리자 후기 수정" on public.quote_reviews;
create policy "관리자 후기 수정" on public.quote_reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6. 현장 사진: 관리자는 모든 사진 보기·올리기
drop policy if exists "관리자 사진 보기" on storage.objects;
create policy "관리자 사진 보기" on storage.objects for select to authenticated using (bucket_id = 'quote-photos' and public.is_admin());
drop policy if exists "관리자 사진 올리기" on storage.objects;
create policy "관리자 사진 올리기" on storage.objects for insert to authenticated with check (bucket_id = 'quote-photos' and public.is_admin());

-- 7. 고객 보호 장치는 관리자에게는 적용하지 않음
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
  end if;
  return new;
end;
$$;

-- 8. ★ 관리자 이메일 (바꿔서 실행)
insert into public.admins (email) values ('관리자이메일@example.com') on conflict do nothing;
