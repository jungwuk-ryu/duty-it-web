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
| `DUIT_EVENT_CONTENT_API_TOKEN` | 선택. Surfer가 생성한 행사 내용을 상세 화면에 표시할 때 사용하는 서버 간 토큰입니다. |
| `SURFER_API_BASE` | 선택. Surfer 주소를 기본값 `https://surfer.dutyit.net`에서 변경할 때 사용합니다. |
| `GA_ID` | 선택. Google Analytics 측정 ID입니다. |

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
- [SEO 운영 지침](docs/seo.md): canonical, 사이트맵, 구조화 데이터, 검색 점검
- [SEO 점검 기록](docs/seo-audit-2026-09-29.md): 운영 기준선과 로컬 검증 결과

배포 환경에서도 서버 환경 변수를 설정한 뒤 `npm run build`로 확인하세요. 실제 검색 색인과 노출 성과는 배포 후 검색 도구에서 별도로 확인해야 합니다.
