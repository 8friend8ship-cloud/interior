# 모두의창업 중앙관리 브리지

## 목적
모두의 창업 2차 지원 건을 중앙에이전트가 공고 확인 → 신청 준비 → 제출 검증 → 결과 감시 → 다음 라운드 과제 생성 순으로 관리한다.

## 정본
- Application ID: `MODU_2026_2_GENERALTECH`
- 아이템: `AI 건설·인테리어 현장운영 OS`
- 트랙: 일반/기술
- 중앙관리 Sheet: `19zU7VM1u5KZjdx6Y1aUOLEn26MJtBANyLpF1w9iJt8k`
- Drive 정본 폴더: `1Tf8dILvkaeVEZSQ-sF2OfaRx6JdpO_G1`
- Apps Script: `1eBvPqjea9d7gPGm7Kdq-A_qhN2xbhMDvjSNpUZ49RPKV1P4BAnezGs9H`

## 상태머신
`DISCOVER → LEARN → PREPARE → LOGIN → SUBMIT → VERIFY → MONITOR → NEXT_STAGE`

실패 시 `FAIL_REVIEW → DISCOVER`로 되돌아가 검색·학습·수정·재검증한다.

## 자동화
`Code.gs`는 모두의창업 관련 Gmail을 검색해 메일/첨부를 기록하고 접수·보완·심사결과를 분류한다. 결과 이벤트는 `30_TASK_QUEUE`와 `60_APPLICATION_REGISTRY`, `70_SUBMISSION_LOG`, `80_AUTOMATION_LOG`로 연결한다.

## 완료 규칙
제출 버튼 클릭만으로 COMPLETE로 기록하지 않는다. 포털 제출완료 화면과 접수 상태/접수 알림을 readback하고 증빙이 남아야 완료다.

## 안전 규칙
- 기존 `main` 브랜치와 원본 Drive 파일을 직접 덮어쓰지 않는다.
- 인증 비밀번호·토큰은 저장소에 기록하지 않는다.
- 네이버/카카오 및 본인인증은 사용자 제어 인증을 사용한다.
