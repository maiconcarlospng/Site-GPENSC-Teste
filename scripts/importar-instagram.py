"""Importa a janela recente do perfil público; dados externos nunca são executados."""
import datetime as dt
import io
import json
import os
import re
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

import yaml
from PIL import Image, ImageOps

PROFILE = "gpenscufop"
NEWS = Path("data/noticias.yml")
COVERS = Path("img/instagram-acervo")
CODE = re.compile(r"instagram\.com/(?:p|reels?|tv)/([\w-]+)")


def known_codes():
    known = set()
    for path in Path("data").glob("*.yml"):
        known.update(CODE.findall(path.read_text()))
    for path in Path("data/instagram").glob("registros-*.json"):
        known.update(row["id"] for row in json.loads(path.read_text()))
    return known


def editorial(caption, date):
    text = re.sub(r"^[\W_]*(?:olá|oi)[, ]+pessoal\b[\W_]*", "", caption, flags=re.I).strip()
    pieces = [s.strip(" .") for s in re.split(r"\n+|(?<=[!?])\s+|(?<=\.)\s+(?=[A-ZÀ-Ú])", text) if s.strip(" .")]
    first = pieces[0] if pieces else text
    quoted = re.search(r'[“"]([^”"\n]{8,80})[”"]', text[:500])
    if quoted:
        title = quoted[1]
    elif 5 <= len(first) <= 85:
        title = first
    else:
        subject = re.search(r"\b(defesa de (?:mestrado|doutorado)|qualificação|workshop|curso|oficina|podcast|palestra|seminário|projeto|pesquisa)\b", text, re.I)
        title = (subject[0].capitalize() if subject else "Notícia do GPENSC") + " · " + date
    body = text
    if title == first and len(pieces) > 1:
        body = text[text.index(first) + len(first):].lstrip(" .!?\n")
    summary = next((s for s in pieces if len(s) > 12 and title.casefold() not in s.casefold()), "")
    if len(summary) > 240:
        summary = summary[:237].rsplit(" ", 1)[0] + "…"
    category = "Institucional"
    for label, pattern in [("Multimídia", r"podcast|gpensc no ar"), ("Extensão", r"projeto de extensão|vi no rótulo"), ("Ensino", r"workshop|curso|oficina|aula aberta"), ("Pesquisa", r"artigo|estudo|pesquisa|defesa|qualificação")]:
        if re.search(pattern, text[:420], re.I):
            category = label
            break
    return title, summary, body, category


def original_cover(row, code):
    url = row["displayUrl"]
    host = urlsplit(url)
    if host.scheme != "https" or not (host.hostname or "").endswith((".cdninstagram.com", ".fbcdn.net")):
        raise ValueError("Origem da capa inesperada para " + code)
    with urlopen(url, timeout=40) as response:
        data = response.read(16 * 1024 * 1024 + 1)
    if len(data) > 16 * 1024 * 1024:
        raise ValueError("Capa muito grande: " + code)
    COVERS.mkdir(parents=True, exist_ok=True)
    path = COVERS / (code + ".webp")
    with Image.open(io.BytesIO(data)) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        image.thumbnail((900, 900))
        image.save(path, "WEBP", quality=82)
    return path.as_posix()


def integrate(rows):
    known = known_codes()
    if not isinstance(rows, list) or not rows:
        raise ValueError("Coleta vazia. Confira o perfil e o histórico no Apify.")
    additions = []
    for row in rows:
        if row.get("error"):
            raise ValueError("O Apify informou erro na coleta.")
        code = row["shortCode"]
        if row.get("ownerUsername", "").lower() != PROFILE or code in known:
            continue
        if not re.fullmatch(r"[A-Za-z0-9_-]+", code):
            raise ValueError("Código de post inválido")
        date = dt.datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00")).astimezone(ZoneInfo("America/Sao_Paulo")).date().isoformat()
        title, summary, body, category = editorial(row.get("caption") or "", date)
        additions.append(dict(data=date, categoria=category, titulo=title, resumo=summary, conteudo=body, url=f"https://www.instagram.com/p/{code}/", imagem=original_cover(row, code)))
        known.add(code)
    if additions:
        source = NEWS.read_text().rstrip() + "\n"
        for item in additions:
            for i, (key, value) in enumerate(item.items()):
                source += ("  - " if i == 0 else "    ") + key + ": " + json.dumps(value, ensure_ascii=False) + "\n"
        yaml.safe_load(source)
        NEWS.write_text(source)
    print(f"{len(additions)} novos registros.")


if __name__ == "__main__":
    request = Request("https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items", data=json.dumps({"directUrls": ["https://www.instagram.com/" + PROFILE + "/"], "resultsType": "posts", "resultsLimit": int(os.getenv("POST_LIMIT", "50"))}).encode(), headers={"Content-Type": "application/json", "Authorization": "Bearer " + os.environ["APIFY_TOKEN"]})
    with urlopen(request, timeout=330) as response:
        integrate(json.load(response))
