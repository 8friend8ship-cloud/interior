# HomeDesign 인테리어 견적앱 V2 작업본

## 원본 보존
- 운영 기준본: `main`
- 새 작업본: `rebuild/v2-20260721`
- `main`과 기존 Vercel Production은 사용자 승인 전까지 변경하지 않습니다.

## V2 연결 구조

```text
React/Vite 프런트
  → /api/agent-bridge
  → Vercel 서버 환경변수
  → Apps Script 웹앱
  → 승인된 Google Sheet·Drive
```

브라우저에는 Apps Script 토큰을 넣지 않습니다. `AGENT_MAIL_ENDPOINT`와 `AGENT_MAIL_TOKEN`은 Vercel 서버 환경변수에만 둡니다.

## 이번 버전에 추가된 파일
- `api/agent-bridge.ts`: Vercel 서버 프록시
- `services/agentBackendService.ts`: 프런트 조회·작업등록 클라이언트
- `.env.example`: 필요한 환경변수 이름

## 다음 구현 순서
1. 기존 화면과 견적 생성 기능을 그대로 유지합니다.
2. 백엔드 연결 상태를 확인하는 관리자 화면을 추가합니다.
3. 견적 요청을 `30_TASK_QUEUE`에 등록합니다.
4. 작업 결과의 Drive 링크를 앱 결과 화면에 연결합니다.
5. Vercel Preview에서 테스트합니다.
6. 같은 GitHub 브랜치를 Google AI Studio로 가져와 사용자 테스트를 진행합니다.
7. 두 테스트가 모두 통과한 뒤에만 Production 승격을 검토합니다.

## 완료 조건
- 원본 `main` 무변경
- 프런트 빌드 성공
- `/api/agent-bridge?action=queue` 응답 성공
- Google Sheet 작업큐 등록 성공
- Vercel Preview 정상
- Google AI Studio 사용자 미리보기 정상
