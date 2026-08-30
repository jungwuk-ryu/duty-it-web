# 디자인 QA

## 비교 대상과 증거

- 홈 시각 기준: `C:\Users\vojou\.codex\generated_images\01a04720-8253-7f13-9fdc-e78579ceb829\exec-6bac1a0f-2a6f-48ae-85d2-a4d27d610842.png` (1536 × 1024)
- 홈 스크롤·모바일 기준: `C:\Users\vojou\.codex\generated_images\01a04720-8253-7f13-9fdc-e78579ceb829\exec-c90d422c-3384-48af-a368-f89b7c335d42.png` (951 × 1654)
- 행사 목록 시각 기준: `C:\Users\vojou\.codex\generated_images\01a04720-8253-7f13-9fdc-e78579ceb829\exec-9e6eeca4-c472-460f-86bb-a4d809332542.png` (1502 × 1047)
- 데스크톱 구현 캡처: `C:\Users\vojou\.codex\visualizations\2026\08\31\duty-it-qa\home-final.jpg`, `C:\Users\vojou\.codex\visualizations\2026\08\31\duty-it-qa\events-desktop.jpg` (각 1289 × 1013)
- 모바일 구현 캡처: `C:\Users\vojou\.codex\visualizations\2026\08\31\duty-it-qa\home-mobile-scroll.jpg`, `C:\Users\vojou\.codex\visualizations\2026\08\31\duty-it-qa\home-mobile-download.jpg` (각 390 × 844), `C:\Users\vojou\.codex\visualizations\2026\08\31\duty-it-qa\events-mobile.jpg` (375 × 812)
- 같은 이미지 입력으로 검토한 비교본: `C:\Users\vojou\.codex\visualizations\2026\08\31\duty-it-qa\home-comparison.jpg`, `C:\Users\vojou\.codex\visualizations\2026\08\31\duty-it-qa\events-comparison.jpg`

로컬 구현 URL은 `http://localhost:3000/`와 `http://localhost:3000/events`예요. 초기 화면과 활성 행사 상태를 기준으로 비교했어요. 데스크톱 CSS 뷰포트는 1280 × 1024, 모바일 CSS 뷰포트는 390 × 844, devicePixelRatio는 1이에요. 인앱 브라우저의 데스크톱 JPEG 캡처 출력은 1289 × 1013으로 인코딩돼서, 비교본에서는 기준 이미지를 너비 1289px로 정규화하고 상단 콘텐츠 영역을 같은 높이로 잘라 비교했어요. 모바일은 실제 CSS 크기 캡처를 사용했어요.

## Findings

- [P3] 홈 참고 시안의 검색 바와 다섯 개 메뉴를 두 개의 탐색 메뉴와 CTA로 바꿨어요.
  - 위치: `src/components/Header.tsx`, `src/app/page.tsx` 상단 히어로.
  - 증거: 홈 비교본의 상단 두 화면을 함께 확인했어요.
  - 영향: 원 시안의 정보 밀도는 낮아졌지만, 사용자가 요청한 “행사 목록”, “행사 제보”만 남기는 탐색 규칙과 실제 구현 가능한 주 경로를 따르는 의도된 차이예요.
  - 조치: 추가 수정은 필요 없어요.

- [P3] 행사 카드의 이미지·행사명·상태 배지는 실 API 응답을 그대로 보여줘요.
  - 위치: `src/components/ui/EventCard.tsx`.
  - 증거: 행사 목록 비교본에서 카드 격자, 태그, 날짜·조회 수 정보, 모집 기한 영역을 확인했어요.
  - 영향: 시안의 예시 데이터와는 달라도 실제 콘텐츠의 가독성과 카드 구조는 유지돼요.
  - 조치: 추가 수정은 필요 없어요.

## 필수 충실도 검토

