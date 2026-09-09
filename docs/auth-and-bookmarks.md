# 로그인 유지와 북마크

## 운영 설정

- `API_BASE`: 기존 듀잇 API 주소(`/api`까지 포함).
- `AUTH_SESSION_SECRET`: 32바이트 난수의 64자리 hex 문자열. 모든 인스턴스·재배포에서 동일한 값을 유지하며 서버 비밀 환경 변수로 설정합니다. `NEXT_PUBLIC_` 접두사를 붙이지 않습니다. 변경하면 기존 세션이 무효화됩니다.
- `AUTH_ORIGIN`: 선택 사항. 리버스 프록시가 요청 URL의 공개 origin을 보존하지 않는 환경에서는 `https://www.dutyit.net`처럼 실제 웹 origin을 명시합니다(후행 `/` 없음). 기본값은 요청 URL의 origin입니다. Preview는 해당 Preview의 origin을 사용합니다.
- 운영은 HTTPS가 필수입니다. 로컬 개발은 `npm run dev`를 사용합니다.

비밀 값 생성: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. 출력은 환경 변수 관리 도구에 보관하고 저장소나 클라이언트 코드에 넣지 않습니다. `.env.local`은 Git에 포함하지 않습니다.

## 로그인 정책과 보안

1. Google/Apple 팝업은 Firebase의 메모리 저장 모드로 실행합니다. Firebase 갱신 토큰을 같은 origin의 `/api/auth/social`에 `text/plain` 원문 본문으로 한 번 전달한 다음 브라우저 Firebase 상태를 지웁니다. 인증 토큰을 localStorage나 IndexedDB에 장기 보관하지 않습니다.
2. 웹 서버는 Firebase REST API에서 갱신 토큰을 교환하고, 그 결과의 ID 토큰을 기존 듀잇 소셜 인증 API에 전달합니다. Firebase UID와 듀잇 providerId를 비교해 계정을 연결합니다. 서로 다른 계정의 ID/갱신 토큰을 조합해 세션을 만들지 않습니다.
3. 듀잇 액세스 토큰, Firebase 갱신 토큰, 사용자 식별 정보는 AES-256-GCM으로 암호화·인증한 쿠키에만 저장합니다. 운영 쿠키는 `__Host-duit_session`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`이며 Domain을 지정하지 않습니다. 브라우저 응답 본문에는 사용자 ID와 닉네임만 반환합니다.
4. 쿠키는 365일간 유지하고 자동 갱신할 때마다 기한을 연장합니다. 액세스 인증은 최대 55분마다 또는 API의 401 응답 시 갱신합니다. 이 시간은 사용자가 다시 로그인해야 하는 시간이 아닙니다. 며칠 뒤 접속하거나 브라우저를 다시 열어도 유효한 갱신 토큰으로 복원합니다.
5. 네트워크 오류, API 오류, Firebase 설정 오류는 쿠키 삭제 사유가 아닙니다. 현재 확인된 사용자 상태를 유지하고 재시도를 제공합니다. 삭제·정지·폐기된 Firebase 자격 증명, 변조된 쿠키, 명시적 로그아웃은 재로그인이 필요한 사유입니다. 인증 기관의 폐기 반영에는 최대 55분의 확인 간격이 있습니다.
6. 쿠키를 쓰거나 북마크를 변경하는 모든 POST는 정확한 Origin을 확인하고 cross-site 요청을 거부합니다. 개인 API는 `private, no-store`와 `Vary: Cookie`를 사용합니다. 공개 목록의 공유 캐시에 개인 인증 정보는 전달하지 않습니다.
7. 같은 탭의 갱신 요청을 합치고 Web Locks 지원 브라우저에서는 탭 사이의 로그인·갱신·로그아웃 쿠키 쓰기도 순서대로 처리합니다. localStorage에는 토큰 없이 변경 신호만 기록합니다. 계정 변경 시 이전 계정의 북마크 상태를 버립니다.

명시적 로그아웃은 해당 브라우저의 쿠키를 지웁니다. 모든 기기의 토큰 폐기는 Firebase 관리 기능으로 처리해야 합니다. 암호화는 쿠키 탈취 후 재사용 자체를 막는 장치가 아니므로 HTTPS, XSS 방지, 비밀 환경 변수 관리가 필요합니다. 브라우저가 사이트 데이터를 삭제하거나 비공개 모드를 종료하는 경우 로그인 복원이 불가능할 수 있습니다.

기존 버전의 `duit_access_token`만 가진 사용자는 새 로그인 방식으로 한 번 로그인해야 합니다. 로그인·로그아웃 시 이전 쿠키도 삭제합니다.

근거: [Firebase 갱신 토큰 API](https://firebase.google.com/docs/reference/rest/auth#section-refresh-token), [Firebase 세션과 토큰 폐기](https://firebase.google.com/docs/auth/admin/manage-sessions).

## 북마크 연동

- 첨부 컴포넌트는 기존 shadcn 경로인 `src/components/ui/bookmark-icon-button.tsx`에 통합했습니다. 이 프로젝트의 import alias는 `@/src/components/ui`이며, 글로벌 스타일은 `src/app/globals.css`입니다. TypeScript·Tailwind·shadcn 및 Button 의존성은 이미 설치되어 있습니다.
- 추가 실행 의존성은 첨부 애니메이션용 `framer-motion`과 Next.js 밖에서도 서버 코드 경계를 확인하는 `server-only`입니다. `tsx`는 자동 테스트 실행용 개발 의존성입니다.
- 임의의 랜덤 값을 렌더마다 생성하는 예제를 고정 파티클 값으로 조정했습니다. 접근 가능한 버튼 이름, `aria-pressed`, 저장 중 중복 입력 차단과 reduced motion 지원을 추가했습니다. 별도 이미지 자산이 필요하지 않습니다.
- 행사 카드, 채용 카드와 채용 상세에 버튼을 제공합니다. 버튼은 카드 링크와 별도 요소이므로 저장 중 상세 페이지가 열리지 않습니다. 비로그인 사용자는 돌아올 주소를 포함해 로그인 페이지로 이동합니다.
- 저장 상태와 결과는 기존 `/v1/bookmarks/{eventId}`, `/v1/job-bookmarks/{jobPostingId}` API를 기준으로 합니다. 중복 카드의 조회는 합치며, 실패한 토글을 자동 재전송하지 않습니다. 결과가 불확실하면 다음 클릭에서 서버 상태만 재확인합니다.
- `/bookmarks`와 `/bookmarks?type=jobs`에서 분류별 목록, 더 보기, 빈 목록, 오류와 재시도를 제공합니다. 행사 목록은 종료된 행사도 포함하며 공개되지 않은 항목은 안내로 대체합니다.
- 기존 서버의 채용 조회는 `bookmarked=true`여도 공개 중인 간호 공고만 반환합니다. 공개 종료된 공고는 목록에서 제외된다는 안내를 표시합니다. 이 서버 정책은 이번 웹 변경에 포함하지 않습니다.

## 검증

- `npm test`: 암호화·변조·장기 유지, 토큰 갱신/폐기, 계정 연결, 쿠키 속성, CSRF 및 기존 조회수 제한 테스트.
- `npm run lint`, `npm run build`.
- 의존성 점검에서 발견한 기존 경고도 수정했습니다. Next.js와 관련 패키지를 16.3.4로 올려 수정된 sharp 0.35.4를 사용하고, PostCSS 8.5.28 및 호환되는 하위 보안 패치를 lockfile에 반영했습니다. `npm audit`와 `npm audit --omit=dev` 모두 알려진 취약점 0건을 확인합니다. 참고: [Next.js 보안 공지](https://github.com/vercel/next.js/security/advisories/GHSA-6gpp-xcg3-4w24), [sharp 보안 공지](https://github.com/lovell/sharp/security/advisories/GHSA-f88m-g3jw-g9cj).
- 브라우저에서는 실제 비로그인 API 접근/CSRF 차단과 테스트 응답을 이용한 로그인 복원, 자동 갱신, 북마크 저장·해제, 오류 재확인, 탭 간 로그아웃과 모바일 메뉴를 확인합니다. 실제 Google/Apple 인증부터 운영 서버 저장까지의 최종 확인은 운영 환경 변수 설정 후 테스트 계정으로 수행해야 합니다.
