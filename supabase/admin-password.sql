-- 관리자 계정 비밀번호 정하기 (이미 있는 계정)
-- ★ '여기에_새_비밀번호' 를 원하는 비밀번호로 바꾼 뒤 실행하세요. 실행 후에는 이 창의 글을 지워두세요.
-- 비밀번호는 암호화되어 저장돼요.

update auth.users
set encrypted_password = extensions.crypt('여기에_새_비밀번호', extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = lower('tedoori.official@gmail.com');

-- 결과가 'UPDATE 1' 이면 성공. 'UPDATE 0' 이면 그 이메일 계정이 없는 거예요
-- (그때는 Authentication → Users → Add user → Create new user 로 이메일·비밀번호를 넣고 Auto Confirm 체크)
