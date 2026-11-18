"""Importa a janela recente do perfil público; dados externos nunca são executados."""
import datetime as dt
import json
import os
import re
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

import yaml

PROFILE = "gpenscufop"
NEWS = Path("data/noticias.yml")
GALLERIES = Path("data/instagram/carrosseis-recentes.json")
CODE = re.compile(r"instagram\.com/(?:p|reels?|tv)/([\w-]+)")


def known_codes():
    known = set()
    for path in Path("data").glob("*.yml"):
        known.update(CODE.findall(path.read_text()))
    for path in Path("data/instagram").glob("registros-*.json"):
        known.update(row["id"] for row in json.loads(path.read_text()))
    return known


def terms(text):
    stop = {"sobre", "para", "como", "pelo", "pela", "hoje", "mais", "gpensc", "neste", "nossa", "nosso"}
    return {w for w in re.findall(r"[^\W\d_]{3,}", text.casefold()) if w not in stop}


def editorial(caption, date):
    text = re.sub(r"^[\W_]*(?:olá|oi)[, ]+pessoal\b[\W_]*", "", caption, flags=re.I).strip()
    clean = re.sub(r"\s*\(@[\w.]+\)|https?://\S+|(?<!\w)@[\w.]+", "", text)
    clean = re.sub(r"\b(Dr|Dra|Dras|Drs|Prof|Profa)\.(?=\s)", r"\1", clean)
    sentences = [s.strip(" .") for s in re.split(r"\n+|(?<=[!?])\s+|(?<=\.)\s+(?=[A-ZÀ-Ú])", clean)]
    sentences = [re.sub(r"^[^\w]+", "", s) for s in sentences if s and not s.startswith("#")]
    sentences = [s for s in sentences if len(terms(s)) >= 2 and not re.match(
        r"(?:arraste|inscreva-se|não perca|saiba mais|acesse o link|confira no link|olá|oi pessoal|atenção!|vem conferir|salve este post)", s, re.I)]

    category = "Institucional"
    for label, pattern in [("Multimídia", r"podcast|gpensc no ar"), ("Extensão", r"projeto de extensão|vi no rótulo"), ("Ensino", r"workshop|curso|oficina|aula aberta"), ("Pesquisa", r"artigo|estudo|pesquisa|defesa|qualificação")]:
        if re.search(pattern, clean[:500], re.I):
            category = label
            break

    titles = []
    defense = re.search(r"(?i:\b(defesa de (?:mestrado|doutorado)|qualificação de (?:mestrado|doutorado)) (?:da?|do) (?:alun[oa] |mestrand[oa] |doutorand[oa] )?)"
                        r"([A-ZÀ-Ú][a-zà-ÿ]+(?: (?:d[aeo]s? |e )?[A-ZÀ-Ú][a-zà-ÿ]+){1,5})", clean)
    if defense:
        titles.append(defense[1].capitalize() + " de " + defense[2])
    for pattern in [r'(?:intitulad[oa]|com o tema|sobre o tema)\s*[:“" ]+([^”"\n]{6,85})[”"]',
                    r'(?:para (?:falar|conversar) sobre|bate-papo sobre|(?:oficina|palestra|curso|workshop) sobre)\s+([^,.!?\n]{5,85})(?=[,.!?\n]|$)',
                    r'[“"]([^”"\n]{8,85})[”"]']:
        match = re.search(pattern, clean, re.I)
        if match:
            titles.append(match[1].strip(' .,'))
    titles.extend(s for s in sentences if len(s) <= 85)
    for title in titles:
        title = title[:1].upper() + title[1:]
        if re.search(r"^(?:quem somos|lembram|destes|desses|são |dos \d|no dia |rádio província|momentos gpensc|novo episódio|os resultados|data:|local:|horário:|saiba |essa |este |ele |ela )|\b(?:disponível|bio|sábado|hoje é dia)\b", title, re.I):
            continue
        keywords = terms(title)
        if len(keywords) < 2 or len(title) > 90 or re.search(r"\b(?:clique|confira|link na bio|vocês|no post de hoje)\b", title, re.I):
            continue
        choices = []
        for i, sentence in enumerate(sentences):
            extra = terms(sentence) - keywords
            if re.search(r"parceria com a rádio|disponível no spotify|no link|arraste para|tbt de hoje|gostou|compartilhe", sentence, re.I) or len(extra) < 2 or len(sentence) > 360 or title.casefold() in sentence.casefold():
                continue
            score = min(len(extra), 8) + 2 * bool(re.search(r"\d|\b(?:estudo|pesquisa|professora?|universidade|UFOP|investigou|avaliou|acontece|participa|recebe)\b", sentence, re.I))
            choices.append((score, -i, sentence))
        if choices:
            summary = max(choices)[2].rstrip(" .!?") + ("?" if max(choices)[2].endswith("?") else ".")
            body = text
            if body.casefold().startswith(title.casefold()) and body[len(title):].startswith((".", "!", "?", "\n")):
                body = body[len(title):].lstrip(" .!?\n") or text
            return title, summary, body, category
    return None


