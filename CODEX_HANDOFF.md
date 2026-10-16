# Codex 인수인계 메모

작성일: 2026-10-15 (Asia/Seoul)

## 목적

Claude Code 세션이 중단된 뒤 작업을 이어갈 때 참고하는 인수인계 문서입니다.

## 현재 프로젝트

- 경로: `C:\Users\Admin\my-site`
- 서비스: 테두리
- 기술 스택: Next.js 16.4, React 19, TypeScript, Supabase, Three.js, GSAP, Lenis
- 프로젝트 지침: 루트 `AGENTS.md` 및 `.claude/` 설정 참고

## 현재 구현 상태

프로젝트는 이미 상당히 진행되어 있습니다. 다음 화면과 기능이 존재합니다.

- 홈 랜딩 페이지
- 서비스 소개
- 이용 안내
- 채팅형 견적 신청
- 내 신청
- 문의하기
- 이용약관 및 개인정보 처리방침
- 전체 메뉴
- 3D 정원 미리보기와 영상·이미지 자산
- Supabase 기반 견적·문의 API
- `/my` 이메일 OTP 인증 및 본인 신청 목록 조회 화면(페이지네이션 포함)
- Tailwind CSS 설정과 shadcn/ui 구성 기반
- Open Graph/Twitter 공유 메타데이터

주요 경로:

- `/`
- `/service`
- `/guide`
- `/quote`
- `/my`
- `/contact`
- `/menu`
- `/terms`
- `/privacy`

## Codex가 확인한 내용

1. 처음 확인한 ChatGPT 프로젝트 미러에는 기획 문서만 있었고 실제 앱 코드는 없었습니다.
2. 실제 Claude Code 작업 폴더가 `C:\Users\Admin\my-site`임을 확인했습니다.
3. 실제 폴더에는 `.claude/`, `app/`, `public/`, `supabase/`, `.next/`, `.netlify/`가 존재합니다.
4. `.netlify/state.json`에 Netlify 사이트 ID가 존재하며, Netlify 배포 설정도 있습니다.
5. GitHub CLI와 Vercel CLI는 현재 설치되어 있지 않았습니다. Git CLI만 확인되었습니다.
6. 루트에 README 파일과 `.git` 디렉터리는 현재 확인되지 않았습니다.

## 실행한 점검

- `npm run build` 성공 이력 확인: 컴파일, TypeScript 검사, 정적 페이지 생성 완료
- 최신 수정 후 `npx tsc --noEmit --incremental false` 성공
- 배포 URL HTTP 200 확인
- 배포 홈 화면의 접근성 트리와 핵심 CTA 확인
- `/quote`에서 지역 선택 후 다음 단계로 이동하는 흐름 확인
- 배포 HTML에서 `og:title`, `og:description`, `og:image`, Twitter 카드 메타데이터 확인
- Vercel Production 환경변수 6개 등록 확인: Supabase 2개, Resend 1개, 메일 주소 3개

### Lighthouse 최종 측정

- 측정 대상: `https://tedoori-landing.vercel.app/`
- Performance: 63
- Accessibility: 100
- Best Practices: 100
- SEO: 100
- 개선 내용: 히어로 영상 지연 로딩, 사용하지 않는 히어로 이미지 요청 제거, CTA·안내 문구 대비 보완
- 주요 지표: FCP 2.5초, LCP 14.2초, Speed Index 6.0초, CLS 0.113
- 측정 결과 파일은 로컬 `lighthouse-report-final.json`에 생성되며, 비밀값은 포함하지 않습니다.

## Codex가 실제로 수정한 내용

- 기존 화면과 컴포넌트를 대체하지 않고 `tailwind.config.ts`, `postcss.config.mjs`, `app/tailwind.css` 추가
- `components.json`, `components/ui/button.tsx`, `lib/utils.ts`로 shadcn/ui 구성 기반 추가
- `app/layout.tsx`에 Open Graph/Twitter 메타데이터와 배포 URL 기준 추가
- README에 기술 스택 및 구성 설명 보강
- 관련 의존성 설치 및 lock 파일 갱신

## 제출 전 남은 확인 작업

### 필수

