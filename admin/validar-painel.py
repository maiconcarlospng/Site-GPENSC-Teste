#!/usr/bin/env python3
"""Validação preventiva da configuração e dos recursos do painel Sveltia."""

from __future__ import annotations

import html.parser
from datetime import date
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
ADMIN = ROOT / "admin"
CONFIG_PATH = ADMIN / "config.yml"
CMS_PATH = ADMIN / "cms.html"
CSS_PATH = ADMIN / "painel.css"
KNOWN_WIDGETS = {
    "string", "text", "markdown", "number", "boolean", "select", "date",
    "datetime", "image", "file", "list", "object", "relation", "hidden",
    "color", "map", "code", "uuid", "keyvalue", "richtext",
    "galeria-multipla-v2",
}


def fail(message: str) -> None:
    print(f"ERRO: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_yaml(path: Path):
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"YAML inválido em {path.relative_to(ROOT)}: {exc}")


def ensure_inside_root(path: Path, context: str) -> None:
    try:
        path.resolve().relative_to(ROOT.resolve())
    except ValueError:
        fail(f"Caminho fora do repositório em {context}: {path}")


def inspect_fields(fields, context: str) -> None:
    if fields is None:
        return
    if not isinstance(fields, list):
        fail(f"'fields' precisa ser uma lista em {context}.")
    names = set()
    for field in fields:
        if not isinstance(field, dict):
            fail(f"Campo malformado em {context}: {field!r}")
        name = field.get("name")
        widget = field.get("widget")
        if not name or not isinstance(name, str):
            fail(f"Campo sem 'name' em {context}: {field!r}")
        if name in names:
            fail(f"Nome de campo duplicado '{name}' em {context}.")
        names.add(name)
        if not widget or not isinstance(widget, str):
            fail(f"Campo '{name}' sem widget em {context}.")
        if widget not in KNOWN_WIDGETS:
            fail(f"Widget desconhecido '{widget}' no campo '{name}' ({context}).")
        pattern = field.get("pattern")
        if pattern is not None:
            if not isinstance(pattern, list) or len(pattern) != 2:
                fail(f"Validação 'pattern' inválida no campo '{name}' ({context}); esperado [regex, mensagem].")
            try:
                re.compile(pattern[0])
            except (TypeError, re.error) as exc:
                fail(f"Regex inválida no campo '{name}' ({context}): {exc}")
        if field.get("fields") is not None:
            inspect_fields(field["fields"], f"{context}.{name}")


