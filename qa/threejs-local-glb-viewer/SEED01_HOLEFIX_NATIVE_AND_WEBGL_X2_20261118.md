# SEED_SKP_01 4개 복합 루프 Native 복구 + Chrome QA X2
검수 기준: 2026-11-18 KST. 기존 `8friend8ship-cloud/interior` QA 브랜치의 인테리어 3D 뷰어 연속 작업. `DUAL_EYE_MULTI_BRAIN_BRIDGE_V1`. **로컬/비공개 QA만 승인**, 실물 시공 수량이나 공개 배포 승인이 아님.

## 선행 LAST_GOOD
- SketchUp 보호 QA 사본 SHA256 `2360937a7b3c0cf738c64721d6748282711bd7ea186f48d123d59d265d324a97`, Drive 원본 및 QA 원본 X1/X2 전후 동일
- root direct 257 Face 중 직전 GLB 내 253면만 표시, 기존 GLB 954 triangles / 35,940 bytes / SHA256 `4c0d90db66bab1fe2dc7d8439e9c58b19d55746a94c008d1b2767e28807d2acf`
- 이전 중간 실패 `HOLD_NONTRIANGLES`는 보존됨. SketchUp Native에서 4개 복합 face의 삼각 메시 내 퇴화 삼각형이 포함되어 발생. 원본 문제나 유효 hole 삭제라고 단정 금지

## 이번 실제 실행
- 기존 SketchUp 2022 isolated APPDATA / QA-only copy / no save를 **X1/X2 독립 GUI 프로세스**로 실행. Native mesh 출력 정상, SketchUp 프로세스 종료·읽기 전용 복원·원본 SHA 보호 완료
- 4개 non-cut inner-loop faces: Native 유효 삼각형 **90개**, 퇴화 삼각형 **15개**만 면적 검증 후 제외. 기존 별도 cutting host 4 faces/44 삼각형과 겹치는 ID 0개
- 4개 Native 면 실제 Native 면적 대비 삼각합 최대 차이 **0.088mm²**, 다른 세 면 0mm² (출력 자릿수 기준)
- X1/X2 정규화 Native 4면 SHA256 동일: `bad4a67a1e07d4a9b23d997f9a3ea6e3299a4ceec3b8c9a753e1957521cbad9f`
- 독립 geometry-hole inside tests: 총 250개 내부 hole sample point / 실행, mesh-filled hits **0**. X1/X2 동일. 이는 수학적 전체 완전성 증명이 아닌 보수적 포인트 검사
- 버전 분리 Python 변환 `scripts/seed01_native_json_to_glb_readonly_v2_holefix.py`: 루트 Native Face **257/257**, hole four 포함; 하부 shell 참고 28 faces, 기존 4 cutting face 포함, skipped root=0
- 개선 GLB: **39,180 bytes / 3 GLB meshes / 1,044 triangles** (root 910 + lower shell 90 + Native cut 44), X1/X2 GLB SHA256 동일: `9d160d0c7b6850b28bc80290cfbc5d44a959213c8a8362efe88667cededd8469`
- 기존 React 견적 앱과 연결 **없음**, full 3D scene이 아님(구조 shell 일부, 가구/텍스처/기타 하위 요소 제외)
- Chrome PC X1 및 390×844 mobile viewport emulation X2: GLB 3 meshes 실제 표시, 양측 page/console error 0, 외부 요청 0, 검수 UI `HOLD_RIGHTS_OR_SOURCE`; `qto_approved=false`, `publish_approved=false`
- 모바일 기기 실물 터치/멀티터치 검수 **미실시**. GPU/지속 프레임/메모리 벤치마크 미실시

## 자료 범위 및 안전
- 보호 노트북 제한 폴더에만 원본 SKP / QA-copy / X1,X2 Native raw 좌표 JSON / GLB 및 Chrome 원본 캡처 보존. GitHub commit은 **재사용 코드 + 집계 수치 + 영수증 설명**만 저장
- 업로드된 Drive는 화면 PNG 2개 및 텍스트 설명만으로, 별도 공유 승인 없는 private folder 안에 보존. 원본, GLB, 기하원문/개인정보 업로드 금지
- `scripts/seed01_native_four_inner_loop_template_v3.rb`는 로컬 보호 경로, 모델 GUID, face IDs를 환경변수로 받아야 하는 비공개 실행용 **템플릿**이며 GitHub 원격에서 실행한 것이 아님
- `main`, Production, 기존 `App.tsx`, `deterministicEstimate.ts`, 81/48/23 원장, Windows 예약, 신규 팩/트리거, 유료 AI는 변경·호출 없음
- **현재 HOLD**: 사용권/소유자 개인정보 조건, 실제 방 경계(semantic), 시공 QTO/BOM, 전체 장면 전환, Meta/실물 Android QA, 운영 배포

**LAST_GOOD:** `FOUR_NATIVE_HOLES_X2_SHA_MATCH + ZERO_HOLE_FILL_SAMPLES_X2 + ROOT_FACE257_GLB_SHA_MATCH + CHROME_2VIEW_QA_0_ERROR`.

**FIRST_UNFINISHED:** user-authorized source rights/semantic room check → `TRUE_ROOM_FREE_SPACE_GRAPH` full boundary/QTO contracts → real mobile touch QA → only then existing APP_INTERIOR Preview optional lazy viewer, production still human-approved HOLD. Avoid redoing earlier completed Native X2 or creating new PACK.
