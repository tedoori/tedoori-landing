# 테두리

정원 전체가 아니라, 바꾸고 싶은 공간부터 시작하는 부분조경 견적 서비스입니다.

## 서비스 소개

테두리는 서울·경기·인천 지역의 단독·전원주택 사용자가 현관, 마당 한편, 집의 경계처럼 필요한 공간만 골라 조경 견적을 요청할 수 있도록 돕습니다.

사용자는 식재·잔디·자갈·디딤석·화단 등 필요한 작업을 살펴보고, 준비된 정보부터 채팅형 견적 신청으로 이어갈 수 있습니다.

## 주요 기능

- 홈 랜딩 페이지와 반응형 헤더
- 공간과 작업을 시각적으로 확인하는 정원 미리보기
- 채팅형 무료 견적 신청 흐름
- 내 신청, 서비스 소개, 이용 안내, 문의, 약관·개인정보 페이지
- 모바일·PC 반응형 레이아웃
- 영상·이미지·3D 에셋을 활용한 공간 설명
- Supabase 기반 견적·문의 API 연동

## 구현한 인터랙션

- 홈에서 스크롤에 따라 정원 장면과 메시지가 전환됩니다.
- 작업 조합 미리보기에서 필요한 작업을 선택하고 바뀐 공간을 확인할 수 있습니다.
- 무료 견적 신청은 단계별 질문에 답하는 흐름으로 진행됩니다.
- 모바일 메뉴와 페이지 이동 CTA를 제공합니다.
- 견적 신청, 문의, 이메일 인증 관련 상태를 처리합니다.

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS (기존 디자인 시스템과 충돌하지 않도록 preflight 비활성화)
- shadcn/ui 구성 기반 (`components.json`, 재사용 Button, `cn` 유틸리티)
- Supabase
- Three.js / React Three Fiber
- GSAP / Lenis
- Pretendard

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

프로덕션 빌드는 다음 명령으로 확인합니다.

```bash
npm run build
npm run start
```

Supabase 기능을 사용하려면 `.env.local.example`을 참고해 환경변수를 설정해야 합니다.

Tailwind와 shadcn/ui 기반 컴포넌트는 `tailwind.config.ts`, `components.json`,
`components/ui/`, `lib/utils.ts`에 구성되어 있으며, 기존 화면의 디자인 시스템은
그대로 유지하면서 점진적으로 재사용할 수 있도록 준비되어 있습니다.

## 주요 경로

- `/` 홈
- `/service` 서비스 소개
- `/guide` 이용 안내
- `/quote` 무료 견적 신청
- `/my` 내 신청
- `/contact` 문의하기
- `/menu` 전체 메뉴
- `/terms` 이용약관
- `/privacy` 개인정보 처리방침

## 배포

- GitHub 저장소: https://github.com/tedoori/tedoori-landing
- Vercel 배포 URL: https://tedoori-landing.vercel.app

## 참고

기획·카피·디자인 기준은 프로젝트 내 관련 Markdown 문서와 `.claude/` 설정을 참고합니다. 기존 Next.js 구현과 미디어 자산을 우선 보존하며, 수정 전 현재 동작을 확인합니다.