def inspect_css(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    stack = []
    pairs = {")": "(", "]": "[", "}": "{"}
    opening = set(pairs.values())
    quote = None
    escaped = False
    comment = False
    i = 0
    while i < len(text):
        char = text[i]
        nxt = text[i + 1] if i + 1 < len(text) else ""
        if comment:
            if char == "*" and nxt == "/":
                comment = False
                i += 2
                continue
            i += 1
            continue
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            i += 1
            continue
        if char == "/" and nxt == "*":
            comment = True
            i += 2
            continue
        if char in ("'", '"'):
            quote = char
        elif char in opening:
            stack.append((char, i))
        elif char in pairs:
            if not stack or stack[-1][0] != pairs[char]:
                fail(f"CSS com delimitadores inválidos em {path.relative_to(ROOT)} perto do caractere {i}.")
            stack.pop()
        i += 1
    if comment or quote or stack:
        fail(f"CSS incompleto ou sem fechamento em {path.relative_to(ROOT)}.")


class InlineScriptParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.current = None
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "script":
            attributes = dict(attrs)
            self.current = [] if not attributes.get("src") else None

    def handle_data(self, data):
        if self.current is not None:
            self.current.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "script":
            if self.current is not None and "".join(self.current).strip():
                self.scripts.append("".join(self.current))
            self.current = None



def validate_data_against_fields(data, fields, context: str) -> None:
    """Garante que o editor não deixe de oferecer campos já existentes nos YAML."""
    if not isinstance(data, dict):
        fail(f"O conteúdo de {context} deve ser um objeto YAML.")
    schema = {field["name"]: field for field in fields or []}
    unknown = sorted(set(data) - set(schema))
    if unknown:
        fail(
            f"Há campos presentes em {context} que não estão configurados no painel: "
            + ", ".join(unknown)
            + ". Ajuste a configuração antes de editar esse arquivo."
        )

    for name, field in schema.items():
        if name not in data:
            continue
        value = data[name]
        widget = field.get("widget")
        pattern = field.get("pattern")
        if pattern and value not in ("", None):
            value_text = value.isoformat() if hasattr(value, "isoformat") else str(value)
            try:
                matches = re.fullmatch(pattern[0], value_text) is not None
            except TypeError as exc:
                fail(f"Regex inválida no campo '{name}' ({context}): {exc}")
            if not matches:
                fail(
                    f"Valor atual não corresponde ao formato do campo '{name}' em {context}: "
                    f"{value_text!r}. Corrija o dado ou ajuste a regra de validação."
                )
            # Regex de data valida o formato, mas não impede datas impossíveis como 31/02.
            if name.lower() in {"data", "date", "data_inicio", "data_fim"} and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value_text):
                try:
                    date.fromisoformat(value_text)
                except ValueError:
                    fail(f"Data inexistente no campo '{name}' em {context}: {value_text!r}.")

        if widget == "list" and value is not None:
            if not isinstance(value, list):
                fail(f"O campo de lista '{name}' não contém uma lista em {context}.")
            child_fields = field.get("fields")
            if child_fields:
                for index, item in enumerate(value, start=1):
                    validate_data_against_fields(item, child_fields, f"{context}.{name}[{index}]")
        elif widget == "object" and value is not None:
            validate_data_against_fields(value, field.get("fields", []), f"{context}.{name}")
        elif widget == "galeria-multipla-v2" and value is not None:
            if not isinstance(value, list):
                fail(f"A galeria em {context}.{name} não contém uma lista.")
            allowed = {"arquivo", "legenda", "foco_x", "foco_y", "zoom"}
            for index, photo in enumerate(value, start=1):
                if not isinstance(photo, dict):
                    fail(f"Foto {index} em {context}.{name} não é um objeto YAML.")
                extra = sorted(set(photo) - allowed)
                if extra:
                    fail(
                        f"Foto {index} em {context}.{name} contém propriedades não suportadas: "
                        + ", ".join(extra)
                    )


