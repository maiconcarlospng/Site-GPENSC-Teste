/* GPENSC — Explorador de conhecimento.
   Ramificações SVG originais inspiradas no conceito de navegação em árvores.
   Não utiliza a arte de uma árvore inteira. Os registros vêm de arvore.qmd. */
(() => {
  "use strict";

  function iniciar() {
    const lista = document.getElementById("gp-tree-branches");
    const canvas = document.getElementById("gp-tree-canvas");
    const detalhe = document.getElementById("gp-tree-detail");
    if (!lista || !canvas || !detalhe || canvas.dataset.iniciado === "1") return;

    const linhas = [...lista.querySelectorAll(".gp-tree-branch")];
    if (!linhas.length) return;
    canvas.dataset.iniciado = "1";

    const NS = "http://www.w3.org/2000/svg";
    const W = 1260, H = 810;
    const svgEl = (tag, attr = {}, label) => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attr).forEach(([key, value]) => el.setAttribute(key, String(value)));
      if (label !== undefined) el.textContent = label;
      return el;
    };
    const add = (to, tag, attr, label) => {
      const e = svgEl(tag, attr, label);
      to.appendChild(e);
      return e;
    };
    const path = (to, d, klass) => add(to, "path", { d, class: klass });

    const svg = svgEl("svg", {
      viewBox: "0 0 " + W + " " + H,
      preserveAspectRatio: matchMedia("(max-width:720px)").matches ? "xMidYMid slice" : "xMidYMid meet",
      role: "group",
      class: "gp-tree-svg gp-tree-zoom-explorer",
      "aria-label": "Explorador de conexões: " + linhas.length + " linhas de pesquisa"
    });
    add(svg, "title", {}, "Árvore do conhecimento do GPENSC");
    add(svg, "desc", {}, "O tronco nasce no canto inferior esquerdo e se divide em galhos que representam as linhas de pesquisa. Use as setas ou a lista para selecionar uma linha.");

    // O desenho emerge de fora da área visível: não há árvore inteira na tela.
    const mundo = add(svg, "g", { class: "gp-tree-world" });
    const desenho = add(mundo, "g", { class: "gp-tree-organic-branches", "aria-hidden": "true" });
    path(desenho, "M -92 895 C -30 804 18 722 95 656 C 163 597 198 577 271 530", "gp-tree-wood gp-tree-wood-root");
    path(desenho, "M -100 909 C -39 798 20 721 95 656 C 166 598 214 564 271 530", "gp-tree-wood gp-tree-wood-inner");
    const placa = add(desenho, "g", { class: "gp-tree-corner-label" });
    add(placa, "rect", { x: 16, y: 705, width: 155, height: 55, rx: 13 });
    add(placa, "text", { x: 94, y: 739, "text-anchor": "middle" }, "GPENSC");

    const quantidadeGrupos = Math.min(4, Math.max(1, Math.ceil(linhas.length / 4)));
    const grupos = Array.from({ length: quantidadeGrupos }, () => []);
    linhas.forEach((_, i) => {
      const grupo = Math.min(quantidadeGrupos - 1, Math.floor(i * quantidadeGrupos / linhas.length));
      grupos[grupo].push(i);
    });
    const areas = grupos.map((indices, g) => {
      const t = quantidadeGrupos === 1 ? 0.5 : g / (quantidadeGrupos - 1);
      const hub = { x: 385 + 192 * t, y: 158 + 475 * t };
      const centro = 160 + t * 474;
      const nodes = indices.map((i, j) => {
        const afastamento = j - (indices.length - 1) / 2;
        return {
          i,
          x: 745 + 145 * t + (j % 2) * 58,
          y: centro + afastamento * 47
        };
      });
      return { hub, nodes, indices };
    });
    const camadas = add(mundo, "g", { class: "gp-tree-branch-lines", "aria-hidden": "true" });
    const hastes = [];
    const nodes = [];
    const posicoes = [];
    areas.forEach(({ hub, nodes: items }, groupIndex) => {
      const d = [
        "M 271 530",
        "C 354 530",
        (hub.x - 116) + " " + (hub.y + 82),
        hub.x + " " + hub.y
      ].join(" ");
      path(camadas, d, "gp-tree-main-bough");
      add(camadas, "circle", { cx: hub.x, cy: hub.y, r: 8, class: "gp-tree-fork" });
      items.forEach(({ i, x, y }) => {
        const dLeaf = "M " + hub.x + " " + hub.y +
          " C " + (hub.x + 124) + " " + (hub.y - 24) +
          " " + (x - 127) + " " + (y - 12) +
          " " + x + " " + y;
        const galho = path(camadas, dLeaf, "gp-tree-fine-bough");
        hastes[i] = galho;
        posicoes[i] = { x, y, groupIndex };
      });
    });
    const frutos = add(mundo, "g", { class: "gp-tree-fruit-links", "aria-hidden": "true" });
    const folhas = add(mundo, "g", { class: "gp-tree-tip-nodes" });
    linhas.forEach((linha, i) => {
      const { x, y } = posicoes[i];
      const nome = linha.querySelector(".gp-tree-name")?.textContent?.trim() || "Linha " + (i + 1);
      const node = add(folhas, "g", {
        class: "gp-tree-node gp-tree-tip",
        role: "button", tabindex: 0,
        "aria-label": "Explorar linha " + (i + 1) + ": " + nome,
        "aria-pressed": "false"
      });
      add(node, "title", {}, nome);
      add(node, "circle", { cx: x, cy: y, r: 31, class: "gp-tree-node-hit" });
      add(node, "ellipse", { cx: x, cy: y, rx: 30, ry: 23, class: "gp-tree-tip-leaf" });
      add(node, "text", {
        x, y: y + 5, class: "gp-tree-tip-number", "text-anchor": "middle"
      }, String(i + 1).padStart(2, "0"));
      node.addEventListener("click", () => escolher(i, true));
      node.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault(); escolher(i, true);
        }
      });
      nodes[i] = node;
    });
    canvas.replaceChildren(svg);

    let active = 0, filtro = "all", dragging = null;
    const camera = { scale: 1, x: 0, y: 0 };
    const status = document.getElementById("gp-tree-count");
    const semResultados = document.getElementById("gp-tree-no-results");
    const busca = document.getElementById("gp-tree-filter");
    const mais = document.getElementById("gp-tree-plus");
    const menos = document.getElementById("gp-tree-minus");
    const voltar = document.getElementById("gp-tree-reset");
    const reduzMovimento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const normal = (v) => String(v || "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const limite = (v, min, max) => Math.max(min, Math.min(max, v));
    const textoBusca = (linha) => [
      linha.querySelector(".gp-tree-name")?.textContent || "",
      linha.querySelector(".gp-tree-body")?.textContent || ""
    ].join(" ");
    function visivel(i) {
      const linha = linhas[i];
      const okBusca = !busca?.value || normal(textoBusca(linha)).includes(normal(busca.value));
      return okBusca && (filtro !== "linked" || linha.dataset.hasLinks === "1");
    }

    // Mantém espaço suficiente para deslocar e centralizar os ramos, sem
    // permitir que o explorador se perca em uma área totalmente vazia.
    function aplicarCamera() {
      const s = camera.scale;
      camera.x = limite(camera.x, W * (0.10 - s), W * 0.3);
      camera.y = limite(camera.y, H * (0.12 - s), H * 0.35);
      mundo.setAttribute("transform",
        "translate(" + camera.x.toFixed(2) + " " + camera.y.toFixed(2) +
        ") scale(" + s.toFixed(3) + ")");
      svg.classList.toggle("is-zoomed", s > 1.04);
      if (mais) mais.disabled = s >= 2.75;
      if (menos) menos.disabled = s <= 1.005;
    }
    function zoom(inc, px = W * 0.54, py = H * 0.45) {
      const before = camera.scale;
      const next = limite(Math.round((before + inc) * 100) / 100, 1, 2.75);
      if (next === before) return;
      const ratio = next / before;
      camera.x = px - (px - camera.x) * ratio;
      camera.y = py - (py - camera.y) * ratio;
      camera.scale = next;
      aplicarCamera();
    }
    function focar(i) {
      const { x, y } = posicoes[i];
      camera.scale = 1.62;
      camera.x = 695 - camera.scale * x;
      camera.y = 390 - camera.scale * y;
      aplicarCamera();
    }
    function redefinir() {
      camera.scale = 1; camera.x = 0; camera.y = 0;
      aplicarCamera();
    }

    function desenharFrutos(i) {
      frutos.replaceChildren();
      const dados = linhas[i].dataset;
      const categoria = [
        ["projects", "Projetos", "#c87828"],
        ["people", "Integrantes", "#63944f"],
        ["publications", "Publicações", "#b66b47"],
        ["theses", "Teses e dissertações", "#59827a"]
      ].filter(([id]) => Number(dados[id] || 0) > 0);
      const { x, y } = posicoes[i];
      const sentido = x > 850 ? -1 : 1;
      categoria.forEach(([id, nome, cor], j) => {
        const fx = x + sentido * (85 + (j % 2) * 42);
        const fy = y + (j - (categoria.length - 1) / 2) * 57;
        path(frutos,
          "M " + x + " " + y + " Q " + (x + fx) / 2 + " " + (y - 20) +
          " " + fx + " " + fy, "gp-tree-fruit-stem");
        const g = add(frutos, "g", { class: "gp-tree-visual-fruit" });
        add(g, "title", {}, nome + ": " + dados[id]);
        add(g, "circle", { cx: fx, cy: fy, r: 21, fill: cor });
        add(g, "text", { x: fx, y: fy + 5, "text-anchor": "middle" }, String(dados[id]));
      });
    }
    const palavra = document.createElement("span");
    palavra.className = "gp-tree-eyebrow";
    function escolher(i, focarMapa) {
      if (i < 0 || i >= linhas.length || !visivel(i)) return;
      active = i;
      linhas.forEach((linha, j) => {
        const ativo = i === j;
        linha.classList.toggle("is-active", ativo);
        linha.querySelector(".gp-tree-branch-button")?.setAttribute("aria-expanded", String(ativo));
      });
      nodes.forEach((node, j) => {
        node.classList.toggle("is-active", j === i);
        node.setAttribute("aria-pressed", String(j === i));
        hastes[j]?.classList.toggle("is-active", j === i);
      });
      desenharFrutos(i);
      const titulo = document.createElement("h2");
      titulo.textContent = linhas[i].querySelector(".gp-tree-name")?.textContent || "Linha de pesquisa";
      palavra.textContent = "LINHA " + String(i + 1).padStart(2, "0") + " · PESQUISA";
      const conteudo = linhas[i].querySelector(".gp-tree-body")?.cloneNode(true);
      if (conteudo) conteudo.className = "gp-tree-detail-body";
      detalhe.replaceChildren(palavra, titulo, ...(conteudo ? [conteudo] : []));
      if (focarMapa) {
        focar(i);
        if (matchMedia("(max-width:850px)").matches)
          detalhe.scrollIntoView({ behavior: reduzMovimento() ? "auto" : "smooth", block: "nearest" });
      }
    }
    function aplicarFiltros() {
      let total = 0, primeiro = -1;
      linhas.forEach((linha, i) => {
        const mostrar = visivel(i);
        linha.hidden = !mostrar;
        nodes[i].classList.toggle("is-dimmed", !mostrar);
        hastes[i]?.classList.toggle("is-dimmed", !mostrar);
        if (mostrar) { total++; if (primeiro < 0) primeiro = i; }
      });
      if (status) status.textContent = total + " de " + linhas.length + " linhas";
      if (semResultados) semResultados.hidden = total > 0;
      if (total === 0) {
        frutos.replaceChildren();
        const h = document.createElement("h2");
        h.textContent = "Nenhuma linha encontrada";
        const p = document.createElement("p");
        p.textContent = "Altere a busca ou escolha outro filtro.";
        detalhe.replaceChildren(h, p);
      } else if (!visivel(active)) escolher(primeiro, false);
    }

    document.querySelectorAll("[data-tree-filter]").forEach(botao =>
      botao.addEventListener("click", () => {
        filtro = botao.dataset.treeFilter || "all";
        document.querySelectorAll("[data-tree-filter]").forEach(b => {
          const ativo = b === botao;
          b.classList.toggle("is-active", ativo);
          b.setAttribute("aria-pressed", String(ativo));
        });
        aplicarFiltros();
      })
    );
    busca?.addEventListener("input", aplicarFiltros);
    linhas.forEach((linha, i) =>
      linha.querySelector(".gp-tree-branch-button")?.addEventListener("click", () => escolher(i, true))
    );
    mais?.addEventListener("click", () => zoom(0.25));
    menos?.addEventListener("click", () => zoom(-0.25));
    voltar?.addEventListener("click", redefinir);
    svg.addEventListener("wheel", event => {
      if (!event.ctrlKey && !event.metaKey) return; // não intercepta o scroll da página
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * W;
      const py = ((event.clientY - rect.top) / rect.height) * H;
      zoom(event.deltaY < 0 ? 0.15 : -0.15, px, py);
    }, { passive: false });
    svg.addEventListener("pointerdown", event => {
      if (event.button !== 0 || event.target.closest(".gp-tree-tip")) return;
      dragging = {
        id: event.pointerId, x: event.clientX, y: event.clientY,
        oldX: camera.x, oldY: camera.y
      };
      svg.classList.add("is-dragging");
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener("pointermove", event => {
      if (!dragging || dragging.id !== event.pointerId) return;
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      camera.x = dragging.oldX + (event.clientX - dragging.x) * W / rect.width;
      camera.y = dragging.oldY + (event.clientY - dragging.y) * H / rect.height;
      aplicarCamera();
    });
    const soltar = event => {
      if (!dragging || dragging.id !== event.pointerId) return;
      dragging = null;
      svg.classList.remove("is-dragging");
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    };
    svg.addEventListener("pointerup", soltar);
    svg.addEventListener("pointercancel", soltar);
    window.addEventListener("resize", () => {
      svg.setAttribute("preserveAspectRatio",
        matchMedia("(max-width:720px)").matches ? "xMidYMid slice" : "xMidYMid meet");
      aplicarCamera();
    }, { passive: true });

    lista.closest(".gp-tree-shell")?.classList.add("is-ready");
    aplicarFiltros();
    escolher(0, false);
    redefinir();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  else iniciar();
})();