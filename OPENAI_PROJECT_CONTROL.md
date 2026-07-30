# OpenAI Project Control

- Repository: `8friend8ship-cloud/interior`
- Actual package: `인테리어-전문가-ai`
- Project role: **홈디자인 인테리어 전문가 AI 운영 후보**
- Management status: `PRIMARY_COMPARE_PENDING`
- Last reviewed: `2026-07-30 KST`

## 1. 활용 방향

이 저장소는 실제 인테리어 경력·견적·계약·하자·상담 자료를 바탕으로 고객 질문에 답하고 견적/상담/콘텐츠 업무를 보조하는 홈디자인 전문 앱으로 사용한다.

예정 역할:
- 고객 요구사항 정리
- 견적·공정·자재 비교
- 계약·하자·누수·방수·욕실 냄새 등 전문 안내
- 상담용 결과 캡처·엑셀/PDF 전달
- 블로그·쇼츠 콘텐츠 소재를 Content OS에 전달

## 2. 상호 연계

- Drive 원본: `HD_AGENT_DB`, `HD_PLATFORM_FOLDER`, `HD_ESTIMATE_REFERENCE`
- 중복 비교: `-2.20`
- 글 생산: `DRYWRITE`
- 분석·성과: `Analyzer-12.09`
- 클립/영상: `-`, `animation`
- 상담·DM·상품/견적 전환: 중앙 Agent 작업큐

## 3. Drive 연계 정책

공개 저장소에는 고객명·주소·계약서·견적서 URL 또는 Drive ID를 넣지 않는다.

- `MASTER_REGISTRY`
- `HD_AGENT_DB`
- `HD_PLATFORM_FOLDER`
- `HD_ESTIMATE_REFERENCE`
- `HD_CONTRACT_REFERENCE`
- `HD_PMF_INTERVIEW`
- `HD_CONTENT_QUEUE`

고객별 파일은 Drive에서만 관리하고, 앱에는 승인된 구조화 데이터와 익명화된 참조만 전달한다.

## 4. 파일 꼬리표

- `[INTERIOR_CORE]`: 인테리어 전문 판단 로직
- `[ESTIMATE]`: 견적·엑셀
- `[CONTRACT]`: 계약·분쟁·하자 참고
- `[FRONTEND]`: 고객/관리 화면
- `[AI]`: Gemini 상담·분석
- `[DRIVE]`: 견적·자료·상담 연계
- `[PRIVACY]`: 고객 개인정보·현장자료
- `[CONTENT]`: 블로그/SNS 콘텐츠 전환
- `[DUPLICATE]`: `-2.20` 중복
- `[SECRET]`: API 키
- `[DEPLOY]`: Vite/Vercel
- `[REVIEW]`: 최신본 확정 필요

## 5. 초기 파일 대장

| 파일/영역 | 태그 | 활용 방향 | 상태 | 다음 점검 |
|---|---|---|---|---|
| `package.json` | `[DEPLOY] [ESTIMATE]` | Gemini·xlsx·html2canvas 환경 | 확인됨 | `-2.20` 의존성/버전 비교 |
| `App.tsx` | `[FRONTEND] [INTERIOR_CORE]` | 고객 입력·전문 분석·결과 표시 | 검토 예정 | 실제 상담 흐름과 일치 확인 |
| 엑셀 처리 | `[ESTIMATE] [DRIVE]` | 견적 자료 읽기/내보내기 | 우선 검토 | 수식·단가·개인정보 보존 확인 |
| 캡처/결과 출력 | `[CONTENT]` | 상담 결과·콘텐츠 이미지 생성 | 검토 예정 | 1960×1960 및 플랫폼별 규격 분리 |
| Gemini 호출 | `[AI] [SECRET]` | 전문 상담·분석 | 우선 검토 | 근거 없는 단정·키 노출 방지 |
| 고객/현장 데이터 | `[PRIVACY] [DRIVE]` | 실제 견적·계약·현장 참고 | 우선 검토 | 익명화·권한·로그 정책 확인 |

## 6. 수정 진행 규칙

1. `-2.20`과 파일·기능·커밋을 비교한 뒤 최신 운영본을 확정한다.
2. 고객 개인정보와 계약/견적 원본은 GitHub에 넣지 않는다.
3. 전문 안내는 실제 Drive 자료와 사용자 확정 원칙을 우선한다.
4. 점검구 실리콘 밀봉 등 잘못된 현장 지침을 자동 생성하지 않도록 전문 규칙을 유지한다.
5. 코드 변경은 작업 브랜치와 Draft PR로 진행한다.
6. 결과는 상담·견적·콘텐츠·분석 중 어느 용도인지 구분해 저장한다.

## 7. 결정 기록

- `2026-07-30`: interior를 홈디자인 운영 후보로 분류하고 `-2.20`과 통합 검토 시작.
