#!/usr/bin/env python3
"""Safe file probe for CentralAgent interior asset intake.

This module identifies common public container signatures and records hashes/metadata.
It intentionally does NOT reverse-engineer proprietary SKP or D5 .drs binary formats.
SKP structure is supplied by the SketchUp Ruby/Desktop SDK manifest exporter; D5
structure is supplied by complete-project-folder inventory plus exported/synced assets.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
from pathlib import Path
from typing import Any

READ_PREFIX = 65536


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def detect_public_container(prefix: bytes, suffix: str) -> dict[str, Any]:
    suffix = suffix.lower()
    if prefix.startswith(b"\xff\xd8\xff"):
        return {"family": "JPEG", "signature": "FFD8FF", "parse_policy": "PUBLIC_CONTAINER"}
    if prefix.startswith(b"\x89PNG\r\n\x1a\n"):
        return {"family": "PNG", "signature": "89504E470D0A1A0A", "parse_policy": "PUBLIC_CONTAINER"}
    if prefix.startswith(b"RIFF") and prefix[8:12] == b"WAVE":
        return {"family": "WAV", "signature": "RIFF....WAVE", "parse_policy": "PUBLIC_CONTAINER"}
    if len(prefix) >= 12 and prefix[4:8] == b"ftyp":
        return {
            "family": "ISO_BMFF_MP4",
            "signature": "....ftyp",
            "major_brand": prefix[8:12].decode("latin-1", errors="replace"),
            "parse_policy": "PUBLIC_CONTAINER",
        }
    if suffix == ".skp":
        return {
            "family": "SKETCHUP_SKP",
            "signature": prefix[:32].hex(),
            "parse_policy": "FINGERPRINT_ONLY_USE_SKETCHUP_API_MANIFEST",
        }
    if suffix == ".drs":
        return {
            "family": "D5_DRS",
            "signature": prefix[:32].hex(),
            "parse_policy": "FINGERPRINT_ONLY_KEEP_COMPLETE_PROJECT_FOLDER",
        }
    return {"family": "UNKNOWN", "signature": prefix[:16].hex(), "parse_policy": "METADATA_ONLY"}


def inventory_folder(folder: Path) -> dict[str, Any]:
    files: list[dict[str, Any]] = []
    for item in sorted(folder.rglob("*")):
        if not item.is_file():
            continue
        files.append({
            "relative_path": str(item.relative_to(folder)).replace("\\", "/"),
            "suffix": item.suffix.lower(),
            "size_bytes": item.stat().st_size,
        })
    return {"file_count": len(files), "files": files}


def probe_file(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise FileNotFoundError(path)
    prefix = path.read_bytes()[:READ_PREFIX]
    mime, _ = mimetypes.guess_type(path.name)
    return {
        "schema": "CENTRAL_INTERIOR_FILE_PROBE_V1",
        "name": path.name,
        "suffix": path.suffix.lower(),
        "mime_guess": mime or "application/octet-stream",
        "size_bytes": path.stat().st_size,
        "sha256": sha256_file(path),
        "container": detect_public_container(prefix, path.suffix),
    }


def probe_path(path: Path) -> dict[str, Any]:
    if path.is_file():
        result = probe_file(path)
        if path.suffix.lower() == ".drs":
            result["project_folder_policy"] = "PRESERVE_PARENT_FOLDER_COMPLETE"
            result["project_folder_inventory"] = inventory_folder(path.parent)
        return result
    if path.is_dir():
        return {
            "schema": "CENTRAL_INTERIOR_FOLDER_PROBE_V1",
            "name": path.name,
            "project_folder_inventory": inventory_folder(path),
        }
    raise FileNotFoundError(path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    parser.add_argument("--output")
    args = parser.parse_args()
    payload = probe_path(Path(args.path))
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(text, encoding="utf-8")
    else:
        print(text)


if __name__ == "__main__":
    main()