def remote_cover(row):
    """Usa o link HTTPS original; não baixa nem grava imagens no repositório."""
    url = row.get("displayUrl") or ""
    host = urlsplit(url)
    if host.scheme != "https" or not (host.hostname or "").endswith((".cdninstagram.com", ".fbcdn.net")):
        return ""
    return url


def carousel_images(row):
    """Preserva a ordem das imagens do carrossel e valida os hosts de mídia."""
    images = row.get("images") or [
        child.get("displayUrl") for child in (row.get("childPosts") or [])
        if child.get("type") == "Image"
    ]
    valid = []
    for image in images:
        if not isinstance(image, str):
            continue
        host = urlsplit(image)
        if host.scheme == "https" and (host.hostname or "").endswith((".cdninstagram.com", ".fbcdn.net")):
            valid.append(image)
    return valid if len(valid) > 1 else []


def refresh_carousels(rows):
    """Atualiza links recentes sem substituir títulos/resumos já revisados."""
    gallery = json.loads(GALLERIES.read_text(encoding="utf-8")) if GALLERIES.exists() else {}
    if not isinstance(gallery, dict):
        gallery = {}
    before = dict(gallery)
    for row in rows:
        code = row.get("shortCode") or ""
        if row.get("ownerUsername", "").lower() != PROFILE or not re.fullmatch(r"[A-Za-z0-9_-]+", code):
            continue
        images = carousel_images(row)
        if images:
            gallery[code] = images
    if gallery != before or not GALLERIES.exists():
        GALLERIES.parent.mkdir(parents=True, exist_ok=True)
        GALLERIES.write_text(json.dumps(gallery, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(gallery)} carrosséis recentes com links de mídia atualizados.")


def integrate(rows):
    known = known_codes()
    if not isinstance(rows, list) or not rows:
        raise ValueError("Coleta vazia. Confira o perfil e o histórico no Apify.")
    additions = []
    refresh_carousels(rows)
    for row in rows:
        if row.get("error"):
            raise ValueError("O Apify informou erro na coleta.")
        code = row["shortCode"]
        if row.get("ownerUsername", "").lower() != PROFILE or code in known:
            continue
        if not re.fullmatch(r"[A-Za-z0-9_-]+", code):
            raise ValueError("Código de post inválido")
        date = dt.datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00")).astimezone(ZoneInfo("America/Sao_Paulo")).date().isoformat()
        result = editorial(row.get("caption") or "", date)
        if result is None:
            caption = (row.get("caption") or "").strip()
            plain = re.sub(r"\s+", " ", re.sub(r"https?://\S+|@[\w.]+", "", caption)).strip(" .")
            title = plain[:88].rsplit(" ", 1)[0].strip(" .,:;") if plain else f"Registro do GPENSC em {date}"
            summary = (plain[:260].rsplit(" ", 1)[0].rstrip(" .") + ".") if plain else "Publicação visual do GPENSC sem legenda disponível. Consulte o registro original."
            body = caption or summary
            # Classificação conservadora, com aviso de revisão quando título for sugerido.
            if re.search(r"podcast|gpensc no ar|episódio", caption, re.I):
                category = "Multimídia"
            elif re.search(r"projeto de extensão|atividade extensionista|vi no rótulo", caption, re.I):
                category = "Extensão"
            elif re.search(r"curso|workshop|aula aberta|oficina|palestra|seminário", caption, re.I):
                category = "Ensino"
            elif re.search(r"estudo|pesquisa|artigo|defesa|qualificação|dissertação|tese", caption, re.I):
                category = "Pesquisa"
            else:
                category = "Institucional"
            print(f"::warning::Título sugerido automaticamente; revisar: https://www.instagram.com/p/{code}/")
        else:
            title, summary, body, category = result
        additions.append(dict(data=date, categoria=category, titulo=title, resumo=summary, conteudo=body, url=f"https://www.instagram.com/p/{code}/", imagem=remote_cover(row)))
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
