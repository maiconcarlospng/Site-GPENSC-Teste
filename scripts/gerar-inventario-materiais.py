#!/usr/bin/env python3
"""Cria inventário conservador de materiais efetivamente referenciados.

O inventário NÃO apaga arquivos. Ele habilita a revisão de exclusões no painel,
bloqueando mídias referenciadas por código, conteúdo, dados ou HTML publicado.
Uso: python3 scripts/gerar-inventario-materiais.py [--output CAMINHO]
"""
from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
from urllib.parse import quote, unquote

ROOT = Path(__file__).resolve().parents[1]
TEXT_SUFFIXES = {".qmd", ".r", ".css", ".scss", ".js", ".html", ".yml",
                 ".yaml", ".json", ".md", ".toml", ".py"}
ASSET_SUFFIXES = {".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif",
                  ".pdf", ".mp3", ".mp4", ".ogg", ".avif", ".ico"}
SKIP_DIRS = {".git", ".github", "node_modules", ".quarto", "_freeze",
             "__pycache__", ".venv"}
SKIP_FILES = {"static-media-references.js"}


def paths_to_scan(root: Path, include_built: bool):
    for item in root.rglob("*"):
        if not item.is_file() or item.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if any(part in SKIP_DIRS for part in item.relative_to(root).parts):
            continue
        if not include_built and "_site" in item.relative_to(root).parts:
            continue
        if item.name in SKIP_FILES:
            continue
        # Generated markdown is source too; bibliography/documentation is
        # intentionally included to avoid deleting images linked externally.
        yield item


def make_index():
    media = {}
    for directory in (ROOT / "img", ROOT / "_site" / "img"):
        if not directory.is_dir():
            continue
        for item in directory.rglob("*"):
            if item.is_file() and item.suffix.lower() in ASSET_SUFFIXES:
                media["img/" + item.relative_to(directory).as_posix()] = item

    chunks = []
    scanned = 0
    for file in paths_to_scan(ROOT, include_built=True):
        try:
            if file.stat().st_size > 4_000_000:
                continue
            content = file.read_text(encoding="utf-8", errors="replace")
            chunks.append(content)
            scanned += 1
        except (OSError, UnicodeError):
            pass
    source = html.unescape("\n".join(chunks))
    matched, uncertain = [], []
    for path in sorted(media):
        filename = path.rsplit("/", 1)[-1]
        forms = {path, unquote(path), quote(path, safe="/"), path.replace(" ", "%20")}
        if any(form in source for form in forms):
            matched.append(path)
        elif len(filename) >= 10 and filename in source:
            # The site may build img/ prefixes dynamically; filename matches
            # are kept as links, conservatively.
            matched.append(path)
        else:
            uncertain.append(path)

    # Brand/navigation assets used by scripts can be built via prefixes.
    for path in list(uncertain):
        filename = path.rsplit("/", 1)[-1].lower()
        if filename.startswith(("logo_", "ufop-logo", "favicon")):
            uncertain.remove(path)
            matched.append(path)
    return sorted(set(matched)), uncertain, scanned, len(media)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="admin/static-media-references.js")
    args = parser.parse_args()
    used, unlinked, scanned, total = make_index()
    destination = ROOT / args.output
    destination.parent.mkdir(parents=True, exist_ok=True)
    payload = (
        "/* Inventário gerado no build: vínculos estáticos e dinâmicos publicados.\n"
        "   Arquivos sem vínculo DETECTADO não são excluídos automaticamente. */\n"
        "window.GPENSC_STATIC_MEDIA_REFERENCES = new Set("
        + json.dumps(used, ensure_ascii=False, separators=(",", ":"))
        + ");\n"
    )
    destination.write_text(payload, encoding="utf-8")
    print(f"Inventário: {len(used)}/{total} materiais vinculados "
          f"em {scanned} fontes; {len(unlinked)} sem referência literal. "
          "Exclusões exigem revisão no painel.")


if __name__ == "__main__":
    main()
