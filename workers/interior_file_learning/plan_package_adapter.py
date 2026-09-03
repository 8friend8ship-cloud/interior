#!/usr/bin/env python3
"""Build an Interior full-package seed from canonical SKP + D5 + floorplan evidence.

Canonical SketchUp extraction/learning lives in 8friend8ship-cloud/Analyzer-12.09:
  - sketchup/ruby/central_skp_manifest_exporter.rb
  - python/central_skp_seed_builder.py

This adapter does not parse raw SKP geometry. It consumes SKP_SEED_BUNDLE_V1 and
optionally D5 project/resource evidence, then points each output branch at the
existing SKP_OUTPUT_TEMPLATE contracts in 01_MASTER_REGISTRY.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

OUTPUT_TEMPLATES = {
    "normalized_floorplan": "SKPTPL_FLOORPLAN_V1",
    "perspective_images": "SKPTPL_PERSPECTIVE_V1",
    "isometric_images": "SKPTPL_ISOMETRIC_V1",
    "walkthrough_video_plan": "SKPTPL_VIDEO_SCENE_V1",
    "estimate": "SKPTPL_ESTIMATE_V1",
    "material_list": "SKPTPL_MATERIAL_LIST_V1",
    "finish_schedule": "SKPTPL_FINISH_LIST_V1",
    "material_board": "SKPTPL_MATERIAL_BOARD_V1",
    "construction_schedule": "SKPTPL_SCHEDULE_V1",
    "client_proposal": "SKPTPL_CLIENT_PROPOSAL_V1",
}


def load_json(path: str | None) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8")) if path else {}


def _list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def canonical_skp_bridge(bundle: dict[str, Any]) -> dict[str, Any]:
    if not bundle:
        return {}
    schema = bundle.get("schema_version")
    if schema != "SKP_SEED_BUNDLE_V1":
        return {
            "status": "SKP_BUNDLE_SCHEMA_REVIEW",
            "schema_version": schema,
            "raw_bundle": bundle,
        }

    seeds = _list(bundle.get("seeds"))
    materials = [s for s in seeds if s.get("seed_type") == "MATERIAL"]
    components = [s for s in seeds if s.get("seed_type") == "FURNITURE_COMPONENT"]
    scenes = [s for s in seeds if s.get("seed_type") == "SCENE_CAMERA"]
    return {
        "status": "CANONICAL_SKP_BUNDLE_ACCEPTED",
        "schema_version": schema,
        "model_id": bundle.get("model_id"),
        "manifest_qa": bundle.get("manifest_qa", {}),
        "space_seed": bundle.get("space_seed", {}),
        "materials": materials,
        "components": components,
        "scenes": scenes,
        "estimate_rules": bundle.get("estimate_rules", {}),
        "prompt_bundle": bundle.get("prompt_bundle", {}),
        "promotion_gate": bundle.get("promotion_gate", {}),
    }


def normalize_d5_evidence(data: dict[str, Any]) -> dict[str, Any]:
    if not data:
        return {}

    inventory = data.get("project_folder_inventory") or data.get("inventory") or {}
    files = _list(inventory.get("files"))
    has_drs = any(str(f.get("suffix", "")).lower() == ".drs" for f in files)
    resource_summary = data.get("resource_summary") or {}

    if has_drs or data.get("source_type") == "D5_PROJECT_FOLDER_PROXY":
        render_refs = [
            f for f in files
            if str(f.get("suffix", "")).lower() in {".png", ".jpg", ".jpeg", ".mp4", ".mov"}
        ]
        source_refs = [
            f for f in files
            if str(f.get("suffix", "")).lower() in {".skp", ".fbx", ".d5a", ".3dm", ".abc"}
        ]
        return {
            "mode": "D5_PROJECT_FOLDER_PROXY",
            "geometry_truth": False,
            "complete_folder_required": True,
            "inventory": inventory,
            "render_media_refs": render_refs,
            "source_model_refs": source_refs,
            "semantic_slots": data.get("semantic_slots", {}),
            "rule": "D5 render evidence may support visuals; geometry truth remains floorplan/SKP source.",
        }

    return {
        "mode": "D5_WORKSPACE_RESOURCE_PROXY",
        "geometry_truth": False,
        "complete_folder_required": False,
        "resource_summary": resource_summary,
        "resource_refs": data.get("resource_refs", files),
        "rule": "D5 workspace cache is material/asset/render-reference evidence only; never infer project geometry.",
    }


def build_full_package(
    project_id: str,
    floorplan: dict[str, Any],
    skp_bundle: dict[str, Any] | None = None,
    d5_evidence: dict[str, Any] | None = None,
) -> dict[str, Any]:
    skp = canonical_skp_bridge(skp_bundle or {})
    d5 = normalize_d5_evidence(d5_evidence or {})

    floorplan_dimensions = floorplan.get("dimensions", {})
    skp_hard = (skp.get("space_seed") or {}).get("hard_constraints", {})
    measurement_confidence = floorplan.get("measurement_confidence", "QA_REQUIRED")

    outputs = {
        name: {
            "template_id": template_id,
            "status": "READY_TO_TEMPLATE",
            "evidence_required": True,
        }
        for name, template_id in OUTPUT_TEMPLATES.items()
    }

    return {
        "schema_version": "INTERIOR_PLAN_FULL_PACKAGE_SEED_V2",
        "project_id": project_id,
        "canonical_sources": {
            "skp_repo": "8friend8ship-cloud/Analyzer-12.09",
            "skp_manifest_schema": "SKP_MODEL_MANIFEST_V1",
            "skp_seed_schema": "SKP_SEED_BUNDLE_V1",
            "template_registry": "01_MASTER_REGISTRY/SKP_OUTPUT_TEMPLATE",
        },
        "input": {
            "floorplan": floorplan,
            "skp": skp,
            "d5": d5,
        },
        "spatial_truth": {
            "rooms": floorplan.get("rooms", []),
            "walls": floorplan.get("walls", []),
            "openings": floorplan.get("openings", []),
            "fixed_points": floorplan.get("fixed_points", []),
            "dimensions": floorplan_dimensions,
            "ceiling_height_mm": floorplan.get("ceiling_height_mm"),
            "skp_hard_constraints": skp_hard,
            "truth_priority": ["VERIFIED_FLOORPLAN_DIMENSIONS", "NATIVE_SKP_GEOMETRY", "D5_VISUAL_REFERENCE_ONLY"],
        },
        "design_support": {
            "style": floorplan.get("style"),
            "budget": floorplan.get("budget"),
            "skp_material_seeds": skp.get("materials", []),
            "skp_component_seeds": skp.get("components", []),
            "skp_scene_seeds": skp.get("scenes", []),
            "d5_mode": d5.get("mode"),
            "d5_render_media_refs": d5.get("render_media_refs", []),
            "d5_resource_refs": d5.get("resource_refs", []),
        },
        "quantity_basis": {
            "floor_area": floorplan.get("floor_area"),
            "wall_lengths": floorplan.get("wall_lengths", []),
            "ceiling_area": floorplan.get("ceiling_area"),
            "opening_deductions": floorplan.get("opening_deductions", []),
            "skp_estimate_rules": skp.get("estimate_rules", {}),
            "measurement_confidence": measurement_confidence,
            "no_invented_dimensions": True,
            "no_llm_price_guess": True,
        },
        "output_contract": outputs,
        "qa": {
            "dimension_gate": "REQUIRED",
            "unit_gate": "REQUIRED",
            "opening_fixed_point_gate": "REQUIRED",
            "collision_clearance_gate": "REQUIRED",
            "estimate_quantity_lineage": "REQUIRED",
            "material_rights_lineage": "REQUIRED",
            "d5_geometry_inference": "FORBIDDEN",
            "drive_readback": "X2_BEFORE_PROMOTION",
            "failed_branch_only_retry": True,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--floorplan", required=True)
    parser.add_argument("--skp-seed-bundle")
    parser.add_argument("--d5-evidence")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    payload = build_full_package(
        project_id=args.project_id,
        floorplan=load_json(args.floorplan),
        skp_bundle=load_json(args.skp_seed_bundle),
        d5_evidence=load_json(args.d5_evidence),
    )
    Path(args.output).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
