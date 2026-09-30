# 행사 내용 연동

행사 상세 화면은 Surfer가 미리 생성한 행사 내용을 선택적으로 표시합니다. 내용이 없거나 Surfer가 일시적으로 응답하지 않아도 기존 상세 화면은 그대로 표시됩니다.

## 서버 환경 변수

- `SURFER_API_BASE`: 선택 사항이며 기본값은 `https://surfer.dutyit.net`입니다.

웹과 Android 앱은 `GET /api/v1/public/duit-events/{eventId}/content`를 사용합니다. 서버 비밀 토큰이 필요하지 않습니다. 웹에서는 서버 컴포넌트가 이 경로를 조회하고 최대 60초 동안 결과를 캐시합니다.

Surfer는 저장된 본문이 있는 행사에 대해 듀잇 공개 API의 현재 상태가 `ACTIVE` 또는 `FINISHED`인지 확인한 뒤 내용을 반환합니다. 미공개·삭제·철회된 행사와 본문이 없는 행사는 `availability: unavailable`로 반환하며, 웹은 내용 섹션을 렌더링하지 않습니다. 요청 제한이나 조회 오류도 기존 상세 화면을 막지 않습니다.

기존 서버 간 전용 경로는 Surfer의 Bearer 인증을 유지합니다. 앱이나 브라우저에 해당 서버 토큰을 포함하지 않습니다. 이번 공개 읽기 연동 이후 듀잇 웹의 `DUIT_EVENT_CONTENT_API_TOKEN` 설정은 사용되지 않습니다.
