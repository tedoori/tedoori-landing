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

`npm run build`를 실행했으나 코드 컴파일 오류가 아니라 `.next/trace`와 `.next/trace-build` 파일 접근 권한 오류로 중단되었습니다.

오류 요약:

```text
EPERM: operation not permitted, open 'C:\Users\Admin\my-site\.next\trace'
An IO error occurred while attempting to create and acquire the lockfile
```

기존 Next.js 프로세스를 임의로 종료하거나 `.next/`를 삭제하지 않았습니다.

## Codex가 실제로 수정한 내용

- `C:\Users\Admin\my-site`의 기존 소스 코드는 수정하지 않았습니다.
- 잘못된 ChatGPT 프로젝트 미러 경로에 중단된 패치가 일부 생성되었지만, 실제 Claude Code 프로젝트인 `my-site`에는 적용하지 않았습니다.
- 실제 프로젝트에서는 읽기 전용 점검과 빌드 확인만 수행했습니다.

## 제출을 위해 남은 작업

### 필수

1. 기존 `.next/` 점유 프로세스 상태를 확인한 뒤 빌드 재검증
2. 서비스 소개, 견적 신청, CTA, 모바일·PC 흐름을 실제 브라우저에서 점검
3. 제출용 `README.md` 작성
4. Git 저장소 초기화 및 GitHub 저장소 연결
5. Vercel 배포
6. 배포 URL에서 핵심 페이지와 인터랙션 재검증

## 현재 제출 결과

- GitHub: https://github.com/tedoori/tedoori-landing
- Vercel: https://tedoori-landing.vercel.app
- Vercel 배포 빌드 성공 확인
- 배포 홈 화면과 `/quote` 견적 흐름 확인
- 지역 선택 후 다음 단계로 넘어가는 동작 확인

### 확인 필요

- 기존 Netlify 배포를 유지할지, Vercel을 최종 제출 대상으로 사용할지 결정
- GitHub 저장소 공개 여부와 저장소 URL
- 실제 서비스용 약관·개인정보 처리방침의 최종 승인 여부
- Supabase 환경변수와 배포 환경변수 설정

## 작업 원칙

- 기존 구현을 새로 만들거나 대체하지 않습니다.
- 수정 전 관련 파일과 현재 동작을 먼저 확인합니다.
- `sources/`의 기획 자료는 읽기 전용으로 취급합니다.
- `.next/`, `.netlify/`, 미디어 자산은 임의로 삭제하지 않습니다.
- 배포 전에는 모바일과 데스크톱의 핵심 CTA 흐름을 모두 확인합니다.

