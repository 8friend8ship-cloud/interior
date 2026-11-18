# 서울숲푸르지오 SKP → 사내 검수용 3D 웹 미리보기 — 2026-11-18

**계보:** DUAL_EYE_MULTI_BRAIN_BRIDGE_V1. 기존 `interior` QA 브랜치 재사용. **실제 변환/Chrome 시험 완료**, 고객 승인·견적 완료 아님.

## 원본·증거

- 원본 Drive 파일 ID: `1lSE_dgo9z04_iWhoCqvY7TVBZktbj1Nv` (미공개 사용 목적 외 공개 금지), Drive `shared=false` readback.
- 노트북에서 **기존 보호 QA SKP 복사본** SHA256 `2360937a7b3c0cf738c64721d6748282711bd7ea186f48d123d59d265d324a97`; 원본·복사본 변경 없이 기존 Native X1/X2 JSON만 사용
- Native 자료: root Face257, cutting Face4의 원본 Native 삼각 메시, shell 후보 Group2의 하부 28면. 원본 SketchUp 다시 실행하지 않음
- 변환 소스: `scripts/seed01_native_json_to_glb_readonly_v1.py` (입력 경로 CLI 변수만, 민감한 실제 경로·좌표 없음)

## 실행 결과

| 항목 | X1/X2 실제 결과 |
|---|---|
| 코드 변환 | 로컬 Python 독립 2회 **exit 0** |
| GLB SHA256 | `4c0d90db66bab1fe2dc7d8439e9c58b19d55746a94c008d1b2767e28807d2acf` 동일 |
| 출력 | 35,940 bytes, 3 meshes, 954 triangles |
| Root, 하부 Shell, Native cutting faces | 각각 820 / 90 / 44 triangles |
| complex two-loop root faces | 4개 **명시적 제외** (실제 모델 전체 아님) |
| 브라우저 PC X1 | Chrome headless screenshot, WebGL 실제 메쉬 보임, page/console errors 0, 외부 HTTP 요청 0 |
| 모바일 X2 | 390×844 Chrome mobile viewport emulation screenshot, WebGL 실제 메쉬 보임, errors 0, 외부 요청 0 |
| 단위 계약 | Source SketchUp mm → WebGL glTF meters, 축 Z-up → Y-up. QTO 측정 근거 아님 |
| 권리/견적/운영 | `HOLD_RIGHTS_OR_SOURCE`, `room_qto_approved=false`, `publish_approved=false` |

이 QA 변환본은 참조 외부 이미지, 가구와 텍스처를 제외한 **부분 구조 미리보기**이며 실측치/완성 설계도/실제 공사비를 보장하지 않음. SKP raw / GLB / 원본 좌표 JSON / Chrome RAW 캡처는 노트북 보호 폴더에만 보관. 사용자가 검수할 화면 이미지 2개는 비공개 Drive 프로젝트 QA 폴더로 별도 복사했으나 API 파일 ID는 동기화 및 readback 후에만 외부 링크 제공.

**LAST_GOOD:** `SKP_SHA_MATCH → EXISTING_NATIVE_JSON → PARTIAL_GLB_X1_X2_SHA_EQUAL → CHROME_REAL_MODEL_DESKTOP/MOBILE_EMU_0_ERR`.

**FIRST_UNFINISHED:** 원본 4개의 complex loop Native 완전 절단 메쉬 보존 → 전체 대상 Geometry 출처·사용권/사생활 검증 → 실제 물리 Android 터치/Orbit X2 → 정본 TRUE_ROOM_FREE_SPACE_GRAPH 및 QTO 검증 완료 후에만 기존 견적 앱 Preview에 opt-in lazy loading 연결.

**NOOP/보존:** 기존 `App.tsx`, `deterministicEstimate.ts`, `main`, 운영 배포, 고객 SKP, Drive 원본, Sheets 원장, Windows trigger, API, 유료 서비스 변경0.
