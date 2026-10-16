-- 견적서 화면 확인용 테스트 데이터
-- 아래 이메일로 넣은 가장 최근 신청 1건에 테스트 견적서를 붙이고 상태를 '견적 도착'으로 바꿉니다.
-- 다른 이메일로 테스트했다면 두 곳의 이메일을 바꿔주세요.

with q as (
  select id from public.quote_requests
  where lower(email) = lower('you@example.com')
  order by created_at desc limit 1
), e as (
  insert into public.quote_estimates (quote_id, published, measure_note, schedule_note, exclusions)
  select id, true, '[테스트] 현관 앞 흙 바닥 약 20㎡, 배수 양호', '계약 후 2주 안, 하루 작업', '기존 잡석 반출'
  from q
  returning id
)
insert into public.quote_estimate_items (estimate_id, sort, work, material, quantity, material_cost, delivery_cost, labor_cost, note)
select e.id, v.sort, v.work, v.material, v.quantity, v.m, v.d, v.l, v.note
from e,
  (values
    (1, '잔디', '한국잔디 롤', '20㎡', 260000, 50000, 300000, null),
    (2, '디딤석', '화강석 판석', '8장', 240000, 40000, 200000, '현관까지 일자로')
  ) as v(sort, work, material, quantity, m, d, l, note);

update public.quote_requests set status = 'quoted'
where id = (
  select id from public.quote_requests
  where lower(email) = lower('you@example.com')
  order by created_at desc limit 1
);

-- 확인이 끝나면 지우기:
-- delete from public.quote_estimates where measure_note like '[테스트]%';
