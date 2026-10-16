-- 블로그 페이지 번호 확인용 테스트 글 12개 넣기 (공개). 확인이 끝나면 blog-test-clean.sql 로 지우세요.
insert into public.blog_posts (slug, title, category, excerpt, body_html, published, published_at, reading_minutes)
select 'test-page-' || n,
       '테스트 글 ' || n || ' · 페이지 번호 확인용',
       (array['견적 안내','자재 선택','부분조경','신청 준비','관리 방법','셀프 시공'])[1 + n % 6],
       '페이지 번호를 확인하기 위한 테스트 글이에요. 곧 지워요.',
       '<p>테스트 글이에요.</p>',
       true, now() - (n || ' hours')::interval, 1
from generate_series(1, 12) as n
on conflict (slug) do nothing;
