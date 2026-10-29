# 인스타그램 게시물 행사 모음

`/ig/{collectionId}`는 듀잇 인스타그램 게시물에 소개된 행사를 한 화면에 모아 보여 줍니다. 게시물에 '정보' 댓글을 남긴 사용자에게 Surfer가 DM으로 이 주소를 보냅니다. `collectionId`는 소문자 16진수 32자리이며, 형식이 다르면 Surfer를 조회하지 않고 404를 반환합니다.

## 데이터 흐름

1. 서버 컴포넌트가 Surfer의 공개 읽기 경로 `GET /api/v1/public/instagram-collections/{collectionId}`에서 게시물에 실린 행사 ID를 게시물 순서대로 받습니다. 실제로 게시된 게시물만 응답하며, 행사 상세나 계정 정보는 포함하지 않습니다.
2. 각 행사는 듀잇 API `GET /v2/events/{eventId}`로 다시 조회합니다. 404·403이거나 승인 대기(`PENDING`)인 행사는 표시하지 않고 "공개가 종료된 행사" 수로만 안내합니다.
3. 행사별 AI 요약은 [행사 내용 연동](event-content.md)과 같은 Surfer 공개 경로에서 가져옵니다. 요약이 없으면 해당 카드에서 요약 영역만 빠집니다.

세 조회 모두 최대 60초 동안 캐시합니다. 행사를 하나도 읽지 못했고 그 원인이 조회 오류라면 빈 목록 대신 "잠시 불러오지 못했어요" 상태를 보여 줍니다. 서버 환경 변수는 기존 `API_BASE`와 선택 사항인 `SURFER_API_BASE`만 사용합니다.

## 검색 노출 차단

DM으로만 전달하는 주소이므로 검색엔진 색인 대상이 아닙니다.

- 페이지 메타데이터: `robots: noindex, nofollow, nocache`
- 응답 헤더: `next.config.ts`에서 `/ig/:path*`에 `X-Robots-Tag: noindex, nofollow, noimageindex`
- 사이트맵·`llms.txt`에 포함하지 않습니다. `robots.txt`로 크롤링을 막으면 검색엔진이 noindex 지시를 읽지 못하므로 막지 않습니다.

## 행사 상세 연결

카드의 이미지·제목·"자세히 보기"는 기존 `/events/{eventId}` 링크입니다. 같은 화면에서 누르면 기존 행사 상세 패널(`@eventModal`)이 열리고, 새 탭이나 직접 접속은 기존 상세 페이지를 엽니다.

View Transitions를 지원하는 브라우저에서는 카드 이미지가 상세 패널 포스터로 이어지는 hero 전환을 사용합니다(`src/lib/event-hero.ts`). 카드 이미지에 `data-event-hero-source`, 패널 포스터에 `data-event-hero-target`이 있고, 전환 중에만 `<html data-event-hero>`가 설정됩니다. 패널을 닫으면 포스터가 원래 카드로 돌아갑니다. 지원하지 않는 브라우저와 동작 줄이기 설정에서는 기존 패널 애니메이션으로 그대로 열립니다. 상세가 1.6초 안에 준비되지 않으면 전환을 끝내고 패널을 이어서 표시합니다.
