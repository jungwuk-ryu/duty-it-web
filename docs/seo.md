# 듀잇 웹 검색 노출 정책과 운영

## 사이트맵

`/sitemap.xml`은 색인 파일이며 `/sitemap-static-0.xml`, `/sitemap-events-0.xml`, `/sitemap-jobs-0.xml` 등을 가리킨다. 각 파일은 URL 50,000개 또는 압축 전 UTF-8 50MB에 도달하기 전에 분할한다. 공개 파일을 루트 경로에 두기 위해 Next.js rewrite를 사용한다. JSX가 없는 XML 응답은 `route.ts`에서 생성한다.

- 정적 URL: 홈, 행사 목록, 채용 목록.
- 행사: 공개 `ACTIVE`와 `FINISHED`를 각각 마지막 커서까지 조회한다. 종료 행사는 기록으로 보존하고, 승인 대기 행사는 제외한다. 실제 포스터가 있으면 이미지 URL도 제공한다.
- 채용: 활성 상태이며 한국 시간 기준 접수 마감이 지나지 않은 상세 URL만 포함한다. 목록과 구조화 데이터에도 같은 마감 판정을 사용한다.
- 중복 ID·URL은 제거한다. 커서 누락·반복·진행 중단, 응답 형식 오류, 요청 실패는 전체 생성 실패다. 임의의 100페이지 제한은 없다.
- `lastmod`는 API의 실제 수정·생성 시각을 사용한다. 채용기관 정보 수정도 반영한다. 날짜가 없거나 유효하지 않거나 미래이면 해당 값을 사용하지 않는다. 요청 시각을 수정일로 대체하지 않는다. 현재 행사 API에는 수정일이 없어 행사 `lastmod`는 생략한다.

완성된 XML 묶음만 프로세스 메모리에 게시한다. 정상본의 유효기간은 5분이며 동시 생성은 하나로 합친다. 갱신 실패 시 생성 후 1시간 이내의 이전 정상본만 제공하고 `no-store`로 CDN에 다시 저장하지 않는다. 정상본이 없거나 너무 오래되었으면 `503`, `Retry-After: 60`을 반환한다. 실패 후 재시도 간격은 30초다. API 전체 수집은 최대 120초이며 시간 초과 시 일부 URL을 성공 응답으로 내보내지 않는다.

메모리 캐시는 인스턴스 간 공유되거나 재시작 후 유지되는 영구 저장소가 아니다. 새 인스턴스에서 API가 실패하면 503을 반환한다. 데이터가 커져 수집 시간이 제한에 가까워지면 백엔드의 전용 SEO 피드와 공유 객체 저장소로 생성 작업을 옮긴다. 운영 로그의 `Sitemap generation failed`와 `Serving last complete sitemap` 및 사이트맵별 URL 수 추이를 확인한다.

