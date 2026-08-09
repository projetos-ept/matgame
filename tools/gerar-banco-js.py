#!/usr/bin/env python3
"""Gera a cópia JavaScript do banco JSON para permitir execução via file://."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "banco" / "conteudo.json"
target = ROOT / "banco" / "conteudo.js"
data = json.loads(source.read_text(encoding="utf-8"))
serialized = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
target.write_text(
    "// Gerado por tools/gerar-banco-js.py. Edite conteudo.json, não este arquivo.\n"
    f"window.MatGameContent = {serialized};\n",
    encoding="utf-8",
)
print(f"Gerado: {target.relative_to(ROOT)} ({target.stat().st_size} bytes)")