1. 시크릿 창과 실제 모바일 기기에서 최종 접속 확인
2. 제출 화면에 GitHub·Vercel 링크 입력
3. 실제 모바일 기기에서 첫 화면과 `/quote` CTA 확인
4. 가능하면 테스트용 견적 1건을 제출해 Supabase 저장·메일 수신 확인

## 현재 제출 결과

- GitHub: https://github.com/tedoori/tedoori-landing
- Vercel: https://tedoori-landing.vercel.app
- Vercel 배포 빌드 성공 확인
- 배포 홈 화면과 `/quote` 견적 흐름 확인
- 지역 선택 후 다음 단계로 넘어가는 동작 확인
- 최신 보완 커밋: `1782df9 perf: defer hero intro video`
- 미션 6 CRUD 명세서 추가 커밋: `dd7aa4d docs: define mission 6 quote crud spec`

### 미션 6 다음 작업

- 상세 명세: [`docs/mission-6-crud-spec.md`](docs/mission-6-crud-spec.md)
- 핵심 기능: 이메일 인증 사용자의 견적 신청 관리 CRUD
- 사용자 흐름: 회원가입 없이 접수번호 + 신청 이메일 + 이메일 OTP로 본인 확인
- 구현 순서: `/my` 본인 확인 및 목록 조회(구현 완료) → `/my/[id]` 상세 → `/my/[id]/edit` 수정 → 삭제 및 Storage 정리
- 이 메모 아래의 `/my` 목록 구현 메모부터 CRUD 기능 코드를 단계적으로 추가함

### 2026-10-16 `/my` 목록 구현 메모

- `app/my/MyApplications.tsx`를 추가해 신청 이메일 OTP 발송·검증과 Supabase `quote_requests` 목록 조회를 구현했습니다.
- 인증된 Supabase 세션의 본인 데이터만 RLS를 통해 조회합니다. 접수번호만 입력하는 방식은 제공하지 않습니다.
- 목록은 최신순 10건 페이지네이션이며, 접수번호·지역·작업·주거 형태·신청일·진행 상태를 표시합니다.
- 신청이 없을 때 빈 상태와 `/quote` CTA를 표시하고, 조회 오류·이메일 오류·코드 오류를 안내합니다.
- 기존 상세·수정·삭제 라우트는 아직 구현하지 않았습니다. 목록 항목의 `/my/[id]` 링크는 다음 구현 단계에서 연결해야 합니다.
- 스타일은 `app/my/my.css`에 추가했으며 기존 공통 디자인 토큰과 상태 배지를 재사용합니다.
- 검증: `npx tsc --noEmit --incremental false` 성공, `npm run build` 성공, `http://localhost:3000/my` HTTP 200 확인.

### 미션 6 완료 후 최종 배포

- 최신 CRUD 코드와 QA 결과를 GitHub에 반영한다.
- Vercel Production 배포를 확인한다.
- Vercel 프로젝트에 `tedoori.com` 커스텀 도메인을 추가한다.
- 도메인 DNS 관리 화면에 Vercel이 안내하는 레코드를 등록한다.
- HTTPS 발급과 `https://tedoori.com` 접속을 확인한다.
- 실제 연결 대상은 로컬 `localhost:3000`이 아니라 Vercel Production 배포본이다.

### 확인 필요

- 기존 Netlify 배포를 유지할지, Vercel을 최종 제출 대상으로 사용할지 결정
- GitHub 저장소 공개 여부와 저장소 URL
- 실제 서비스용 약관·개인정보 처리방침의 최종 승인 여부
- 테스트용 견적 제출 후 Supabase 저장 및 운영자 메일 수신 확인
- Vercel 환경변수 중 `RESEND_API_KEY`는 기능상 등록됐지만, Vercel에서 Secret 형식 저장을 권장하는 경고가 있을 수 있음

## 작업 원칙

- 기존 구현을 새로 만들거나 대체하지 않습니다.
- 수정 전 관련 파일과 현재 동작을 먼저 확인합니다.
- `sources/`의 기획 자료는 읽기 전용으로 취급합니다.
- `.next/`, `.netlify/`, 미디어 자산은 임의로 삭제하지 않습니다.
- 배포 전에는 모바일과 데스크톱의 핵심 CTA 흐름을 모두 확인합니다.

