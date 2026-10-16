-- 시공 후기. 여러 번 실행해도 안전, 기존 데이터 유지.

create table if not exists public.quote_reviews (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references public.quote_requests (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 5 and 1000),
  allow_public boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.quote_reviews enable row level security;

drop policy if exists "본인 후기 등록" on public.quote_reviews;
create policy "본인 후기 등록" on public.quote_reviews
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and approved = false
    and exists (
      select 1 from public.quote_requests q
      where q.id = quote_id and q.user_id = auth.uid() and q.status = 'done' and q.build_at is not null and q.build_at <= now()
    )
  );

drop policy if exists "본인 후기 조회" on public.quote_reviews;
create policy "본인 후기 조회" on public.quote_reviews
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "공개 후기 조회" on public.quote_reviews;
create policy "공개 후기 조회" on public.quote_reviews
  for select to anon, authenticated
  using (allow_public and approved);
