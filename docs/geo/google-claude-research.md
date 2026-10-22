# Google Gemini·Anthropic Claude GEO 조사

확인일: **2026-10-22 KST**. Google·Anthropic 공식 문서와 원 논문을 웹 검색 후 직접 열어 확인했다. 아래에서 **사실**은 출처의 명시적 설명, **권고**는 듀잇 적용 제안, **불확실성**은 이번 조사로 입증되지 않은 사항이다. 실제 듀잇 코드 진단은 별도 감사 결과와 함께 판단한다.

## 조사 워크플로우

1. Google Search AI 기능, Gemini 앱/API, Claude 검색/API를 서로 다른 노출 경로로 구분한다.
2. 운영사의 크롤러·검색·grounding·Search Console 문서를 우선 검색하고 원문과 갱신일을 확인한다.
3. 학습 허용과 검색 노출 허용의 관계, HTML 접근성, 구조화 데이터, 특수 AI 파일의 근거를 대조한다.
4. 공식 지원 조건과 노출 개선 가설을 분리하고, 구현 항목별 검증 기준을 만든다.
5. 배포 전 기술 검증과 배포 후 실제 검색·인용 측정을 분리한다.

## 사실: Google Search와 Gemini의 구분

- **Google Search의 AI Overviews/AI Mode**는 기본 SEO가 적용된다. 지원 링크가 되려면 페이지가 색인되고 검색 스니펫 노출 자격을 갖춰야 한다. robots/CDN에서 접근 허용, 내부 링크, 텍스트 본문, 화면과 일치하는 구조화 데이터가 중요하다. 조건 충족만으로 색인·인용을 보장하지 않는다. [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) (갱신 2025-12-10)
- **Google의 최신 최적화 가이드**는 GEO를 별도의 비밀 순위 기법으로 설명하지 않는다. Google Search는 `llms.txt`를 특별히 활용하지 않으며 Search 노출·순위에 도움이나 해를 주지 않는다고 명시한다. AI 전용 schema, 작은 청크로 잘라 쓰기, 키워드 변형 반복도 필수가 아니다. 독자에게 유용한 고유한 경험과 근거를 우선한다. [Optimizing your website for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) (갱신 2026-07-10)
- **Gemini API의 Google Search grounding**은 `google_search` 도구로 실시간 검색 결과를 받아 답변과 출처를 생성한다. 검색 실행 여부는 프롬프트에 따라 결정될 수 있다. 모델 단독 지식 답변과 검색 기반 답변은 별도 평가해야 한다. [Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search) (갱신 2026-10-13)
- **Googlebot**은 Search와 그 기능의 크롤링을 제어한다. **Google-Extended**는 별도 HTTP User-Agent가 없는 robots 제품 토큰이다. Gemini 앱 및 Vertex AI 관련 미래 모델 학습과 명시된 grounding 사용을 함께 제어하며 Google Search 포함 여부나 순위 신호에는 영향을 주지 않는다. 따라서 Google-Extended를 단순한 학습 전용 봇으로 분류하면 안 된다. [Google common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended) (갱신 2026-10-15)

## 사실: 2026년 Search Console 변경

