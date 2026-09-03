import unittest

from plan_package_adapter import build_full_package, normalize_d5_evidence


class PlanPackageAdapterTest(unittest.TestCase):
    def test_canonical_skp_and_workspace_resources_map_to_all_templates(self):
        floorplan = {
            "rooms": [{"id": "KITCHEN"}, {"id": "LIVING"}],
            "walls": [{"id": "W1"}],
            "openings": [{"id": "D1"}],
            "fixed_points": [{"id": "SINK"}],
            "dimensions": {"width_mm": 7200, "depth_mm": 4800},
            "ceiling_height_mm": 2400,
            "floor_area": 34.56,
            "measurement_confidence": "VERIFIED",
            "style": "WARM_MODERN",
            "budget": "MID",
        }
        skp_bundle = {
            "schema_version": "SKP_SEED_BUNDLE_V1",
            "model_id": "SKPMODEL_TEST",
            "manifest_qa": {"pass": True},
            "space_seed": {"hard_constraints": {"unit": "MM", "preserve_geometry": True}},
            "seeds": [
                {"seed_type": "MATERIAL", "seed_id": "MAT_1"},
                {"seed_type": "FURNITURE_COMPONENT", "seed_id": "COMP_1"},
                {"seed_type": "SCENE_CAMERA", "seed_id": "SCENE_1"},
            ],
            "estimate_rules": {"pricing_policy": "VERIFIED_PRICE_BOOK_ONLY", "no_price_guess": True},
            "prompt_bundle": {"image_support": {}, "video_support": {}},
            "promotion_gate": {"seed_registry_allowed": True},
        }
        d5 = {
            "resource_summary": {"d5ax": 60, "d5m": 16, "pak": 8, "pcg": 1},
            "resource_refs": [{"relative_path": "d5m/example.d5m", "hash": "abc"}],
        }

        result = build_full_package("P_TEST", floorplan, skp_bundle, d5)

        self.assertEqual(result["schema_version"], "INTERIOR_PLAN_FULL_PACKAGE_SEED_V2")
        self.assertEqual(result["input"]["skp"]["status"], "CANONICAL_SKP_BUNDLE_ACCEPTED")
        self.assertEqual(result["input"]["d5"]["mode"], "D5_WORKSPACE_RESOURCE_PROXY")
        self.assertFalse(result["input"]["d5"]["geometry_truth"])
        self.assertTrue(result["quantity_basis"]["no_llm_price_guess"])
        self.assertEqual(result["qa"]["d5_geometry_inference"], "FORBIDDEN")
        self.assertEqual(len(result["output_contract"]), 10)
        self.assertEqual(result["output_contract"]["estimate"]["template_id"], "SKPTPL_ESTIMATE_V1")
        self.assertEqual(result["output_contract"]["material_board"]["template_id"], "SKPTPL_MATERIAL_BOARD_V1")

    def test_d5_project_folder_never_becomes_geometry_truth(self):
        d5 = {
            "project_folder_inventory": {
                "files": [
                    {"relative_path": "project.drs", "suffix": ".drs"},
                    {"relative_path": "source/model.skp", "suffix": ".skp"},
                    {"relative_path": "renders/view01.png", "suffix": ".png"},
                ]
            }
        }
        normalized = normalize_d5_evidence(d5)
        self.assertEqual(normalized["mode"], "D5_PROJECT_FOLDER_PROXY")
        self.assertFalse(normalized["geometry_truth"])
        self.assertTrue(normalized["complete_folder_required"])
        self.assertEqual(len(normalized["source_model_refs"]), 1)
        self.assertEqual(len(normalized["render_media_refs"]), 1)


if __name__ == "__main__":
    unittest.main()
