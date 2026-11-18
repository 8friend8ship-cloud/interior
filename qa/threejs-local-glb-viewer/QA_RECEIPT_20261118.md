# Interior Three.js local GLB QA — actual run readback 2026-11-18 (KST)

**Scope:** existing `8friend8ship-cloud/interior`, branch `qa/interior-threejs-local-glb-20261118`, local QA module only. Existing `App.tsx`, estimates, production, protected customer SketchUp, QA-source copy and shared Sheets remain unchanged.

## Verified source metadata, not approval

- Existing `SEED_SKP_01` 31-pyeong source present on authorized notebook `BOOK-1HE2THGKRA`.
- Actual `Get-FileHash SHA256` check: **2360937a7b3c0cf738c64721d6748282711bd7ea186f48d123d59d265d324a97**, source file **54,374,743 bytes**, equal to prior isolated SketchUp X2 receipt.
- Native geometry/Room graph previous X2 evidence is in `contents-os-git/packs/aside-agent-orchestrator/docs/INTERIOR_P0_SEED01_ROOM_WALL_CUT_MESH_FACEWALK_X2_NEXT_ROOM_FREE_SPACE_20261118.md`.
- **No rights-approved, source-correlated, full-scene GLB is yet available**. Source hash equality is NOT proof of rights, accurate room areas, GLB conversion, or production suitability.

## Tool and QA results

| Gate | Observed result | State |
| --- | --- | --- |
| Node / npm / Three.js / Vite on notebook | 24.19.0 / 11.17.0 / 0.181.2 / 6.4.6 | VERSION_READBACK |
| GLB format, external URL, spoofed length, SHA/rights unit tests | X1 **9/9**, X2 **9/9**, exit 0 | PASS |
| Vite bundle build | exit 0, 10 modules, 613.10KB JS (gzip 160.77KB), bundle size >500KB warning | PASS_WITH_PERF_WARNING |
| Local Vite HTTP | 127.0.0.1:5176 HTTP 200 | PASS (localhost only) |
| Actual Chrome UI visual | 1280x800 screenshot opened; controls, warning, 3D grid rendered | PASS_INITIAL_VIEW |
| Actual Chrome synthetic GLB | 816-byte geometric triangle, SHA256 `4da50a1a8f0bb0600f6708062d00848a505cd9e79d5910beb681276309fe86bf`; visible 3D mesh | PASS_FIXTURE_ONLY |
| Actual Chrome synthetic GLB pick/zoom | Clicked mesh returns `QA_ONLY_NO_REAL_DIMENSION`, Mouse wheel applied; 0 JS console/page errors after favicon fix | PASS_FIXTURE_ONLY |
| No manifest / rights unknown | display label `HOLD_SOURCE_PROVENANCE`; `qto_approved=false`, `publish_approved=false` | PASS_FAIL_CLOSED |
| User apartment original → rights-approved GLB → rendering X1/X2 | no actual converted approved GLB | HOLD |
| Gemini Eye independent latest approval / Codex model independent review | no new external provider execution receipt | HOLD |
| Actual mobile device touch/rotation & app Preview E2E | not executed | HOLD |
| Shared core SketchUp/room/free-space/QTO/BOM/estimate | not changed or approved by this test | HOLD |

**Interpretation:** test triangle is a synthetic functional fixture only; the code demonstrates GLB/WebGL loading and object picking, **not** that a user's apartment model has been rendered or that measurements/quotes are valid.

## FIRST_UNFINISHED

1. Confirm rights and provenance of the existing `SEED_SKP_01` QA-source copy and obtain a *local, nonpublic* source-correlated GLB without changing either protected source. Capture source GLB hash and conversion tool/version, object counts, coordinates/units, textures and manifest.
2. Run Chrome (desktop and mobile orientation) on the actual authorized GLB with screenshot X1/X2, camera orbit/zoom/selection, FPS/memory, fail-closed rights. Do not publish raw client geometry or raw coordinates.
3. After passed rights, actual GLB QA, Codex/REA independent review and `TRUE_ROOM_FREE_SPACE_GRAPH` maturity, propose a small lazy-loaded component inside existing interior app Preview. NEVER infer QTO from viewer object size. Get owner approval before Production.

**LAST_GOOD:** `GLB_GATE_TEST_9x2 + VITE_BUILD + CHROME_GRID + SYNTHETIC_GLB_RENDER_PICK_SHA_HOLD`.

**RELEASE:** `PASS_LOCAL_QA_CODE_AND_SYNTHETIC_WEBGL__HOLD_REAL_SOURCE_GLB_RIGHTS_ROOM_QTO_PREVIEW_PUBLISH`.

No new application project, central PACK/TASK/trigger/paid API, production deploy, shared Drive edit, raw geometry, SKP copy upload, or public post occurred.