Google은 `priority`와 `changefreq`를 사용하지 않는다. 정확한 변경일과 정규 URL, 파일 한도를 우선한다. [Google 사이트맵 가이드](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

## 목록과 상세 URL

| 페이지 | canonical / 색인 정책 |
| --- | --- |
| `/events`, `/jobs` | 각 목록 자체 URL, 색인 허용 |
| 기본 정렬의 `?cursor=...` | 커서를 유지한 자체 URL, 색인 허용 |
| 검색어·주최·종류·지역·고용 형태·마감·종료 행사·다른 정렬 | 유효한 조건을 정규화한 자체 URL, `noindex, follow` |
| `view=list`, 기본값, 알 수 없는 파라미터 | 대표 URL에서 표시 옵션·불필요한 파라미터 제거 |
| 잘못된 커서 | 첫 페이지의 정상 URL로 임시 리다이렉트 |
| 없는 행사·채용, 승인 대기 행사 | 404 |
| 마감 채용 상세 | 정보는 200으로 보존, `noindex, follow`, 마감 표시, 지원 버튼과 JobPosting 제거 |
| 로그인·행사 제보·개인 북마크 | 색인 제외, 사이트맵 제외 |

서로 다른 다음 목록을 첫 페이지로 canonical 처리하지 않는다. 행사 페이지 이동은 실제 `href`를 가진 링크로 제공한다. 일반 클릭의 화면 전환, 새 탭 열기, 자바스크립트 없이 다음 페이지 열기를 지원한다. History API로 목록을 바꿀 때 canonical·robots·OG URL도 갱신한다. [Google 페이지네이션 가이드](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)

행사 경로의 자동 `loading.tsx` 경계를 제거해 존재 여부와 커서 검증 전에 200 헤더가 전송되지 않도록 한다. 유효한 상세페이지의 부가 콘텐츠는 계속 Suspense로 표시하고, 클라이언트에서 행사 필터를 바꾸는 동안에는 기존 로딩 화면을 사용한다. [Next.js not-found 상태 코드](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)

`robots.txt`는 공개 페이지와 사이트맵 수집을 허용하며 내부 `/api/`만 제외한다. `noindex` 페이지는 크롤러가 메타 태그를 읽을 수 있도록 robots.txt로 차단하지 않는다. [네이버 robots.txt 안내](https://searchadvisor.naver.com/guide/seo-basic-robots)

## 구조화 데이터와 메타데이터

행사·채용 상세에는 BreadcrumbList를, 홈에는 WebSite를 제공한다. 각 페이지의 제목·설명·canonical·OG·Twitter를 일치시킨다. 루트 canonical이 다른 페이지에 홈 주소를 상속하지 않도록 홈에서만 홈 canonical을 지정한다. [Google 사이트 이름](https://developers.google.com/search/docs/appearance/site-names)

JobPosting은 원문 게시일(`postedAt`), 실제 채용기관, 직종, 직무 본문, 근무예정지와 지원 링크가 확인된 공고에서만 출력한다. `createdAt`은 듀잇 수집 시각이므로 원문 게시일로 쓰지 않는다. `expiresAt`은 정렬용 자정 값이므로 날짜형 마감은 한국 시간 23:59:59까지로 해석하고, 채용 시 마감·상시 공고의 마감일을 만들지 않는다. 본문에 표시하는 자격·근무시간·경력·학력·급여·복리후생·지원 정보를 HTML 설명에 포함한다. 직종 코드 접미사를 제목에서 제거하며, 본사 주소를 근무지로 대체하거나 연간 환산 급여를 실제 제시 급여로 표시하지 않는다. 외부 고용24로 이동하므로 `directApply`는 false다. [Google JobPosting 가이드](https://developers.google.com/search/docs/appearance/structured-data/job-posting)

2026-09-11 운영 OpenAPI에는 로컬 사본에 없던 `postedAt`, `expiresAt`이 있다. 누락되는 이전 응답도 처리하되 원문 게시일이 없으면 JobPosting을 생성하지 않는다. [운영 OpenAPI](https://api.dutyit.net/v3/api-docs/DuIt%20OPEN%20API%20v1)

행사 API에는 현재 **장소·주소, 취소·연기 상태, 생성·수정일이 없다**. 행사 제목·포스터·AI 요약에서 이 값을 추정하지 않는다. 기존 Event의 일정·주최·이미지·원문 연결은 유지하되 명시적으로 알 수 없는 상태를 고정하지 않는다. Google 행사 검색의 필수 장소 정보와 취소·연기 상태를 완성하려면 백엔드의 명시적 필드와 화면 표시가 먼저 필요하다. API에 수정일이 추가되면 선택 필드로 읽어 사이트맵에 반영할 수 있다. [Google Event 가이드](https://developers.google.com/search/docs/appearance/structured-data/event)

## Google Indexing API 실행

`npm run seo:notify-jobs`는 배포된 **채용 상세 URL만** 알리는 운영 명령이다. 기본 실행은 전송 계획만 출력하며 네트워크 호출이나 자격증명이 필요 없다.

```sh
npm run seo:notify-jobs -- --url https://www.dutyit.net/jobs/6522
```

실제 전송 전 Google Cloud에서 Indexing API 활성화, 서비스 계정 생성, Search Console의 사이트 소유권 등록과 서비스 계정 권한, 사용 승인·할당량을 준비한다. `https://www.googleapis.com/auth/indexing` 범위를 가진 유효한 액세스 토큰을 로컬 실행 환경의 `GOOGLE_INDEXING_ACCESS_TOKEN`으로 전달한다. 토큰은 클라이언트 번들 또는 저장소에 넣지 않는다. [Google 준비 절차](https://developers.google.com/search/apis/indexing-api/v3/quickstart), [Google OAuth 서비스 계정 인증](https://developers.google.com/identity/protocols/oauth2/service-account)

```sh
# 활성 공고 추가·수정 또는 200으로 보존한 마감 공고의 noindex 갱신
npm run seo:notify-jobs -- --url https://www.dutyit.net/jobs/6522 --publish

# 실제 삭제되어 404/410을 반환하는 공고
npm run seo:notify-jobs -- --type URL_DELETED --url https://www.dutyit.net/jobs/6522 --publish
```

`--url`은 여러 번 지정할 수 있다. 전송 전에 모든 대상의 운영 응답을 확인한다. 갱신은 200·자체 canonical·JobPosting 또는 noindex가 있어야 하며, 삭제는 404/410이어야 한다. 다른 도메인·행사·목록·쿼리 URL을 거절한다. 성공한 URL은 한 줄씩 기록하고 실패 시 중단하므로 부분 성공 목록을 제외한 나머지만 다시 실행한다. API 수락은 색인 완료를 뜻하지 않는다. 수집기의 실제 추가·변경·마감 처리와 연동할 때에도 변경된 채용 URL만 할당량 범위에서 알린다. [Google Indexing API 사용법](https://developers.google.com/search/apis/indexing-api/v3/using-api)

## 배포 후 확인

1. `/robots.txt`, `/sitemap.xml`과 모든 하위 파일이 200·유효한 XML인지 확인하고 URL 수가 예상과 맞는지 기록한다.
2. Google Search Console에 `https://www.dutyit.net/sitemap.xml`을 제출한다. 대표 행사, 기본 목록의 다음 페이지, 채용 상세의 선택 canonical과 읽힌 본문을 URL 검사로 확인한다.
3. 채용 상세를 Rich Results Test로 확인하고 마감 이후 JobPosting이 사라지는지 점검한다.
4. 네이버 서치어드바이저에서 robots 수집, 사이트맵 제출·처리 결과를 확인한다. [네이버 사이트맵 제출 안내](https://searchadvisor.naver.com/guide/request-feed)
5. 색인 보고서·구조화 데이터 오류·사이트맵 수집 오류·실제 노출 및 클릭을 관찰한다. 코드 변경만으로 검색 순위나 리치 결과 노출을 보장할 수는 없다.

계정 기반 사이트맵 제출, 실제 Indexing API 전송, 행사 API 확장은 이 웹 PR 배포와 별도로 수행해야 한다.
