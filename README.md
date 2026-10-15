# 테두리

정원 전체가 아니라, 바꾸고 싶은 공간부터 시작하는 부분조경 견적 서비스입니다.

- 배포 URL: https://tedoori.com (Vercel Production, `https://tedoori-landing.vercel.app` 도 같은 배포)
- GitHub: https://github.com/tedoori/tedoori-landing

## 서비스 소개

테두리는 서울·경기·인천 지역의 단독·전원주택 사용자가 현관, 마당 한편, 집의 경계처럼 필요한 공간만 골라 조경 견적을 요청할 수 있도록 돕습니다.

사용자는 식재·잔디·자갈·디딤석·화단 등 필요한 작업을 살펴보고 채팅형으로 견적을 신청합니다. 접수 후 담당자가 방문 실측을 하고, 실측 내용을 바탕으로 자재비·배송비·시공비를 나눈 견적서를 보냅니다.

## 핵심 기능: 견적 신청 관리 (미션 6 CRUD)

서비스의 핵심 가치는 "필요한 곳만 골라 견적을 요청하고, 그 요청을 관리하는 것"이므로 **견적 신청(`quote_requests`)** 을 CRUD 대상으로 선정했습니다. 상세 명세는 [`docs/mission-6-crud-spec.md`](docs/mission-6-crud-spec.md) 에 있습니다.

### 사용자 흐름

```text
/quote 단계별 질문 → 이메일 확인 코드 → 이름·휴대전화·동의 → 접수(Create)
/my    신청 이메일 → 확인 코드 → 내 신청 목록(Read, 10건씩)
       → /my/[id] 상세(Read) → /my/[id]/edit 수정(Update) → 삭제 확인(Delete)
```

| 화면 | 입력 | 사용자 행동 | 성공 | 실패 |
|---|---|---|---|---|
| `/quote` 등록 | 지역·주거 형태·작업·범위·사진(0~5장)·크기·요청사항·시기·예산·방문 실측·이메일·이름·휴대전화·동의 | 단계별로 고르고 "신청 접수하기" | 접수번호(TD-YYMM-0001) 표시, 고객·운영자 메일 | 필수값·형식 오류는 단계 안에서 안내, 사진·저장 실패는 이유 안내 후 다시 시도 |
| `/my` 목록 | 신청 이메일, 확인 코드 | 코드 받기 → 확인 | 본인 신청만 최신순 10건, 이전·다음 페이지 | 이메일 형식·코드 오류·만료 안내, 신청 없음 빈 상태 |
| `/my/[id]` 상세 | — | 목록에서 신청 선택 | 신청 내용·진행 상태·사진·연락처 | 로딩, 인증 필요, 없는 신청, 불러오기 오류(다시 시도), 사진 없음 |
| `/my/[id]/edit` 수정 | 상세와 같은 항목(접수번호·상태·이메일·신청일 제외), 사진 추가·빼기 | 고치고 "저장하기" / "취소" | 상세로 돌아가 변경 반영, 운영자에게 바뀐 항목 메일 | 칸 옆 오류 안내, 저장 실패 시 입력 유지 |
| 삭제 | — | "삭제하기" → 확인 창에서 다시 "삭제하기" | 목록으로 이동해 안내, 사진도 삭제, 운영자에게 취소 메일 | 실패하면 데이터를 그대로 두고 이유 안내 |

### 회원가입 없는 본인 확인

신청자는 회원가입 없이 **신청 이메일 + 이메일 확인 코드(OTP)** 로 본인임을 확인합니다. 접수번호만으로는 신청 내용을 볼 수 없습니다.
미션 6 기준에서는 인증·권한이 필수가 아니지만, 이름·휴대전화 같은 개인정보를 받는 서비스라 처음부터 Supabase Auth 와 RLS 로 **본인 신청만** 다루도록 했습니다.

## 데이터 구조

### `public.quote_requests`

| 컬럼 | 타입 | 필수 | 설명 |
|---|---|:-:|---|
| `id` | uuid | ✓ | 기본키, 자동 생성 |
| `receipt_no` | text | 자동 | 접수번호 `TD-YYMM-0001`, unique (트리거) |
| `user_id` | uuid | ✓ | `auth.users.id`, 기본값 `auth.uid()` |
| `email` | text | ✓ | 인증된 신청 이메일 |
| `region` | text | ✓ | 서울·경기·인천 (check) |
| `district` | text | ✓ | 시·군·구 |
| `housing` | text | ✓ | 주거 형태 |
| `works` | text[] | ✓ | 작업 목록 (`works_unknown` 이 아니면 1개 이상) |
| `works_unknown` | boolean | ✓ | 작업 미정 여부 |
| `scope` | text | ✓ | 자재만·배송까지·시공까지·상담 |
| `photo_paths` | text[] | ✓ | Storage 경로, 최대 5개 (check) |
| `size_note` | text | | 크기·수량 |
| `wish` | text | | 첫 줄 `방문: …`(방문 실측 방식) + 요청사항 |
| `timing` | text | ✓ | 희망 시기 |
| `budget` | text | | 예산 |
| `name`, `phone` | text | 화면 필수 | 신청자 이름·휴대전화 |
| `privacy_agreed_at`, `terms_agreed_at` | timestamptz | ✓ | 동의 시각 |
| `status` | text | ✓ | `received`·`checking`·`needs`·`quoted`·`done`·`canceled` (운영자만 변경) |
| `created_at` | timestamptz | ✓ | 등록 시각 |
| `updated_at` | timestamptz | ✓ | 수정 시각 (트리거로 자동 갱신) |

