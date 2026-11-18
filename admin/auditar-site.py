#!/usr/bin/env python3
"""Revisão estática do site GPENSC: páginas, links e recursos locais.

Não substitui testes de interface em navegador.
"""
from __future__ import annotations

from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys
import yaml

ROOT = Path(__file__).resolve().parents[1]
PAGES = sorted(ROOT.glob("*.qmd")) + sorted((ROOT / "partials").glob("*.qmd"))
APP = ROOT / "admin" / "app.html"
QUARTO = ROOT / "_quarto.yml"

HTML_LOCAL = re.compile(r"""(?:href|src)\s*=\s*["']([^"']+)["']""", re.IGNORECASE)
MARKDOWN_LINK = re.compile(r"""\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)""")
SKIP = ("#", "mailto:", "tel:", "https:", "http:", "//", "data:",
        "javascript:", "{{", "$")
errors: list[str] = []


def resolve_link(source: Path, value: str) -> Path | None:
    raw = value.strip()
    if not raw or raw.startswith(SKIP):
        return None
    try:
        parsed = urlsplit(raw)
    except ValueError:
        return None
    if parsed.scheme or not parsed.path:
        return None
    path = unquote(parsed.path)
    base = ROOT if source.parent.name == "partials" else source.parent
    target = ROOT / path.lstrip("/") if path.startswith("/") else base / path
    if target.suffix.lower() == ".html":
        qmd = target.with_suffix(".qmd")
        if qmd.is_file():
            return qmd
    return target


def check(path: Path, text: str) -> int:
    refs = list(HTML_LOCAL.findall(text))
    if path.suffix.lower() == ".qmd":
        refs += MARKDOWN_LINK.findall(text)
    found = set()
    for raw in refs:
        if raw in found:
            continue
        found.add(raw)
        target = resolve_link(path, raw)
        if target is None:
            continue
        try:
            target.resolve().relative_to(ROOT.resolve())
        except ValueError:
            errors.append(f"{path.relative_to(ROOT)}: caminho fora do repositório: {raw}")
            continue
        if not target.is_file() and not target.is_dir():
            errors.append(f"{path.relative_to(ROOT)}: referência não encontrada: {raw}")
    return len(found)


def check_repeated_page_title(path: Path, content: str) -> None:
    """Evita repetir como H2 o mesmo título H1 gerado pelo Quarto."""
    if path.parent != ROOT:
        return
    match = re.match(r"\A---[ \t]*\n(.*?)\n---[ \t]*\n", content, flags=re.S)
    if not match:
        return
    try:
        metadata = yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError:
        return  # O validador de configuração já identifica YAML inválido.
    title = str(metadata.get("title") or "").strip().casefold()
    if not title:
        return
    body = content[match.end():]
    for heading in re.findall(r"^##[ \t]+([^\n]+)$", body, flags=re.M):
        normalized = re.sub(r"[ \t]*\{[^}]*\}[ \t]*$", "", heading).strip().casefold()
        if normalized == title:
            errors.append(
                f"{path.name}: título repetido como subtítulo H2: {heading}. "
                "Preserve o H1 e transfira a âncora para o início do conteúdo."
            )


def main() -> None:
    if len(PAGES) < 20:
        errors.append("Número inesperadamente pequeno de páginas QMD.")
    home = (ROOT / "index.qmd").read_text(encoding="utf-8")
    # A página inicial pode não exibir projetos: a vitrine foi removida
    # intencionalmente para concentrar as iniciativas em Extensão.
    # Rejeitar apenas o retorno acidental de componentes antigos.
    if ('class = "gp-home-projects"' in home or
            'class = "gp-initiatives"' in home or
            '<section class="gp-home-projects"' in home or
            '<section class="gp-initiatives"' in home):
        errors.append("index.qmd: vitrine antiga de projetos; mantenha os projetos em Extensão.")
    checked = 0
    for path in PAGES:
        content = path.read_text(encoding="utf-8")
        if path.parent == ROOT and not content.startswith("---\n"):
            errors.append(f"{path.name}: metadados YAML ausentes na abertura.")
        check_repeated_page_title(path, content)
        checked += check(path, content)
    config = yaml.safe_load(QUARTO.read_text(encoding="utf-8"))
    css = config.get("format", {}).get("html", {}).get("css", [])
    for filename in css:
        if not (ROOT / str(filename)).is_file():
            errors.append(f"_quarto.yml: CSS inexistente: {filename}")
    for key in ("include-after-body", "include-in-header"):
        name = config.get("format", {}).get("html", {}).get(key)
        if name and not (ROOT / name).is_file():
            errors.append(f"_quarto.yml: {key} inexistente: {name}")
    checked += check(APP, APP.read_text(encoding="utf-8"))
    for required in ("admin/app.js", "admin/app-melhorias.css",
                     "js/arvore-interativa.js", "js/galeria-sobre.js",
                     "styles.css", "js/arvore.js"):
        if not (ROOT / required).is_file():
            errors.append(f"Arquivo obrigatório ausente: {required}")
    if errors:
        print("\n".join("ERRO " + m for m in errors), file=sys.stderr)
        raise SystemExit(f"Auditoria reprovada com {len(errors)} problema(s).")
    print(f"Auditoria estática aprovada: {len(PAGES)} páginas, "
          f"{checked} referências locais candidatas e {len(css)} arquivos CSS.")


if __name__ == "__main__":
    main()
