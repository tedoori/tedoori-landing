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
- 구현 순서: `/my` 목록 → `/my/[id]` 상세 → `/my/[id]/edit` 수정 → 삭제 및 Storage 정리
- 명세서 작성 이후 아직 CRUD 기능 코드는 수정하지 않음

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

