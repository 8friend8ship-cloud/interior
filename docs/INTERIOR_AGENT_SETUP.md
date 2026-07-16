# HomeDesign Interior Agent V001 설치·연결

## 현재 구성

- 운영 DB: `HD_Interior_Agent_DB_V001`
- Spreadsheet ID: `1nxPCrUvJ1k6LVvwoCnO3gtbO_faXmgqb7gG4HNjlQ4w`
- Apps Script 원본 패키지 Drive ID: `1fITWIkTmVyxRDKolvk_-GoVbKwPruZQQ`
- GitHub 작업 브랜치: `feature/interior-research-webapp-v001`

## 1. 독립형 Apps Script 프로젝트 만들기

프로젝트 이름:

```text
HD_Interior_Research_WebApp
```

Drive ZIP의 `.gs`, `.html`, `appsscript.json` 파일을 같은 이름으로 추가합니다.

## 2. 최초 실행

Apps Script 편집기에서 다음 함수를 한 번 실행합니다.

```javascript
HD_quickStart();
```

이 실행은 다음을 수행합니다.

1. 운영 DB 탭과 헤더 점검·보완
2. 자료원·자재·시장·견적 템플릿 초기값 등록
3. API 토큰 생성
4. 오전 6:30, 10:30, 오후 3:30, 오후 9:30 조사 트리거 설치
5. 오후 10:10 일일보고 트리거 설치
6. 최초 조사 큐 실행

출력된 API 토큰은 공개 프런트 코드에 넣지 않습니다.

## 3. 자체검사

```javascript
HD_runSelfTest();
```

28평·33평 개략견적, 시트 구조, 건조한작가 Article 송출 형식을 점검합니다.

## 4. 웹앱 배포

Apps Script에서 `배포 → 새 배포 → 웹 앱`을 선택합니다.

- 실행 사용자: 나
- 액세스 권한: 운영 정책에 맞게 선택

배포 후 URL을 Vercel 환경변수에 저장합니다.

```text
HD_INTERIOR_WEBAPP_URL=<Apps Script 웹앱 URL>
HD_INTERIOR_API_TOKEN=<HD_quickStart에서 생성된 토큰>
```

토큰은 `api/interior-agent.ts` 서버 함수에서만 사용됩니다.

## 5. 프런트 연결

프런트는 `services/interiorAgentApi.ts`를 통해 `/api/interior-agent`만 호출합니다.

```typescript
import {
  calculateInteriorEstimate,
  getApprovedFrontData,
} from './services/interiorAgentApi';
```

프런트는 `APPROVED` 또는 `PUBLISHED` 데이터만 표시해야 합니다.

## 6. 조사 역할 분리

바로 실행되는 작업:

- Drive 자료 인덱스
- 등록된 공개 URL·공식 피드 확인
- 시트 정규화
- 고정 견적 계산
- 감사검사·일일보고

로그인된 Chrome 브리지에서 실행되는 작업:

- 네이버 부동산 단지·평면도
- 네이버쇼핑·쿠팡
- Amazon·AliExpress
- 트렌드 이미지와 공간 속 가구·가전·소품 분석

로그인 페이지는 Apps Script 서버에서 무단 대량 수집하지 않습니다.

## 7. 건조한작가 연결

현재 DRYWRITE의 Article 형식은 다음과 같습니다.

```typescript
interface Article {
  id: string;
  date: string;
  title: string;
  coverImageUrl: string;
  rawText: string;
}
```

Apps Script GET `action=drywriterArticles`가 동일한 배열을 반환합니다. 다음 수정 단계에서 DRYWRITE의 `localStorage` 중심 저장을 이 API 중심으로 전환합니다.

## 8. 배포 전 금지사항

- `main` 브랜치에 바로 병합하지 않음
- 기존 견적서·SKP·이미지 원본 덮어쓰기 금지
- 검토가 끝나지 않은 역사적 단가 공개 금지
- API 토큰을 React 환경변수나 브라우저 번들에 노출하지 않음
- Drive 프로젝트를 런타임 DB처럼 사용하지 않음

Drive 프로젝트는 Gemini의 글쓰기·문서작성 문맥이고, 실제 송호출은 Sheets·Apps Script·Vercel API가 담당합니다.
