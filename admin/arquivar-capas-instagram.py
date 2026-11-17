#!/usr/bin/env python3
"""Arquiva capas de posts já cadastrados no GPENSC durante a compilação Quarto.

Lê somente URLs de mídia preexistentes nos YAML oficiais. Não coleta posts novos.
As cópias ficam em img/instagram/ da árvore compilada (render-published).
Fontes originais e cadastros em main permanecem inalterados.
"""
from __future__ import annotations

import concurrent.futures
import pathlib
import re
import sys
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DESTINO = ROOT / "img" / "instagram"
DADOS = (
    "data/noticias.yml",
    "data/materiais.yml",
    "data/videos.yml",
    "data/noar.yml",
    "data/livros.yml",
    "data/projetos.yml",
    "data/linha_tempo.yml",
)
MAX_BYTES = 7 * 1024 * 1024
SHORTCODE = re.compile(r"^https://www\.instagram\.com/p/([A-Za-z0-9_-]{7,30})/$")
ATTR_URL = re.compile(r'^    (?:url|link): "(https://www\.instagram\.com/p/[^"]+)"\s*$', re.MULTILINE)
ATTR_IMG = re.compile(r'^    imagem: "(https://[^"]+)"\s*$', re.MULTILINE)
IMGS = (".jpg", ".png", ".webp")


def aceitar_url_imagem(url: str) -> bool:
    try:
        parsed = urllib.parse.urlsplit(url)
        host = (parsed.hostname or "").lower()
        return (
            parsed.scheme == "https"
            and (host.endswith(".cdninstagram.com") or host.endswith(".fbcdn.net"))
            and not parsed.username
            and not parsed.password
        )
    except ValueError:
        return False


def tipo_imagem(data: bytes) -> str | None:
    if data.startswith(bytes.fromhex("ffd8ff")):
        return ".jpg"
    if data.startswith(bytes.fromhex("89504e470d0a1a0a")):
        return ".png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    return None


def capa_local(codigo: str) -> pathlib.Path | None:
    for extensao in IMGS:
        arq = DESTINO / (codigo + extensao)
        if arq.is_file() and 128 < arq.stat().st_size <= MAX_BYTES:
            return arq
    return None


def baixar(entrada: tuple[str, str]) -> tuple[str, pathlib.Path | None, str]:
    codigo, url = entrada
    existente = capa_local(codigo)
    if existente:
        return codigo, existente, "recuperada"
    if not aceitar_url_imagem(url):
        return codigo, None, "fonte inválida"
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; GPENSC-Site/1.0)",
                "Accept": "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
            },
        )
        with urllib.request.urlopen(req, timeout=14) as response:
            data = response.read(MAX_BYTES + 1)
        extensao = tipo_imagem(data)
        if len(data) > MAX_BYTES or len(data) < 128 or not extensao:
            return codigo, None, "resposta não é imagem válida"
        path = DESTINO / (codigo + extensao)
        path.write_bytes(data)
        return codigo, path, "baixada"
    except Exception as exc:
        return codigo, None, f"origem indisponível ({type(exc).__name__})"


def encontrar_registros(conteudo: str) -> list[tuple[str, str]]:
    registros: list[tuple[str, str]] = []
    for bloco in re.split(r"(?m)(?=^  - )", conteudo):
        post = ATTR_URL.search(bloco)
        imagem = ATTR_IMG.search(bloco)
        if not post or not imagem:
            continue
        codigo = SHORTCODE.fullmatch(post.group(1))
        if codigo and aceitar_url_imagem(imagem.group(1)):
            registros.append((codigo.group(1), imagem.group(1)))
    return registros


def reescrever(conteudo: str, arquivos: dict[str, pathlib.Path]) -> tuple[str, int]:
    totais = [0]

    def trocar_bloco(match: re.Match[str]) -> str:
        bloco = match.group(0)
        post = ATTR_URL.search(bloco)
        imagem = ATTR_IMG.search(bloco)
        if not post or not imagem:
            return bloco
        codigo = SHORTCODE.fullmatch(post.group(1))
        if not codigo or codigo.group(1) not in arquivos:
            return bloco
        path = arquivos[codigo.group(1)]
        caminho = path.relative_to(ROOT).as_posix()
        totais[0] += 1
        return bloco[:imagem.start(1)] + caminho + bloco[imagem.end(1):]

    result = re.sub(r"(?ms)^  - .*?(?=^  - |\Z)", trocar_bloco, conteudo)
    return result, totais[0]


def main() -> int:
    DESTINO.mkdir(parents=True, exist_ok=True)
    fontes: dict[str, str] = {}
    arquivos: dict[pathlib.Path, str] = {}
    for nome in DADOS:
        arq = ROOT / nome
        if not arq.is_file():
            continue
        conteudo = arq.read_text(encoding="utf-8")
        arquivos[arq] = conteudo
        for codigo, url in encontrar_registros(conteudo):
            fontes.setdefault(codigo, url)
    if not fontes:
        print("Nenhuma foto de Instagram cadastrada para arquivamento.")
        return 0
    salvadas: dict[str, pathlib.Path] = {}
    resultados = {"recuperada": 0, "baixada": 0, "indisponível": 0}
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        for codigo, path, situacao in executor.map(baixar, fontes.items()):
            if path:
                salvadas[codigo] = path
                resultados[situacao] += 1
            else:
                resultados["indisponível"] += 1
                print(f"Imagem {codigo}: {situacao}; fallback temático será mantido.")
    substituidas = 0
    for arq, conteudo in arquivos.items():
        revisado, qtd = reescrever(conteudo, salvadas)
        if qtd:
            arq.write_text(revisado, encoding="utf-8")
            substituidas += qtd
    print(
        f"Capas Instagram: {len(fontes)} códigos únicos; "
        f"{resultados['baixada']} baixadas, "
        f"{resultados['recuperada']} restauradas, "
        f"{resultados['indisponível']} indisponíveis, "
        f"{substituidas} referências locais geradas."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
