#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_field_specs import export_field_specs

if __name__ == "__main__":
    export_field_specs()
