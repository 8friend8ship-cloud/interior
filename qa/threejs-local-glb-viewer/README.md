# Interior local GLB QA viewer (2026-11-18)

This is a **sandboxed QA module within the existing interior repository**, NOT a second production app and NOT an approved customer model. It is intentionally not imported into the existing `App.tsx` and must not alter quote calculations or deploy automatically.

## Run locally (nonproduction)

```bash
cd qa/threejs-local-glb-viewer
npm install
npm test
npm run build
npm run dev
```
Open the local Vite URL in Chrome and choose an authorized QA-exported **GLB**, not the original SKP. The browser reads the file in memory; there is no upload and no server-side model endpoint. Optional manifest:
```json
{
 "asset_id":"LOCAL_QA_ASSET_ID",
 "glb_sha256":"<64 character lowercase SHA256 of the GLB>",
 "rights_status":"HOLD",
 "source_verified":false
}
```
Even an approved manifest produces only SOURCE_METADATA_MATCH_LOCAL_ONLY. It does NOT approve geometry for room measurements, QTO, BOM, pricing, provider upload or production release. Raw customer assets, model binary, and private file paths must never be committed.

## Existing verified reference (no model copied)

Existing `packs/aside-agent-orchestrator/docs/INTERIOR_P0_SEED01_ROOM_WALL_CUT_MESH_FACEWALK_X2_NEXT_ROOM_FREE_SPACE_20261118.md` documents SketchUp native-source geometry evidence; its protected SKP and QA copy do **not** establish a rights-approved GLB or a measured floor plan. This QA viewer has NO real sample GLB bundled.

## Gate

1. Read canonical source rights + source hash; obtain authorized read-only derived GLB in notebook working scope.
2. Verify source→GLB provenance, embedded resources and GLB SHA. Preserve original SKP and original QA copy unchanged.
3. Run `npm test` twice, `npm run build`, then Chrome desktop/mobile-orientation interaction QA (rotate, zoom, pick, memory/resize).
4. Distinguish `CODE_BUILD_PASS`, `LOCAL_WEBGL_QA_PASS`, `SOURCE_RIGHTS_PASS`, `QTO_PASS` and `PUBLISH_PASS`; only the first can be earned by code tests.
5. After owner/rights, geometry and QTO acceptance: propose a narrowly reviewed integration into existing `interior` UI as a separate step; do not touch main/Production or add a scheduler/paid API.

**FIRST_UNFINISHED:** authorized QA GLB export plus actual Chrome/WebGL source validation (X1/X2). Prior project P0 TRUE_ROOM_FREE_SPACE_GRAPH remains the QTO authority; screen-reported scene units are never approved real measurements.
