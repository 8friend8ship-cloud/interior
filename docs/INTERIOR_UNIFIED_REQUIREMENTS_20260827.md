# Interior Unified Requirements — 2026-08-27

Canonical app: APP_INTERIOR / HomeDesign Interior
Canonical integration candidate base: feat/estimate-marketplace-personalization-20260825 (PR #8)
Production/main remains unchanged until runtime x2 verification and user production approval.

## User-facing product scope

### Consumer
- FREE: simple estimate, product/material links, simple calculator/form.
- PRO: detailed estimate, BOQ/quantity takeoff, perspectives/drawings, schedule, video/report package, contractor comparison, tender/bid package.
- Modes: SIMPLE / COMPARE / TENDER.

### Supplier
- FREE: basic request/bid participation where permitted.
- PRO: estimate automation, perspective/output workflow, provider-specific forms/templates, platform workflow.
- Modes: REGISTER_BID / AUTOMATION / PLATFORM.

## Project domains
- RESIDENTIAL_INTERIOR
- COMMERCIAL_INTERIOR
- ARCHITECTURE_BUILD
- RENOVATION_REMODEL

Building use must remain explicit and domain pricing must be isolated. Residential rates must never silently populate commercial/build/major-remodel projects.

## Front requirement chain
USER_INPUT(plan/photo/area/site/voice/request)
→ MARKETPLACE_CONTEXT(role/tier/domain/building use/mode/template)
→ INTERIOR_BACKDATA
→ QUEENS
→ SEED
→ T1
→ T2
→ PYTHON_TAKEOFF/BOM
→ ESTIMATE + MATERIALS + SCHEDULE + DRAWING/RENDER DATA
→ RESULT QA / reverse calculation
→ FRONT RESULT

Optional outputs only after verified core result:
- NotebookLM: report/audio/slides/infographic
- Flow: image/video scene generation
- SketchUp/D5/Python: drawing/3D/perspective
- VTube/Animation: video package
Core estimate runtime must not depend on NotebookLM.

## Must-preserve branches / PR deltas

### PR #8 — integration spine
- marketplace roles/tiers/modes
- domain/building-use isolation
- provider/request/template lineage
- Interior backdata bridge
- Queens→Seed→T1→T2 runtime candidate
- schedule/material/render bridge
- client/internal field separation contract

### PR #9 — required quantity lineage fix
- preserve original per-trade quantity × areaRatio
- 32→40 py expected regression: wallpaper 80→100, flooring 28→35, cleaning 32→40
- must be absorbed before unified candidate can pass estimate QA

### PR #5 — required runtime specialization deltas
- Interior-specific T1/T2 specialization
- DryWriter URL runtime guard and readback
- retry only DRYWRITER_WEBAPP_URL_NOT_CONFIGURED rows
- no invented current market rate/quantity/evidence

### PR #4 — optional-but-required-for-front parity
- local-first language pack V2
- appId+locale+packVersion Bots handoff
- must not translate arbitrary user/generated long content

### PR #2 — trust/security deltas to preserve if still applicable
- no browser secret/API key
- central audited core route
- RESULT_ID/AUDIT_ID provenance where supported
- no silent mock/fake square-floorplan success
- customer UI source/confidence labels

### PR #6 — continuous factory policies to preserve
- front-requirement reverse factory
- area/plan/budget/material/process/defect/estimate/scene/style/region demand fields
- quantity/price/formula lineage = 100%
- fabricated numbers = 0
- same fixture runtime readback x2
- API A/B only on approved quality/freshness gaps

## Missing/unfinished user requirements to implement or verify
- Dynamic estimate request form similar to Naver/Google Forms
- standard/provider/custom question schema and conditional fields
- region/provider routing
- paid email estimate delivery where product rules permit
- consumer comparison estimate experience
- tender package and bid comparison
- supplier bid registration and estimate automation UX
- customer estimate vs internal cost/margin strict separation
- actual automatic construction schedule derived from scope/quantities/site constraints
- plan/photo/site understanding fixture
- parking/road/entry/site-layout relationships for building/site projects
- quantity takeoff from verified plan dimensions
- material/product links with evidence/source
- perspective/drawing output lineage
- client export/report package
- provider/custom/personal template versioning
- admin price/labor/material history migration to authenticated Drive route

## Runtime gates
A feature is not VERIFIED by code/CI/Preview/trigger existence alone.
Required proof:
1. exact bound Apps Script source sync
2. trigger/function execution
3. Queens→Seed→T1→T2 readback
4. quantity reverse-check 32/40 py
5. estimate/material/schedule/render result readback
6. consumer SIMPLE/COMPARE/TENDER front path
7. supplier AUTOMATION/BID path
8. client output internal-cost/margin leakage = 0
9. site/plan fixture readback
10. same-fixture x2 + regression check
11. lesson/history/audit writeback

## Version integration rule
Create one unified candidate; do not keep developing independent feature branches after their useful delta is absorbed. Preserve main/Production until the unified candidate passes the above gates and production promotion is separately approved.