### Storage `quote-photos`

- 비공개 버킷, 경로 `{user_id}/{uuid}.jpg`
- 허용 형식 JPG·PNG·WebP, 장당 10MB, 최대 5장 (긴 변 2000px JPEG 로 줄여 업로드)
- 상세 화면에서는 1시간짜리 서명 URL 로 보여줌

### 데이터 처리 규칙

- SQL: [`supabase/schema.sql`](supabase/schema.sql)(테이블·접수번호·등록/조회 정책·사진 업로드/보기 정책), [`supabase/mission-6-crud.sql`](supabase/mission-6-crud.sql)(`updated_at`·수정/삭제 정책·사진 삭제 정책·목록 인덱스)
- RLS: 로그인 사용자는 `user_id = auth.uid()` 인 행만 조회·수정·삭제, 사진은 자기 폴더만
- `user_id`·`email`·`receipt_no`·`status`·`created_at` 은 API 가 받지 않아 사용자가 바꿀 수 없음
- 다른 사람 신청이나 없는 ID 는 똑같이 404 로 응답해 존재 여부가 드러나지 않음

## 데이터 처리 흐름 (Route Handler)

브라우저는 Supabase 테이블을 직접 쓰지 않고 `/api/quotes` 로 요청합니다. 요청의 `Authorization: Bearer <이메일 인증 토큰>` 으로 서버가 사용자 권한의 Supabase 클라이언트를 만들어, RLS 가 그대로 적용됩니다. (사진 파일만 브라우저에서 Storage 로 올린 뒤 경로를 API 로 보냅니다.)

| 메서드 · 경로 | 역할 |
|---|---|
| `GET /api/quotes?page=1` | 내 신청 목록 (최신순 10건, 전체 수·페이지 수) |
| `POST /api/quotes` | 등록 (서버 검증 후 저장) |
| `GET /api/quotes/[id]` | 상세 + 사진 서명 URL |
| `PATCH /api/quotes/[id]` | 수정, 뺀 사진은 Storage 에서 삭제, 운영자에게 변경 항목 메일 |
| `DELETE /api/quotes/[id]` | 삭제, 연결 사진 삭제, 운영자에게 취소 메일 |
| `POST /api/quote-notify` | 접수 직후 고객 접수 메일·운영자 알림 |

- 서버 검증: `lib/quote-server.ts` (지역·작업·범위·시기 허용값, 이름 2자 이상, 휴대전화 형식, 사진 5장·본인 폴더)
- 브라우저 호출: `lib/quote-api.ts`, 사진 규칙: `lib/photo.ts`, 메일: `lib/mail.ts`·`lib/emails.ts`

## 화면과 라우팅

| 경로 | 역할 |
|---|---|
| `/` | 홈 (스크롤 히어로, 신청 예시, 작업 조합, 비용 구성, FAQ) |
| `/service` · `/guide` | 서비스 소개 · 이용 안내 |
| `/quote` | 견적 신청 등록 |
| `/my` | 이메일 확인 · 내 신청 목록 (페이지네이션) |
| `/my/[id]` | 신청 상세 (동적 라우트) |
| `/my/[id]/edit` | 신청 수정 |
| `/contact` · `/menu` · `/terms` · `/privacy` | 문의 · 전체 메뉴 · 약관 · 개인정보 처리방침 |

재사용 UI: `app/_components/ui` (StatusBadge·Callout·EmptyState 등), `SiteHeader`·`SiteFooter`, `/my` 화면 공통 스타일 `app/my/my.css`.

## 실행 방법

```bash
npm install
cp .env.local.example .env.local   # 값 채우기
npm run dev                        # http://localhost:3000
npm run build && npm run start     # 프로덕션 확인
```

Supabase SQL Editor 에서 `supabase/schema.sql` → `supabase/mission-6-crud.sql` 순서로 실행하고, Authentication → Emails 의 Magic Link·Confirm signup 템플릿에 `supabase/email-otp.html` 을 넣습니다.

## 환경 변수

실제 값은 `.env.local`(로컬)과 Vercel 프로젝트 설정(배포)에만 두고 저장소에는 올리지 않습니다.

| 이름 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 키 (RLS 로 보호) |
| `RESEND_API_KEY` | 메일 발송 (Resend) |
| `MAIL_FROM` | 보내는 주소 (`@tedoori.com`) |
| `MAIL_REPLY_TO` | 고객 회신 받을 메일함 |
| `OPERATOR_EMAIL` | 접수·수정·취소 알림 받을 운영자 메일 |

## QA

체크리스트와 결과: [`docs/mission-6-qa.md`](docs/mission-6-qa.md)

## 기술 스택

Next.js 16 App Router · React 19 · TypeScript · Supabase (Postgres·Auth·Storage) · Resend · Tailwind CSS · shadcn/ui 구성 기반 · Three.js / React Three Fiber · GSAP / Lenis · Pretendard