## 2026-10-16 최신 Codex 작업 기록

### SEO 및 검색 등록

- `app/layout.tsx`에 네이버·구글 사이트 인증 메타태그를 추가했습니다.
- 고객용 페이지별 제목과 설명을 고유하게 설정했습니다.
- 현재 메인 제목은 `전원주택 조경 플랫폼 | 테두리`입니다.
- 서비스 페이지 제목은 `조경업체·조경 플랫폼 | 테두리`입니다.
- `app/sitemap.ts`와 `app/robots.ts`를 추가했습니다.
- 사이트맵에는 고객용 공개 페이지와 `/blog` 글 4개가 포함되어 있습니다.
- `/design`, `/lab-*`, `/my/[id]`, `/my/[id]/edit`는 검색 비노출 또는 내부 화면으로 유지합니다.
- Production 확인 완료: `https://tedoori.com/`, `/robots.txt`, `/sitemap.xml` 및 주요 페이지 메타태그가 정상 응답합니다.

### 조경 블로그

- `/blog` 정보 허브를 추가했습니다. 기존 `/journal` 주소는 `/blog`로 영구 이동합니다.
- 글 4개를 추가했습니다.
  - `/blog/how-landscaping-estimate-works`
  - `/blog/lawn-gravel-stepping-stone`
  - `/blog/small-yard-landscaping-start`
  - `/blog/prepare-landscaping-estimate`
- 각 글에 `테두리 조경견적`, `전원주택 조경` 관련 문맥과 `/quote` CTA를 넣었습니다.
- 전체 메뉴와 sitemap에서 `/blog`와 글 4개로 이동할 수 있습니다.
- 네이버 블로그 발행용 초안은 `docs/naver-blog-drafts.md`에 정리했습니다.
- 네이버 블로그는 아직 만들지 않았으며, 초안은 추후 발행할 수 있도록 보존했습니다.
- Footer에 `teduri.official@gmail.com`, 카카오톡 `@테두리`, Instagram `@tedoori_official`을 연결했습니다.

### 최신 커밋 및 배포

- `9a1c69a seo: refine page titles and descriptions`
- `c3cda7c seo: include landscaping platform keywords`
- `5939c0a feat: add landscaping journal and blog drafts`
- `b2aa0a4 feat: switch journal to blog and add social channels`
- GitHub: `https://github.com/tedoori/tedoori-landing`
- Production: `https://tedoori.com`
- 최신 Vercel Production 배포 상태: Ready 확인
- 최근 변경 후 `npx tsc --noEmit --incremental false`, `npm run build` 성공

### 다음 사용자 확인 필요

- 네이버 블로그를 실제로 개설할 경우 초안과 `/blog` 글의 상호 링크 확인


### 2026-10-16 미션 6 CRUD 구현 완료 (Claude Code)

- Supabase 에 `supabase/mission-6-crud.sql` 실행 완료 (`updated_at`, 수정·삭제·사진 삭제 정책, 목록 인덱스)
- Route Handler: `app/api/quotes/route.ts`(목록 GET·등록 POST), `app/api/quotes/[id]/route.ts`(상세 GET·수정 PATCH·삭제 DELETE)
  - 이메일 인증 토큰으로 사용자 권한 Supabase 클라이언트를 만들어 RLS 유지, 검증은 `lib/quote-server.ts`
- 화면: `/my` 목록(API 사용) → `/my/[id]` 상세 → `/my/[id]/edit` 수정 → 상세의 삭제 확인 창
- 사진 규칙 공용화 `lib/photo.ts` (JPG·PNG·WebP, 10MB, 5장) — `/quote` 에도 적용
- 운영자 메일: 수정 시 바뀐 항목만 전/후, 삭제 시 취소 알림 (`lib/mail.ts`, `lib/emails.ts`) — 로컬에서 수신 확인
- 확인 코드 메일 문구를 견적 신청·내 신청 공용으로 변경 (`supabase/email-otp.html`, Supabase 템플릿에도 반영 완료)
- README 를 미션 6 기준으로 다시 작성, QA 결과 `docs/mission-6-qa.md`
- 남은 일: 배포 환경에서 등록(사진 포함)→목록→상세→수정→삭제·메일 점검 후 QA 표 갱신
