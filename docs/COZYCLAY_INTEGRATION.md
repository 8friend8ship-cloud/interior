# CozyClay Integration Plan

## Goal

Use CozyClay as an isolated 3D previs/scene-authoring engine for the HomeDesign workflow without copying its AGPL code into the proprietary/business application layer.

## License boundary

CozyClay is AGPL-3.0-or-later. Keep the CozyClay runtime in a separate deployable service/repository. If a modified CozyClay instance is exposed over a network, publish the complete corresponding source and configure its source-code link as required by CozyClay's licensing instructions.

The HomeDesign app communicates with the engine through a narrow bridge API. The bridge contract in `services/cozyClayBridge.ts` contains no CozyClay source code.

## Target workflow

1. Queens collects references and classifies space/person/furniture/material/camera assets.
2. Seed normalizes those references into reusable scene metadata.
3. Template-1 composes a base room scene and asset placement plan.
4. Template-2 adds shot list, camera movement, person actions, and AI-video prompt metadata.
5. Central Agent sends the scene plan to the CozyClay bridge.
6. CozyClay produces/updates the 3D previs project and camera plan.
7. Render output enters the existing Base Render -> segmentation/mask -> inpainting pipeline.
8. Scene object IDs are mapped to BOM/material/estimate records.
9. Final shot metadata can be forwarded to downstream image/video generation tools.

## Separation of responsibilities

### HomeDesign / Central Agent
- request orchestration
- Queens/Seed/template data
- customer/project metadata
- BOM and estimate data
- asset URL/index metadata
- approvals, audit, and workflow states
- downstream render/edit/generation routing

### CozyClay engine
- scene graph
- object placement
- character pose/motion
- camera/lens/cuts
- timeline/shot authoring
- previs project serialization

### Bridge service
- authentication
- HomeDesign request schema validation
- conversion to CozyClay MCP/live actions
- job/status normalization
- URL/file reference return
- error/ACK reporting

## Bridge API contract

Suggested endpoints:

- `POST /v1/scenes`
  - create or assemble a scene from HomeDesign normalized data
- `POST /v1/scenes/:sceneId/actions`
  - apply camera, object, pose, timeline, or material-related scene actions
- `GET /v1/jobs/:jobId`
  - return job state/result

The browser app reads:

- `VITE_COZYCLAY_BRIDGE_URL`
- `VITE_COZYCLAY_BRIDGE_TOKEN`

Do not place privileged upstream secrets in the browser. The production bridge should use short-lived or restricted credentials, with the central agent/server holding privileged credentials.

## Asset normalization

Minimum asset schema:

- `id`
- `kind`: room | furniture | material | person | vehicle | prop
- `name`
- `sourceUrl`
- `metadata`

Recommended metadata additions for interior work:

- manufacturer
- productCode
- dimensions
- unit
- finish
- color
- materialCategory
- unitPrice
- supplierUrl
- bomId
- maskClass
- replaceable

## Object/BOM mapping

Every scene object created from a commercial/material asset should preserve both:

- `sceneObjectId`
- `bomId`

This allows a selected 3D object to resolve to quantity, specification, supplier, price, and later replacement/inpainting instructions.

## Camera data

Normalize camera requests with:

- shotId
- lensMm
- position
- target
- move
- durationSec

Keep camera data reusable outside CozyClay so the same shot can be passed to downstream image/video models.

## Central-agent state flow

Recommended states:

`READY -> CLAIMED -> CONTEXT_VERIFIED -> SCENE_PLANNED -> SCENE_SUBMITTED -> SCENE_RENDERED -> ASSET_MAPPED -> QA_CHECKED`

On failure:

`FAILED_RETRYABLE` or `WAITING_APPROVAL`

Every transition should store project ID, scene ID, job ID, engine version, source commit/version, and error/ACK detail.

## First implementation slice

1. Keep the current HomeDesign UI untouched.
2. Add bridge contract only.
3. Deploy a separate CozyClay-derived engine later under its own AGPL-compliant repository/service.
4. Build one deterministic test scene: living room + sofa + table + person + two cameras.
5. Verify object IDs, camera data, and BOM IDs survive round-trip.
6. Only after this passes, add a visible 3D/Previs action to the HomeDesign UI.

## Files in this branch

- `services/cozyClayBridge.ts`: front-end bridge contract and request helpers.
- `docs/COZYCLAY_INTEGRATION.md`: architecture, license boundary, workflow, and implementation order.

## Upstream CozyClay areas to preserve when creating the separate engine

Keep and adapt these capabilities rather than rewriting them first:

- `src/camera-block.js`
- `src/camera-follow.js`
- `src/camera-move.js`
- `src/camera-rail-schedule.js`
- `src/cuts.js`
- `src/asset-shelf.js`
- `src/asset-pane.jsx`
- `src/hierarchy-model.js`
- `src/hierarchy-panel.jsx`
- `src/ardy/`
- `src/generation/`
- `mcp/server.mjs`
- `mcp/live-hub.mjs`
- `mcp/runtime/`
- MCP/live verification scripts

Do not begin by modifying the large `src/App.jsx`. First isolate adapters and bridge commands, then make the smallest UI changes after the engine round-trip test passes.
