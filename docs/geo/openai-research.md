# OpenAI 검색·GPT-6 계열 GEO 조사

확인일: **2026-10-22 (Asia/Seoul)**. OpenAI Docs 스킬에 따라 공식 문서를 검색하고 본문을 직접 열어 확인했다. 검색 스니펫만으로 결론을 내리지 않았다. 앱 소스 변경이나 유료 API 실험은 수행하지 않았다.

## 근거와 구현 판단

| 조사 항목 | 확인한 공식 근거 | 듀잇 웹에 적용할 판단 | 한계 |
| --- | --- | --- | --- |
| 검색 수집 | `OAI-SearchBot`은 ChatGPT 검색용이며, 공식 문서는 robots.txt와 공개 IP 범위에서 요청을 허용하도록 권고한다. 차단한 사이트도 탐색용 링크에는 나타날 수 있다. [OpenAI Crawlers](https://developers.openai.com/api/docs/bots) | 공개 설명·가이드 페이지의 접근을 허용하고 배포 후 CDN/WAF 차단 여부를 확인한다. | 허용은 검색 순위·인용 보장이 아니다. |
| 학습 수집 | `GPTBot`은 기초 모델 학습에 사용할 수 있는 콘텐츠를 수집한다. 검색봇과 설정이 독립적이다. [OpenAI Crawlers](https://developers.openai.com/api/docs/bots) | 검색 노출을 위해 학습 허용 정책을 바꾸지 않는다. 기존 정책을 유지한다. | 학습 허용을 GEO 성과로 계산하지 않는다. |
| 사용자 요청 방문 | `ChatGPT-User`는 자동 크롤링용이 아니며 검색 포함 여부를 결정하지 않는다. 사용자 요청이므로 robots.txt가 적용되지 않을 수 있다. [OpenAI Crawlers](https://developers.openai.com/api/docs/bots) | 공개 URL을 직접 방문할 수 있는지 확인하되, 비공개 데이터 보호는 인증으로 처리한다. | robots.txt를 접근 통제로 간주하지 않는다. |
| GPT-6 범위 | 공식 모델 목록에 `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna`와 Web search 지원이 명시되어 있다. [API Models](https://developers.openai.com/api/docs/models) | 평가 시 정확한 모델 ID와 검색 활성화 여부를 기록한다. | 계정·제품별 제공 여부는 별도다. |
| API 검색 | Agents API 문서는 `gpt-6-astra`와 `web_search` 예시를 제공한다. 도구를 생략하면 검색이 꺼지고, `live`와 `cached` 모드가 구분된다. [Agents API Web search](https://developers.openai.com/api/docs/guides/agents-api/tools/web-search) | 최신 웹 반영을 평가할 때 검색을 명시적으로 활성화하고 모드·질문·날짜·출처를 기록한다. | 검색 없는 모델 응답을 배포 후 GEO 평가로 쓰지 않는다. |
| API 인용 | Responses API 검색은 출처 URL·제목을 포함한 인용 annotation과 검색 호출 정보를 제공한다. [Responses Web search](https://developers.openai.com/api/docs/guides/tools-web-search) | 언급률과 실제 듀잇 URL 인용률을 구분한다. | API의 인용 결과는 ChatGPT 제품 전체 노출을 증명하지 않는다. |
| ChatGPT 제품 | 현재 문서는 GPT-6.1 Sol·GPT-6 Sol·GPT-6 Luna의 제공 영역을 Work와 Codex로 설명하고 Chat과 구분한다. [ChatGPT Models](https://learn.chatgpt.com/docs/models) | GPT-6 검색 평가와 일반 ChatGPT 검색 평가를 별도 기록한다. | 출시·계정 정책은 변할 수 있어 실행 시 재확인한다. |
| 제품 검색 상태 | ChatGPT 검색은 별도 도구이며 제품·워크스페이스에 따라 이용 가능 여부가 달라진다. 로컬 Codex의 cached/live 설정도 구분된다. [ChatGPT Web search](https://learn.chatgpt.com/docs/web-search) | 사용자 인터페이스에서 검색 실행 및 실제 인용을 확인한다. | 단순 브랜드 답변만으로 웹을 읽었다고 판단하지 않는다. |

## 확인되지 않은 주장

- 검토한 공식 crawler·모델·검색 문서에서 **GPT-6 전용 웹사이트 메타 태그, 문장 길이, 키워드 밀도, 전용 JSON-LD 또는 순위 공식**은 확인하지 못했다. 그런 규칙을 요구사항으로 만들지 않는다.
- 공식 API 문서 자체는 `llms.txt`와 Markdown 문서 링크를 제공한다. 그러나 그것이 제3자 웹사이트의 ChatGPT 검색 노출·인용 순위에 사용된다는 공식 근거는 확인하지 못했다. `llms.txt`는 선택적 실험이며 필수 작업이나 효과가 검증된 기법으로 소개하지 않는다.
- 이 문서들은 OAI-SearchBot의 모든 JavaScript 렌더링 조건을 설명하지 않는다. 따라서 “JavaScript를 전혀 실행하지 않는다”는 단정은 하지 않는다. 주요 제품 설명을 초기 HTML에 포함하는 방안은 수집 호환성을 높이는 **공학적 권고**이며 OpenAI의 순위 규칙이 아니다.
- 구조화 데이터, FAQ, 제목 개선만으로 인용을 보장할 수 없다. 실제 기능과 일치하는 공개 설명, 안정적인 URL, 접근 가능한 HTML을 우선한다.

## 실행·검증 워크플로우

1. **기준선:** 공개 URL, 응답 코드, robots.txt, sitemap, canonical, noindex, 초기 HTML의 제품 설명을 저장한다. 개인 일정·사용자 데이터·인증 경로와 공개 안내를 구분한다.
2. **내용 정합성:** 실제 제공 중인 기능만 설명한다. 듀잇의 대상 사용자, 사용 방법, 지원 범위, 제한 사항을 명확한 제목과 문단으로 제공한다. 숫자·인증·비교 우위는 근거 없으면 추가하지 않는다.
3. **접근성:** 공개 경로의 검색봇 접근과 서버 HTML을 확인한다. 봇에게만 다른 내용을 제공하지 않는다. 메타 정보와 구조화 데이터는 화면에 보이는 설명과 일치시킨다.
4. **로컬 검증:** 빌드·정적 검사 후 실제 서버 응답에서 title, canonical, robots, sitemap, 본문, JSON-LD를 확인한다. robots의 개별 사용자 에이전트 그룹을 추가한다면 공통 제한 경로가 누락되지 않는지 확인한다.
5. **배포 검증:** 운영 도메인의 리디렉션·캐시·WAF·robots 응답을 확인한다. 공개 IP 범위의 최신 값은 공식 crawler 문서에서 확인하며 문서에 IP를 고정 복사하지 않는다.
6. **관찰:** 브랜드 질문, 기능 질문, 일반 추천 질문을 고정해 동일 조건으로 반복 평가한다. 모델 ID/제품, 검색 모드, 날짜, 언급 여부, 실제 인용 URL, 사실 오류를 함께 기록한다. 도메인 제한 검색은 수집 진단용, 제한 없는 검색은 발견 가능성 평가용으로 분리한다. 이는 실험 설계 권고이며 공식 순위 공식이 아니다.

OpenAI 문서의 robots 변경 반영 안내는 약 24시간이다. 이는 실제 재수집·색인·추천 노출 완료 시간에 대한 SLA가 아니다. [OpenAI Crawlers](https://developers.openai.com/api/docs/bots)