- Google은 **2026-08-31 전세계**에 생성형 AI 노출 보고서와 Search AI 사용 제어를 배포했다고 명시한다. 따라서 예전 문서의 “Web 보고서에 합산된다”만으로 최신 측정 방법을 설명하면 불완전하다. [공식 발표](https://blog.google/products-and-platforms/products/search/new-controls-website-owners/) (최초 2026-06-03, 갱신 2026-08-31)
- **Generative AI performance report**는 AI Overviews/AI Mode의 **노출수**를 제공하며 페이지·국가·기기·날짜로 확인한다. 충분한 노출이 없으면 보고서가 보이지 않을 수 있다. 공식 문서가 설명하지 않은 전용 클릭수·검색어 지표를 제공한다고 가정하지 않는다. 이 보고서는 Gemini 앱 전체의 성과 보고서가 아니다. [보고서 도움말](https://support.google.com/webmasters/answer/16984139)
- Search Console의 **Settings → Search generative AI**에서 포함/제외를 관리한다. 기본값은 포함이며 하위 속성은 상위 설정을 상속할 수 있다. 이 설정은 학습 제어와 별개다. 배포 전후 소유자가 실제 속성 설정을 확인해야 하며 코드 변경만으로 계정 설정을 확인했다고 할 수 없다. [Search generative AI control](https://support.google.com/webmasters/answer/16908024)

## 사실: Claude 검색·방문·학습 권한

| 식별자 | 공식 역할 | GEO에 대한 해석 |
| --- | --- | --- |
| `Claude-SearchBot` | 검색 결과 관련성과 정확성을 높이기 위한 웹 탐색·색인 | 공개 콘텐츠 검색 발견을 원한다면 허용 여부 확인 |
| `Claude-User` | 사용자가 질문했을 때 사이트 콘텐츠 취득 | 직접 URL 읽기와 사용자 요청 기반 접근 확인 |
| `ClaudeBot` | 미래 모델 학습에 기여할 수 있는 웹 콘텐츠 수집 | 검색용 두 봇과 별도로 학습 정책 결정 |

Anthropic은 각 봇이 robots.txt를 준수하고 CAPTCHA를 우회하지 않는다고 설명한다. 서브도메인마다 정책을 적용해야 한다. 공식 IP 목록을 통해 요청 출처를 확인할 수 있으며 User-Agent 문자열만으로 진짜 봇이라고 확정하지 않는다. [Anthropic crawler policy](https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) (2026-04-07), [공식 IP 목록](https://claude.com/crawling/bots.json)

Claude 웹 검색은 검색 결과의 출처를 인용하고, 직접 URL을 제공하면 웹 내용을 가져올 수 있다. API의 검색 호출은 답변과 검색 결과·인용 URL을 반환하므로 회귀 평가에 활용할 수 있다. 이 기능 문서는 특정 사이트의 인용 순위를 보장하지 않는다. [Claude 검색 안내](https://support.claude.com/en/articles/10684626-enable-and-use-web-search), [Claude API web search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)

## 논문 근거와 한계

GEO 원 논문은 2023년 최초 공개, 2024년 개정·KDD 채택 연구다. 출처·인용·통계 추가 등의 효과를 특정 실험에서 관측했고 도메인별 차이도 보고했다. “최대 40%”는 해당 벤치마크의 가시성 지표 결과이며 매출·방문 증가나 2026년 GPT-6/Gemini/Claude의 개선 보장이 아니다. 본문 부록은 GPT-3.5 turbo 사용을 명시하고 별도 Perplexity 실험도 포함한다. [GEO 원문](https://arxiv.org/html/2311.09735v3), [버전·채택 정보](https://arxiv.org/abs/2311.09735)

## 듀잇 구현 권고

1. **접근성 우선:** 공식 소개·기능·사용법 페이지의 원본 HTTP HTML에 주요 본문, 제목, 정상 내부 링크가 들어 있는지 검사한다. 정적 생성 또는 서버 렌더링은 이를 보장하는 실무 방법이며 특정 모델의 특별 요구라고 주장하지 않는다.
2. **사실 일치:** 제품 정식명·대상 사용자·지원 환경·기능·제약을 화면에 정확히 설명한다. 미출시 기능, 가짜 통계, 없는 후기·평점·가격을 schema나 본문에 넣지 않는다. FAQ는 실제 이용자의 질문을 해결할 때만 추가한다.
3. **식별과 탐색:** 안정된 URL, 페이지별 제목·설명·canonical, 공개 정규 URL만 담은 sitemap, 탐색 가능한 안내 링크를 정비한다. 구조화 데이터는 화면에 확인되는 Organization/WebSite/SoftwareApplication 등 해당 의미를 표현하는 범위에서 선택한다. AI 인용을 위한 필수 항목으로 포장하지 않는다.
4. **로봇 정책:** 공개 페이지의 Googlebot, Claude-SearchBot, Claude-User 접근을 확인한다. 기존 학습 정책을 보존하면서 Google-Extended의 학습·grounding 결합을 문서화한다. 개별 봇 그룹을 추가하면 기존 비공개 경로 제한도 빠짐없이 유지한다.
5. **인증 경계:** 개인 일정·근무표·계정 데이터는 인증·권한으로 보호한다. robots.txt는 공개 접근을 막는 보안 장치로 사용하지 않는다. 공개 sitemap과 검색 인덱스에는 개인 URL을 넣지 않는다.
6. **특수 파일 우선순위:** llms.txt 신규 추가를 필수 작업으로 잡지 않는다. 이미 있다면 정확한 안내 문서로 관리할 수 있으나 Google Search 성과 근거로 보고하지 않는다.
7. **인프라 검증:** robots가 허용돼도 CDN/WAF·로그인·CAPTCHA·오류 응답 때문에 접근이 실패할 수 있으므로 배포 환경에서 실제 응답과 검증된 봇 로그를 확인한다.

## 배포 후 측정 워크플로우

1. 배포 전 기준선을 저장한다: 정규 URL, 색인 상태, Search Console 성과, 유입·전환, 공개 HTML과 JSON-LD 검증 결과.
2. 배포 후 URL Inspection으로 수집된 HTML·색인·canonical을 확인하고 sitemap 처리 상태를 점검한다. Search generative AI 포함 설정과 보고서 노출 여부를 소유자 계정에서 확인한다.
3. 고정 질문 세트를 브랜드/비브랜드/기능/제약 질문으로 구성한다. 예: “듀잇은 어떤 서비스인가?”, “간호대학생 대외활동은 어디서 찾나?”, “듀잇 채용 공고의 원출처는 어디인가?”. 제품에서 확인된 기능만 질문 정답표에 넣는다.
4. 평가 시 제품 표면, 실제 모델 ID, 검색 활성화, 날짜, 언어·지역, 질문 원문을 기록한다. 같은 조건에서 복수 실행하고 검색 미실행·오류를 별도로 집계한다.
5. **검색된 비율**, **듀잇 도메인 인용 비율**, **기능·제약 설명 정확도**, **유입과 실제 전환**을 구분한다. 본문에 브랜드가 언급됐다는 사실만으로 출처 인용 성공이라 판단하지 않는다.
6. Google Search AI 노출수는 전용 보고서로 추적하고 Gemini 앱·Claude 실험 결과와 합산하지 않는다. 주간/28일 비교 시 모델 변경·계절성·수집 지연도 기록한다. 표본 기반 테스트를 전 사용자 노출 순위로 해석하지 않는다.

## 불확실성

- 이번에 확인한 Claude/Gemini 운영사 문서에는 모든 모델의 인용 순위를 올리는 고정 문장 길이, schema 조합, llms.txt 의무, 보장 공식이 없다.
- 봇 접근 허용·정확한 콘텐츠·SEO 개선은 발견과 해석의 조건을 개선하지만 실제 인용 여부는 검색·질문·모델·제품 설정에 따라 달라진다.
- 모델 지식 자체가 즉시 바뀌는지, 배포 직후 실제 검색 인용이 늘어나는지는 코드·로컬 테스트로 검증할 수 없다. 배포 후 관측이 필요하다.
