"""Validação leve do acervo importado, separada dos cadastros institucionais."""
from __future__ import annotations

from datetime import date
from pathlib import Path
from urllib.parse import urlsplit
import json
import re
import sys
import yaml

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "data/configuracoes/13-acervo-instagram.yml"
DIRECTORY = ROOT / "data/instagram"


def fail(message: str) -> None:
    raise SystemExit("Acervo Instagram inválido: " + message)


config = yaml.safe_load(CONFIG.read_text(encoding="utf-8")) if CONFIG.exists() else {}
enabled = bool((config or {}).get("mostrar_acervo_instagram", False))
files = sorted(DIRECTORY.glob("registros-*.json")) if DIRECTORY.exists() else []
if not enabled and not files:
    print("Acervo desativado e sem arquivos: nenhum registro a validar.")
    sys.exit(0)
if enabled and len(files) != 7:
    fail(f"acervo ativado, mas foram localizados {len(files)} dos 7 lotes esperados")

seen: set[str] = set()
count = 0
for path in files:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        fail(f"{path.name} precisa conter uma lista")
    for post in data:
        if not isinstance(post, dict):
            fail(f"{path.name} contém registro malformado")
        shortcode = post.get("id")
        url = post.get("url", "")
        when = post.get("data", "")
        if not shortcode or not isinstance(shortcode, str):
            fail(f"registro sem identificador em {path.name}")
        if shortcode in seen:
            fail(f"publicação repetida: {shortcode}")
        seen.add(shortcode)
        if not post.get("tema") or not post.get("titulo") or not post.get("categoria"):
            fail(f"metadados de classificação ausentes em {shortcode}")
        if not isinstance(url, str) or urlsplit(url).hostname not in {"www.instagram.com", "instagram.com"}:
            fail(f"URL de origem inválida em {shortcode}")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(when)):
            fail(f"data inválida em {shortcode}")
        try:
            date.fromisoformat(when)
        except ValueError:
            fail(f"data inexistente em {shortcode}")
        count += 1
print(f"Acervo Instagram válido: {count} publicações distintas em {len(files)} lotes. Exibição {'ligada' if enabled else 'desligada'}.")
