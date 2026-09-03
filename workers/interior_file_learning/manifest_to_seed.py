#!/usr/bin/env python3
"""Normalize SketchUp/D5 proxy manifests into CentralAgent reusable interior seeds."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

OUTPUT_TYPES = [
    "perspective_images",
    "isometric_images",
    "walkthrough_video_plan",
    "estimate",
    "material_list",
    "finish_schedule",
    "material_board",
    "construction_schedule",
]


def _list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def normalize_skp_manifest(data: dict[str, Any], project_id: str) -> dict[str, Any]:
    return {
        "seed_schema": "INTERIOR_SKP_PROXY_SEED_V2",
        "project_id": project_id,
        "source_type": "SKP_API_MANIFEST",
        "source": {"model_path": data.get("model_path"), "title": data.get("title")},
        "geometry": {
            "bounds": data.get("model_bounds", {}),
            "units": data.get("units_options", {}),
            "entity_summary": data.get("entities", {}),
        },
        "components": _list(data.get("component_definitions")),
        "materials": _list(data.get("materials")),
        "tags": _list(data.get("tags")),
        "scenes": _list(data.get("scenes")),
        "active_camera": data.get("active_camera", {}),
        "hard_constraints": {
            "preserve_units": True,
            "preserve_envelope": True,
            "style_must_not_override_dimensions": True,
        },
        "supported_outputs": OUTPUT_TYPES,
    }


def normalize_d5_manifest(data: dict[str, Any], project_id: str) -> dict[str, Any]:
    inventory = data.get("project_folder_inventory", {})
    files = _list(inventory.get("files"))
    render_refs = [f for f in files if str(f.get("suffix", "")).lower() in {".png", ".jpg", ".jpeg", ".mp4", ".mov"}]
    source_refs = [f for f in files if str(f.get("suffix", "")).lower() in {".skp", ".fbx", ".d5a", ".3dm", ".abc"}]
    return {
        "seed_schema": "INTERIOR_D5_PROXY_SEED_V1",
        "project_id": project_id,
        "source_type": "D5_PROJECT_FOLDER_PROXY",
        "project_folder_policy": "PRESERVE_COMPLETE_FOLDER",
        "inventory": {"file_count": inventory.get("file_count", len(files)), "files": files},
        "source_model_refs": source_refs,
        "render_media_refs": render_refs,
        "semantic_slots": {
            "cameras": data.get("cameras", []),
            "scenes": data.get("scenes", []),
            "materials": data.get("materials", []),
            "lighting": data.get("lighting", []),
            "environment": data.get("environment", {}),
        },
        "supported_outputs": ["perspective_images", "walkthrough_video_plan", "material_board"],
        "limitations": ["No unsupported .drs binary decoding", "Use complete project folder and official D5/LiveSync/export evidence"],
    }


def build_plan_package_seed(project_id: str, plan: dict[str, Any], skp_seed: dict[str, Any] | None = None,
                            d5_seed: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "seed_schema": "INTERIOR_PLAN_FULL_PACKAGE_SEED_V1",
        "project_id": project_id,
        "input": {
            "floorplan": plan,
            "skp_proxy": skp_seed or {},
            "d5_proxy": d5_seed or {},
        },
        "spatial_truth": {
            "rooms": plan.get("rooms", []),
            "walls": plan.get("walls", []),
            "openings": plan.get("openings", []),
            "fixed_points": plan.get("fixed_points", []),
            "dimensions": plan.get("dimensions", {}),
            "ceiling_height_mm": plan.get("ceiling_height_mm"),
        },
        "design_slots": {
            "style": plan.get("style"),
            "budget": plan.get("budget"),
            "materials": (skp_seed or {}).get("materials", []),
            "components": (skp_seed or {}).get("components", []),
            "camera_candidates": (skp_seed or {}).get("scenes", []),
            "render_references": (d5_seed or {}).get("render_media_refs", []),
        },
        "quantity_basis": {
            "floor_area": plan.get("floor_area"),
            "wall_lengths": plan.get("wall_lengths", []),
            "ceiling_area": plan.get("ceiling_area"),
            "opening_deductions": plan.get("opening_deductions", []),
            "measurement_confidence": plan.get("measurement_confidence", "QA_REQUIRED"),
        },
        "output_contract": {name: {"status": "READY_TO_TEMPLATE", "evidence_required": True} for name in OUTPUT_TYPES},
        "qa": {
            "dimension_gate": "REQUIRED",
            "collision_clearance_gate": "REQUIRED",
            "estimate_quantity_lineage": "REQUIRED",
            "material_rights_lineage": "REQUIRED",
            "drive_readback": "X2_BEFORE_PROMOTION",
        },
    }


def load_json(path: str | None) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8")) if path else {}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--plan", required=True)
    parser.add_argument("--skp-manifest")
    parser.add_argument("--d5-probe")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    skp = normalize_skp_manifest(load_json(args.skp_manifest), args.project_id) if args.skp_manifest else None
    d5 = normalize_d5_manifest(load_json(args.d5_probe), args.project_id) if args.d5_probe else None
    payload = build_plan_package_seed(args.project_id, load_json(args.plan), skp, d5)
    Path(args.output).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
