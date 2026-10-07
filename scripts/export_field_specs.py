#!/usr/bin/env python3
"""
Export canonical field specifications from apps/web/src/config/featureSchema.ts
to apps/api/app/extraction/field_specs.json.
"""

import json
from pathlib import Path
import re

ROOT_DIR = Path(__file__).resolve().parent.parent
TS_SCHEMA_PATH = ROOT_DIR / "apps" / "web" / "src" / "config" / "featureSchema.ts"
OUTPUT_PATH = ROOT_DIR / "apps" / "api" / "app" / "extraction" / "field_specs.json"

def export_field_specs():
    assert TS_SCHEMA_PATH.exists(), f"Schema file not found at {TS_SCHEMA_PATH}"
    with open(TS_SCHEMA_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    entries = re.split(r'\n\s*\{\s*\n\s*key:', content)
    field_specs = []

    for entry in entries[1:]:
        entry = 'key:' + entry
        
        key_m = re.search(r"key:\s*['\"]([^'\"]+)['\"]", entry)
        label_m = re.search(r"label:\s*['\"]([^'\"]+)['\"]", entry)
        section_m = re.search(r"section:\s*['\"]([^'\"]+)['\"]", entry)
        type_m = re.search(r"type:\s*['\"]([^'\"]+)['\"]", entry)
        unit_m = re.search(r"unit:\s*['\"]([^'\"]*)['\"]", entry)
        min_m = re.search(r"min:\s*([0-9.]+)", entry)
        max_m = re.search(r"max:\s*([0-9.]+)", entry)
        
        opts_m = re.findall(r"value:\s*['\"]([^'\"]+)['\"],\s*label:\s*['\"]([^'\"]+)['\"]", entry)
        
        assert key_m and label_m and section_m and type_m, f"Malformed entry: {entry[:100]}"
        
        key = key_m.group(1)
        label = label_m.group(1)
        section = section_m.group(1)
        ftype = type_m.group(1)
        unit = unit_m.group(1) if unit_m else ""
        min_val = float(min_m.group(1)) if min_m else None
        max_val = float(max_m.group(1)) if max_m else None
        allowed_values = [val for val, _ in opts_m] if opts_m else None

        field_specs.append({
            "key": key,
            "label": label,
            "section": section,
            "type": ftype,
            "unit": unit,
            "min": min_val,
            "max": max_val,
            "allowed_values": allowed_values,
        })

    assert len(field_specs) == 55, f"Expected 55 fields, got {len(field_specs)}"

    # Ensure output directory exists
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(field_specs, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Successfully exported {len(field_specs)} field specifications to {OUTPUT_PATH}")

if __name__ == "__main__":
    export_field_specs()
