-- 페이지 번호 확인용 테스트 글 지우기
delete from public.blog_posts where slug like 'test-page-%';