- 글꼴·타이포그래피: Noto Sans KR의 굵은 제목, 촘촘한 자간, 본문 행간을 적용했어요. 390px에서 홈 제목은 두 줄을 유지하고, 행사 필터·카드의 작은 글자는 잘리지 않아요.
- 간격·레이아웃 리듬: 데스크톱은 넓은 여백의 2열 히어로와 3열 카드 격자, 모바일은 한 열 필터와 한 열 카드로 전환돼요. 영구 헤더와 필터·CTA가 가로로 넘치지 않는 점을 확인했어요.
- 색상·토큰: 종이색 `#f8f5f0`/표면색 `#fffdfa`, 먹색 `#20222a`, 듀잇 레드 `#c63c33`과 약한 코랄 광택을 토큰으로 일관되게 썼어요. 활성 탭, 선택 유형, 주요 버튼의 대비도 확인했어요.
- 이미지 품질·자산 충실도: 브랜드 아이콘은 기존 `public/app-icon.png`을 사용했고, 히어로 제품 이미지는 원본 앱 목업에서 만든 전용 고해상도 폰 자산이에요. 달력은 실제 Three.js WebGL 장면으로 렌더링하며, 아이콘은 Lucide 라이브러리를 사용해 임의 SVG나 CSS 그림으로 대체하지 않았어요.
- 카피·콘텐츠: 정적 한국어 문구는 모두 자연스러운 `~해요` 말투로 통일했어요. 행사 데이터는 현재 API 응답이라 달라질 수 있어요.
- 접근성·상태: 탐색과 필터는 실제 링크·폼·`select`·체크박스로 구현했고, 포커스 스타일·축소 모션·대체 텍스트를 넣었어요. 홈 스크롤 중 섹션과 앱 다운로드 영역, 행사 목록의 모바일 필터, 빈 결과·로딩·오류 화면도 확인했어요.

## 비교 이력

1. [P2, 해결] 초기 홈 히어로는 기존 전체 목업을 잘라 써서 넓은 흰 여백과 제품 화면 일부가 어색하게 남았어요. 원본 화면을 유지한 전용 폰 자산 `src/assets/home/images/app_phone_hero.png`으로 교체하고, 수정 후 데스크톱 히어로와 390px 모바일 상단 캡처를 다시 확인했어요.
2. [P2, 해결] 초기 행사 목록 필터의 정렬·상태 레이블이 화면에서 누락될 수 있었어요. 레이블을 레이아웃에 유지해 두 `select`가 데스크톱·모바일에서 명확히 보이도록 고쳤고, 수정 후 행사 목록 비교본과 모바일 캡처를 확인했어요.
3. [P2, 해결] 모바일 홈 제목의 마지막 단어가 불필요하게 줄바꿈됐어요. 모바일 제목 크기를 조정하고 390px 캡처에서 두 줄 계층이 유지되는 것을 확인했어요.

## 상호작용 검증

- 데스크톱과 모바일에서 홈·행사 목록 모두 가로 오버플로가 없었어요.
- 행사 목록에서 `세미나`를 선택하고 정렬을 `시작 임박순`으로 바꾼 뒤 적용했어요. URL은 `?field=START_DATE&types=SEMINAR` 상태로 바뀌고 선택값도 유지됐어요.
- 로딩, 오류, 결과 없음 UI는 각각 스타일을 맞춰 구현했어요. 브라우저에서 빈 화면이나 오류 오버레이는 보이지 않았어요.

## Implementation Checklist

- [x] 상단 탐색을 행사 목록·행사 제보로 제한했어요.
- [x] 홈 히어로·스크롤 섹션·다운로드 CTA와 Three.js 달력 장면을 구현했어요.
- [x] 행사 검색, 정렬, 상태, 유형 필터와 실제 카드 정보를 구현했어요.
- [x] 390px 모바일 레이아웃과 스크롤 상태를 확인했어요.
- [x] 참고 이미지와 렌더링 캡처를 결합해 재검토했어요.

## Follow-up Polish

- 없음. 실제 행사 데이터의 이미지 비율과 제목 길이는 API 데이터가 늘어나면 별도로 모니터링해요.

final result: passed
