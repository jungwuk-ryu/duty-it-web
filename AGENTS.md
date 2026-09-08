# AGENTS.md

## 범위

- 이 문서는 저장소 전체에 적용되는 Codex 작업 지침입니다.
- 하위 디렉터리에 더 가까운 `AGENTS.md` 또는 `AGENTS.override.md`가 있으면 해당 지침을 우선합니다.
- 작업 중 새 지침 파일을 발견하면 현재 파일과 충돌하지 않는 범위에서 함께 따릅니다.

## 프로젝트 개요

- 이 저장소는 듀잇 웹 사이트와 행사 목록을 제공하는 Next.js App Router 프로젝트입니다.
- 패키지 매니저는 `npm`입니다. lockfile은 `package-lock.json`을 기준으로 유지합니다.
- 주요 기술 스택은 Next.js, React, TypeScript, Tailwind CSS입니다.

## 기본 작업 방식

- 작업을 시작하기 전에 요청과 관련된 Codex 스킬이 있는지 확인하고, 명시적으로 호출되었거나 설명이 작업에 맞는 스킬은 사용합니다.
- 스킬을 사용할 때는 해당 `SKILL.md`를 끝까지 읽은 뒤 지침에 따라 작업합니다.
- 기존 코드 스타일, 파일 구조, 명명 규칙을 먼저 확인하고 그 흐름에 맞춰 최소 범위로 수정합니다.
- 사용자의 변경 사항을 되돌리지 않습니다. 작업 중 알 수 없는 변경이 보이면 충돌 여부만 판단하고, 관련 없으면 그대로 둡니다.
- 새 의존성은 꼭 필요한 경우에만 추가하고, 추가 이유와 영향 범위를 설명합니다.

## 개발 명령어

- 의존성 설치: `npm install`
- 개발 서버: `npm run dev`
- 프로덕션 빌드: `npm run build`
- 린트: `npm run lint`

## 환경 변수

- `API_BASE`: 행사 목록, 행사 상세, 조회수 증가 API 호출에 필요합니다.
- `SUBMIT_FORM_URL`: `/submit-event` 리디렉션 대상에 필요합니다.
- `GA_ID`: Google Analytics 측정 ID입니다. 없으면 빈 문자열로 전달되는 선택 값입니다.
- 환경 변수 사용처를 바꿀 때는 빌드 시점과 서버 런타임 시점 중 어디에서 평가되는지 확인합니다.

## 검증 기준

- TypeScript, React 컴포넌트, Next.js 라우트, 설정 파일을 수정한 뒤에는 최소한 `npm run lint`를 실행합니다.
- 라우팅, 렌더링, 이미지, 메타데이터, 환경 변수 동작을 건드린 경우 `npm run build`까지 실행합니다.
- 문서만 수정한 경우에는 명령 실행이 필요하지 않지만, 맞춤법과 링크 경로를 직접 확인합니다.
- 검증 명령을 실행하지 못했거나 생략했다면 최종 응답에 이유를 명확히 적습니다.

## 커밋 규칙

- 각 작업은 conventional commit 형식의 atomic commit으로 마무리합니다.
- 한 커밋에는 하나의 논리적 변경만 담습니다. 서로 독립적인 수정은 여러 커밋으로 나눕니다.
- 커밋 메시지는 `type(scope): subject` 형식을 사용합니다.
- 대표 타입은 `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`, `build`, `ci`입니다.
- 예: `docs: add agent workflow guidance`, `fix(events): handle empty event list`
- 커밋 전에는 `git status --short`와 `git diff`로 변경 범위를 검토합니다.
- 스테이징은 명시적 파일 경로로 수행하고, 현재 작업과 무관한 파일이나 기존 사용자 변경은 커밋하지 않습니다.
- 워킹트리가 이미 더러워져 있고 변경 소유권이 불명확하면 커밋 전에 사용자에게 확인합니다.

## 구현 지침

- `src/app` 아래의 라우트와 레이아웃은 Next.js App Router 규칙을 따릅니다.
- 재사용 가능한 UI는 `src/components` 아래에 두고, 범용 UI 조각은 `src/components/ui` 패턴을 따릅니다.
- 새 단일 선택형 드롭다운(필터/폼)은 채용 공고 필터를 기준으로 만든 `src/components/ui/select-dropdown.tsx`의 `SelectDropdown`을 우선 재사용하며, 같은 Radix 구조와 스타일을 화면별로 복제하지 않습니다.
- 계정 액션 메뉴, 복수 선택, 다단 필터처럼 상호작용 방식이 다른 드롭다운은 `src/components/ui/dropdown-menu.tsx` 프리미티브를 조합하되 채용 공고 필터의 시각 스타일을 기준으로 맞춥니다.
- API 호출과 데이터 스키마는 기존 `src/lib/api` 및 `src/lib/schemas` 구조를 우선 사용합니다.
- TypeScript는 `strict` 설정을 전제로 작성하며, 불필요한 `any`와 non-null assertion을 피합니다.
- 환경 변수에 의존하는 코드는 누락 가능성과 런타임 위치를 고려해 방어적으로 작성합니다.
- 사용자에게 보이는 한국어 문구는 자연스럽고 간결하게 유지합니다.

## 최종 응답

- 완료한 변경, 실행한 검증, 남은 위험이나 생략한 검증을 짧게 보고합니다.
- 커밋을 만들었다면 커밋 해시와 메시지를 함께 알립니다.
- 서브 에이전트 리뷰를 받았다면 주요 결과와 반영 여부를 요약합니다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
