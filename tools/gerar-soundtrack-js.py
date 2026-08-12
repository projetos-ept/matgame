#!/usr/bin/env python3
"""Empacota os MIDI como base64 para reprodução Web Audio também via file://."""
from base64 import b64encode
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
PASTA = ROOT / "assets" / "audio" / "soundtrack"
DESTINO = ROOT / "banco" / "soundtrack.js"
ARQUIVOS = ["NinjaForest.mid", "T_SoldierBlade_Track03.mid", "Zone1-MG.mid", "City_Hunter_Level_1.mid", "salalvl2.mid"]

dados = {}
for nome in ARQUIVOS:
    caminho = PASTA / nome
    if caminho.exists():
        dados[nome] = b64encode(caminho.read_bytes()).decode("ascii")

DESTINO.write_text(
    "// Gerado por tools/gerar-soundtrack-js.py. Não edite manualmente.\n"
    f"window.MatGameSoundtrackData = {json.dumps(dados, separators=(',', ':'))};\n",
    encoding="utf-8",
)
print(f"Gerado: {DESTINO.relative_to(ROOT)} ({len(dados)}/{len(ARQUIVOS)} trilhas)")
