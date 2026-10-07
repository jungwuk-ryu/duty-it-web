# 듀잇 웹

[서비스 바로가기](https://www.dutyit.net/) · [서비스 상태](https://status.dutyit.net/) · [듀잇 앱 저장소](https://github.com/jungwuk-ryu/duty-it)

듀잇 웹은 간호사와 간호대학생이 대외활동·행사와 채용 공고를 한곳에서 찾는 서비스입니다. 봉사·서포터즈·공모전부터 학술대회·교육까지 탐색하고, 관심 있는 행사와 공고를 북마크할 수 있습니다. 신청·지원 조건은 연결된 주최자 또는 채용기관의 원문에서 최종 확인해 주세요.

![듀잇 웹 홈 화면](docs/screenshots/home-overview-2026-09-29.png)

## 주요 화면

| 경로 | 제공 내용 |
| --- | --- |
| `/` | 최근 대외활동·행사와 채용 공고, 앱 기능 안내 |
| `/events` | 행사 검색·종류별 탐색, 봉사·서포터즈·공모전 안내 |
| `/events/[eventId]` | 일정·주최자·원문 링크, 북마크와 캘린더 저장 |
| `/jobs` | 채용 공고 검색, 지역·고용 형태·마감 조건 필터 |
| `/jobs/[jobPostingId]` | 근무·지원 정보와 고용24 원문 링크 |
| `/bookmarks` | 로그인한 계정의 행사·채용 북마크 |
| `/about` | 서비스 소개, 정보 출처와 이용 문답 |
| `/submit-event` | 행사 제보 |

Google·Apple 로그인은 Firebase 인증과 듀잇 API를 사용합니다. 채용 정보는 고용24에서 제공된 내용을 안내하며, 듀잇 웹에서 직접 지원을 완료하지는 않습니다.

웹 분석은 `duty-it` Firebase 프로젝트에 등록된 웹 앱과 측정 ID `G-1XQ0L9EYBE`를 사용합니다. 설정은 `src/lib/firebase/config.ts`에서 관리하며, Firebase Analytics SDK를 화면의 hydration 이후에 불러옵니다. 브라우저에서 Analytics를 지원하지 않거나 초기화가 실패해도 화면 이용은 계속할 수 있습니다.

GA4 웹 스트림의 향상된 측정과 **브라우저 방문 기록 이벤트에 따른 페이지 변경**을 활성화했습니다. Next.js의 페이지 이동을 계속 집계하려면 이 설정을 유지하세요. 기존 `GA_ID` 환경 변수는 사용하지 않으므로 배포 환경에서 제거할 수 있습니다. 기존 듀잇-웹 속성은 과거 데이터 조회용으로 보관합니다.

### 행사 이미지 전송

홈·행사 목록·북마크·상세 포스터에서 사용하는 `EventThumbnail`은 허용된 `https://api.dutyit.net/uploads/` 이미지를 API 서버에서 직접 불러옵니다. `next/image`의 `unoptimized`를 적용해 행사 이미지 요청이 Vercel Image Optimization 변환 한도를 소비하지 않도록 합니다. 로컬 UI 이미지의 최적화, 행사 이미지의 지연 로딩과 실패 시 대체 이미지는 유지합니다.

원본 파일을 전송하므로 API 이미지 서버의 전송량과 방문자가 받는 데이터는 늘 수 있습니다. 파일 크기를 줄이려면 업로드 서버에서 작은 썸네일을 미리 생성하고 별도 URL로 제공하세요. 이 변경은 배포 후 적용되며 이미 소비한 Vercel 사용량을 초기화하지 않습니다.

## 로컬 실행

Node.js **20.9 이상**과 npm, 접근 가능한 듀잇 API가 필요합니다.

```sh
git clone https://github.com/jungwuk-ryu/duty-it-web.git
cd duty-it-web
npm ci
```

프로젝트 루트에 `.env.local`을 만들고 다음 값을 설정합니다. 예시의 자리표시자는 실제 값으로 바꿔야 합니다.

```dotenv
API_BASE=https://<듀잇-API-호스트>/api
AUTH_SESSION_SECRET=<64자리-hex-난수>
```

`AUTH_SESSION_SECRET`은 `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`로 생성할 수 있습니다. 이 값은 서버 비밀로 보관하고 `NEXT_PUBLIC_` 접두사를 붙이지 마세요. `.env.local`은 Git에 포함하지 않습니다.

```sh
npm run dev
```

이후 [http://localhost:3000](http://localhost:3000)에서 확인합니다. 배포용 빌드를 확인하려면 `npm run build` 후 `npm run start`를 실행합니다.

### 환경 변수

| 변수 | 용도 |
| --- | --- |
| `API_BASE` | 필수. 듀잇 API 주소이며 끝에 `/api`를 포함합니다. |
| `AUTH_SESSION_SECRET` | 로그인 사용 시 필수. 세션 쿠키 암호화용 64자리 hex 값입니다. 재배포·서버 인스턴스 간 같은 값을 유지합니다. |
| `AUTH_ORIGIN` | 선택. 프록시가 공개 origin을 보존하지 않을 때 실제 웹 origin을 지정합니다. |
| `SURFER_API_BASE` | 선택. Surfer 주소를 기본값 `https://surfer.dutyit.net`에서 변경할 때 사용합니다. |

Google Indexing API를 실제로 호출하는 운영 명령에는 별도로 `GOOGLE_INDEXING_ACCESS_TOKEN`이 필요합니다. 상세 설정은 아래 운영 문서를 참고하세요.

## 개발·검증 명령

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | Turbopack 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드와 TypeScript 검사 |
| `npm run start` | 빌드된 앱 실행 |
| `npm run lint` | ESLint 검사 |
| `npm test` | 인증·북마크·행사·채용·SEO 회귀 테스트 |
| `npm run seo:audit -- --base-url http://localhost:3000` | 실행 중인 로컬 사이트의 HTTP·메타데이터·사이트맵 표본 점검 |
| `npm run seo:notify-jobs -- --url https://www.dutyit.net/jobs/6522` | 채용 URL의 Google Indexing API 전송 계획 확인. 실제 전송은 별도 `--publish`가 필요합니다. |

`seo:audit`는 실행 중인 사이트를 검사하므로 로컬에서 사용할 때는 먼저 빌드된 앱을 시작하세요. 검사 범위와 운영 전송 조건은 [SEO 운영 지침](docs/seo.md)에 있습니다.

## 코드와 운영 문서

- `src/app`: Next.js App Router 페이지와 API 경로
- `src/components`: 화면·카드·북마크 UI
- `src/lib`: 듀잇 API 조회, 데이터 스키마, 인증·북마크 상태, SEO 로직
- `scripts`: SEO 점검과 채용 색인 알림 명령
- [로그인·북마크 운영 지침](docs/auth-and-bookmarks.md): 세션 비밀, 인증 갱신, 북마크 동작
- [행사 내용 연동 지침](docs/event-content.md): Surfer 토큰과 선택적 행사 내용
- [새 행사 알림 운영 지침](docs/notifications.md): 행사 구독과 브라우저 푸시
- [SEO 운영 지침](docs/seo.md): canonical, 사이트맵, 구조화 데이터, 검색 점검
- [SEO 점검 기록](docs/seo-audit-2026-09-29.md): 운영 기준선과 로컬 검증 결과

배포 환경에서도 서버 환경 변수를 설정한 뒤 `npm run build`로 확인하세요. 실제 검색 색인과 노출 성과는 배포 후 검색 도구에서 별도로 확인해야 합니다.
