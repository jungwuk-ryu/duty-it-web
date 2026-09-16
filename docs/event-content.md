# 행사 내용 연동

행사 상세 화면은 Surfer가 미리 생성한 행사 내용을 선택적으로 표시합니다. 내용이 없거나 Surfer가 일시적으로 응답하지 않아도 기존 상세 화면은 그대로 표시됩니다.

## 서버 환경 변수

- `DUIT_EVENT_CONTENT_API_TOKEN`: Surfer와 공유하는 서버 간 Bearer 토큰입니다. `NEXT_PUBLIC_` 접두사를 붙이지 않고 Vercel의 서버 비밀 환경 변수로 관리합니다.
- `SURFER_API_BASE`: 선택 사항이며 기본값은 `https://surfer.dutyit.net`입니다.

토큰은 서버 컴포넌트의 서버 전용 조회 모듈에서만 사용합니다. 브라우저 요청, HTML, React 속성에는 토큰을 포함하지 않습니다.

운영 배포 전에는 Preview와 Production 환경에 `DUIT_EVENT_CONTENT_API_TOKEN`을 등록해야 합니다. 토큰이 없거나 본문 응답의 `availability`가 `unavailable`이면 행사 내용 섹션을 렌더링하지 않습니다.