def main() -> None:
    for file_path in (CONFIG_PATH, CMS_PATH, CSS_PATH, ADMIN / "galeria-multipla.js"):
        if not file_path.is_file():
            fail(f"Arquivo necessário não encontrado: {file_path.relative_to(ROOT)}")

    config = load_yaml(CONFIG_PATH)
    if not isinstance(config, dict):
        fail("admin/config.yml precisa conter um objeto YAML.")
    logo = config.get("logo", {}).get("src")
    if logo:
        logo_path = (ADMIN / logo).resolve()
        ensure_inside_root(logo_path, "logo do painel")
        if not logo_path.is_file():
            fail(f"Logo do painel não encontrado: {logo}")
    for folder_key in ("media_folder", "public_folder"):
        folder_value = config.get(folder_key)
        if folder_value:
            folder_path = (ROOT / folder_value).resolve()
            ensure_inside_root(folder_path, folder_key)
            if not folder_path.is_dir():
                fail(f"Pasta configurada em '{folder_key}' não encontrada: {folder_value}")

    backend = config.get("backend", {})
    if backend.get("name") != "github" or not backend.get("repo") or not backend.get("branch"):
        fail("Backend do painel incompleto: confira nome, repositório e branch.")
    collections = config.get("collections")
    if not isinstance(collections, list) or not collections:
        fail("Nenhuma coleção válida foi definida no painel.")

    collection_names = set()
    configured_files = set()
    for collection in collections:
        if not isinstance(collection, dict):
            fail(f"Coleção malformada: {collection!r}")
        collection_name = collection.get("name")
        if not collection_name or collection_name in collection_names:
            fail(f"Nome de coleção ausente ou duplicado: {collection_name!r}")
        collection_names.add(collection_name)
        entries = collection.get("files", [])
        if not isinstance(entries, list):
            fail(f"A coleção '{collection_name}' deve conter uma lista 'files'.")
        for entry in entries:
            if not isinstance(entry, dict) or not entry.get("file"):
                fail(f"Registro sem caminho de arquivo na coleção '{collection_name}'.")
            relative = Path(entry["file"])
            target = (ROOT / relative).resolve()
            ensure_inside_root(target, f"coleção {collection_name}")
            if not target.is_file():
                fail(f"A coleção '{collection_name}' aponta para arquivo inexistente: {relative}")
            if str(relative) in configured_files:
                fail(f"O mesmo arquivo está configurado mais de uma vez no painel: {relative}")
            configured_files.add(str(relative))
            data = load_yaml(target)
            if not isinstance(data, dict):
                fail(f"O arquivo de conteúdo {relative} precisa ter um objeto YAML na raiz.")
            inspect_fields(entry.get("fields"), f"{collection_name}.{entry.get('name', relative)}")
            validate_data_against_fields(
                data, entry.get("fields", []), f"{relative}"
            )

    # Detecta erros de sintaxe em todos os YAML de conteúdo consumidos pelo site.
    yaml_paths = {ROOT / "_variables.yml"}
    yaml_paths.update((ROOT / "data").rglob("*.yml"))
    for path in sorted(yaml_paths):
        if path.is_file():
            load_yaml(path)

    inspect_css(CSS_PATH)

    # Impede que marcadores técnicos conhecidos voltem ao conteúdo público.
    placeholder_tokens = ("SEU_ID_AQUI", "[ID-DO-GRUPO]", "[convidado(a) – preencher]")
    for path in sorted(yaml_paths | {CONFIG_PATH}):
        if not path.is_file():
            continue
        source = path.read_text(encoding="utf-8")
        for token in placeholder_tokens:
            if token.casefold() in source.casefold():
                fail(f"Marcador provisório '{token}' encontrado em {path.relative_to(ROOT)}.")

    html_text = CMS_PATH.read_text(encoding="utf-8")
    # Recursos locais do painel precisam existir após a separação dos arquivos.
    for attr, value in re.findall(r"\b(href|src)\s*=\s*['\"]([^'\"]+)['\"]", html_text, flags=re.I):
        value = value.split("#", 1)[0].split("?", 1)[0]
        if not value or value.startswith("//") or re.match(r"^[a-z][a-z0-9+.-]*:", value, flags=re.I):
            continue
        target = (ADMIN / value).resolve()
        ensure_inside_root(target, f"atributo {attr} em admin/cms.html")
        if not target.exists():
            fail(f"Recurso local de admin/cms.html não encontrado: {value}")

    node = shutil.which("node")
    if not node:
        fail("Node.js é necessário para verificar a sintaxe do JavaScript inline.")
    parser = InlineScriptParser()
    parser.feed(html_text)
    with tempfile.TemporaryDirectory(prefix="gpen-cms-check-") as tmp:
        for index, script in enumerate(parser.scripts, start=1):
            script_path = Path(tmp) / f"inline-{index}.js"
            script_path.write_text(script, encoding="utf-8")
            result = subprocess.run([node, "--check", str(script_path)], text=True, capture_output=True)
            if result.returncode:
                fail(f"JavaScript inline #{index} inválido em admin/cms.html:\n{result.stderr.strip()}")

    print(
        "Validação concluída: "
        f"{len(collection_names)} coleções, {len(configured_files)} arquivos de conteúdo, "
        f"{len(yaml_paths)} caminhos YAML candidatos, CSS balanceado e JavaScript inline válido."
    )


if __name__ == "__main__":
    main()
