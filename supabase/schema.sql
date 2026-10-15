-- 테두리 견적 신청 저장소
-- Supabase 대시보드 → SQL Editor → New query 에 이 파일 전체를 붙여 넣고 Run 을 누르세요.
-- 여러 번 실행해도 안전하도록 작성했습니다.

-- 1. 접수번호용 순번
create sequence if not exists public.quote_receipt_seq;

-- 2. 견적 신청 표
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  receipt_no text unique,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email text not null,
  region text not null check (region in ('서울', '경기', '인천')),
  district text not null,
  housing text not null,
  works text[] not null default '{}',
  works_unknown boolean not null default false,
  scope text not null,
  photo_paths text[] not null default '{}',
  size_note text,
  wish text,
  timing text not null,
  budget text,
  name text,
  phone text,
  privacy_agreed_at timestamptz not null,
  terms_agreed_at timestamptz not null,
  status text not null default 'received',
  created_at timestamptz not null default now(),
  constraint works_or_unknown check (works_unknown or cardinality(works) > 0),
  constraint photo_limit check (cardinality(photo_paths) <= 5)
);

-- 3. 접수번호 자동 생성: TD-연월-순번 (예: TD-2610-0001)
create or replace function public.set_quote_receipt_no()
returns trigger
language plpgsql
as $$
begin
  new.receipt_no := 'TD-' || to_char(now() at time zone 'Asia/Seoul', 'YYMM') || '-' ||
    lpad(nextval('public.quote_receipt_seq')::text, 4, '0');
  new.status := 'received';
  return new;
end;
$$;

drop trigger if exists quote_receipt_no on public.quote_requests;
create trigger quote_receipt_no
  before insert on public.quote_requests
  for each row execute function public.set_quote_receipt_no();

-- 4. 접근 규칙: 이메일 확인을 마친 본인만 자기 신청을 넣고 볼 수 있음
alter table public.quote_requests enable row level security;

drop policy if exists "본인 신청 등록" on public.quote_requests;
create policy "본인 신청 등록" on public.quote_requests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and lower(email) = lower(auth.jwt() ->> 'email')
  );

drop policy if exists "본인 신청 조회" on public.quote_requests;
create policy "본인 신청 조회" on public.quote_requests
  for select to authenticated
  using (user_id = auth.uid());

-- 5. 현장 사진 보관함 (비공개)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quote-photos', 'quote-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "본인 사진 올리기" on storage.objects;
create policy "본인 사진 올리기" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'quote-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "본인 사진 보기" on storage.objects;
create policy "본인 사진 보기" on storage.objects
  for select to authenticated
  using (bucket_id = 'quote-photos' and (storage.foldername(name))[1] = auth.uid()::text);
