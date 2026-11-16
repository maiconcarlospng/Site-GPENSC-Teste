/* GPENSC — Árvore do Conhecimento v44.
   Mapa orgânico, visão parcial e exploração progressiva.
   Dados exclusivamente dos registros emitidos por arvore.qmd. */
(() => {
  "use strict";

  const boot = () => {
    const root = document.querySelector(".gp44-shell");
    if (!root || root.dataset.ready === "1") return;
    const host = root.querySelector("#gp44-map");
    const detail = root.querySelector("#gp44-detail");
    const list = root.querySelector("#gp44-lines");
    if (!host || !detail || !list) return;
    const lines = [...list.querySelectorAll(".gp44-line")];
    if (!lines.length) return;
    root.dataset.ready = "1";

    const NS = "http://www.w3.org/2000/svg";
    const svgNode = (tag, attributes = {}, label = null) => {
      const node = document.createElementNS(NS, tag);
      Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
      if (label !== null) node.textContent = String(label);
      return node;
    };
    const el = (parent, tag, attrs = {}, txt = null) => {
      const child = svgNode(tag, attrs, txt);
      parent.appendChild(child);
      return child;
    };
    const svgPath = (parent, d, className) => el(parent, "path", { d, class: className });
    const short = text => text.length > 45 ? text.slice(0, 43).trimEnd() + "…" : text;
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = () => window.matchMedia("(max-width: 720px)").matches;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const norm = value => String(value || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    const viewport = { width: 1120, height: 780 };
    const svg = svgNode("svg", {
      class: "gp44-svg", viewBox: "0 0 1120 780",
      role: "group", "aria-label": "Ramificações interativas do GPENSC"
    });
    el(svg, "title", {}, "Explorador das linhas de pesquisa do GPENSC");
    el(svg, "desc", {}, "O tronco surge do canto inferior esquerdo. Galhos e folhas numeradas podem ser explorados com zoom, arraste, teclado ou pela lista de linhas.");
    const defs = el(svg, "defs");
    let g = el(defs, "linearGradient", { id: "gp44-trunk-gradient", x1: "0%", y1: "100%", x2: "100%", y2: "0%" });
    el(g, "stop", { offset: "0%", "stop-color": "#557962" });
    el(g, "stop", { offset: "65%", "stop-color": "#91bd8d" });
    el(g, "stop", { offset: "100%", "stop-color": "#c3dcc0" });
    g = el(defs, "linearGradient", { id: "gp44-branch-gradient", x1: "0%", y1: "70%", x2: "100%", y2: "20%" });
    el(g, "stop", { offset: "0%", "stop-color": "#83ad83" });
    el(g, "stop", { offset: "100%", "stop-color": "#c0dabb" });
    const world = el(svg, "g", { class: "gp44-world" });
    const ambience = el(world, "g", { class: "gp44-ambience", "aria-hidden": "true" });
    [
      [145, 110, 120], [520, 100, 90], [840, 625, 170],
      [275, 690, 90], [1160, 160, 130]
    ].forEach(([x, y, r]) => el(ambience, "circle", {
      cx: x, cy: y, r, class: "gp44-ambience-halo"
    }));
    const boughLayer = el(world, "g", { class: "gp44-boughs", "aria-hidden": "true" });
    const baseD = "M -144 850 C -52 757 43 661 144 573 C 184 542 214 524 271 507";
    svgPath(boughLayer, baseD, "gp44-trunk-shade");
    svgPath(boughLayer, baseD, "gp44-trunk");
    const trunkLabel = el(world, "g", { class: "gp44-root-label", "aria-hidden": "true" });
    el(trunkLabel, "rect", { x: 15, y: 678, width: 156, height: 55, rx: 14 });
    el(trunkLabel, "text", { x: 93, y: 713, "text-anchor": "middle" }, "GPENSC");

    const groupCount = Math.min(5, Math.max(1, Math.ceil(lines.length / 4)));
    const groups = Array.from({ length: groupCount }, () => []);
    lines.forEach((_, index) => {
      const group = Math.min(groupCount - 1, Math.floor(index * groupCount / lines.length));
      groups[group].push(index);
    });
    const tips = new Array(lines.length);
    const branches = new Array(lines.length);
    const nodeLayer = el(world, "g", { class: "gp44-tip-layer" });
    groups.forEach((members, groupIndex) => {
      const t = groupCount === 1 ? 0.5 : groupIndex / (groupCount - 1);
      const hub = { x: 457 + (groupIndex % 2) * 38, y: 130 + t * 567 };
      const branchD = "M 271 507 C 346 502 " +
        (hub.x - 158).toFixed(1) + " " + (hub.y + (507 - hub.y) * 0.38).toFixed(1) +
        " " + hub.x.toFixed(1) + " " + hub.y.toFixed(1);
      svgPath(boughLayer, branchD, "gp44-main-bough-outline");
      svgPath(boughLayer, branchD, "gp44-main-bough");
      el(boughLayer, "circle", { cx: hub.x, cy: hub.y, r: 7, class: "gp44-fork" });
      members.forEach((index, inGroup) => {
        const dy = (inGroup - (members.length - 1) / 2) * 42;
        const x = 776 + (inGroup % 2) * 226 + (groupIndex % 2) * 25;
        const y = hub.y + dy;
        tips[index] = { x, y };
        const d = "M " + hub.x.toFixed(1) + " " + hub.y.toFixed(1) +
          " C " + (hub.x + 115).toFixed(1) + " " + (hub.y + dy * .12).toFixed(1) +
          " " + (x - 126).toFixed(1) + " " + (y - 17).toFixed(1) +
          " " + x.toFixed(1) + " " + y.toFixed(1);
        svgPath(boughLayer, d, "gp44-twig-under");
        branches[index] = svgPath(boughLayer, d, "gp44-twig");
        // Small lateral leaves follow the actual line, not random decoration.
        const lx = hub.x + (x - hub.x) * .63;
        const ly = hub.y + (y - hub.y) * .63 - 9;
        const deco = el(boughLayer, "g", { class: "gp44-small-foliage" });
        el(deco, "ellipse", { cx: lx, cy: ly - 11, rx: 7, ry: 16, transform: "rotate(-30 " + lx + " " + (ly - 11) + ")" });
        el(deco, "ellipse", { cx: lx + 19, cy: ly + 6, rx: 6, ry: 13, transform: "rotate(55 " + (lx + 19) + " " + (ly + 6) + ")" });
      });
    });

    const connectionLayer = el(world, "g", { class: "gp44-links-on-map", "aria-hidden": "true" });
    const nodeElements = lines.map((line, index) => {
      const { x, y } = tips[index];
      const name = line.querySelector(".gp44-line-name")?.textContent?.trim() || "Linha de pesquisa";
      const hasLinks = line.dataset.hasLinks === "1";
      const tip = el(nodeLayer, "g", {
        class: "gp44-tip" + (hasLinks ? " has-links" : ""), role: "button",
        tabindex: "0", focusable: "true", "aria-pressed": "false",
        "aria-label": "Linha " + (index + 1) + ": " + name
      });
      el(tip, "title", {}, name);
      el(tip, "circle", { cx: x, cy: y, r: 32, class: "gp44-tip-target" });
      el(tip, "ellipse", {
        cx: x, cy: y, rx: 28, ry: 22,
        transform: "rotate(-16 " + x + " " + y + ")", class: "gp44-tip-shape"
      });
      el(tip, "text", {
        x, y: y + 5, class: "gp44-tip-text", "text-anchor": "middle"
      }, String(index + 1).padStart(2, "0"));
      if (hasLinks) el(tip, "circle", {
        cx: x + 21, cy: y - 17, r: 6, class: "gp44-tip-related"
      });
      tip.addEventListener("click", () => selectLine(index, true, "map"));
      tip.addEventListener("keydown", evt => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          selectLine(index, true, "map");
        }
      });
      return tip;
    });
    const labelLayer = el(world, "g", {
      class: "gp44-label-layer", "aria-hidden": "true"
    });
    host.replaceChildren(svg);

    const search = root.querySelector("#gp44-search");
    const buttons = [...root.querySelectorAll("[data-gp44-filter]")];
    const count = root.querySelector("#gp44-count");
    const empty = root.querySelector("#gp44-empty");
    const zoomIn = root.querySelector("#gp44-zoom-in");
    const zoomOut = root.querySelector("#gp44-zoom-out");
    const home = root.querySelector("#gp44-home");
    const camera = { scale: 1, x: 0, y: 0 };
    let active = -1, filter = "all", dragging = null, wasDragged = false;
    const mobileView = () => {
      viewport.width = isMobile() ? 680 : 1120;
      viewport.height = isMobile() ? 760 : 780;
      svg.setAttribute("viewBox", "0 0 " + viewport.width + " " + viewport.height);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    };
    function applyCamera() {
      const s = camera.scale;
      const leftLimit = viewport.width - 1320 * s - 90;
      const topLimit = viewport.height - 820 * s - 70;
      camera.x = clamp(camera.x, Math.min(leftLimit, 100), 260 * s);
      camera.y = clamp(camera.y, Math.min(topLimit, 60), 130 * s);
      world.setAttribute("transform", "translate(" + camera.x.toFixed(2) +
        " " + camera.y.toFixed(2) + ") scale(" + s.toFixed(3) + ")");
      if (zoomOut) zoomOut.disabled = s <= .651;
      if (zoomIn) zoomIn.disabled = s >= 2.45;
    }
    function setZoom(scale, anchorX = viewport.width * .5, anchorY = viewport.height * .5) {
      const next = clamp(scale, .65, 2.45);
      const ratio = next / camera.scale;
      camera.x = anchorX - (anchorX - camera.x) * ratio;
      camera.y = anchorY - (anchorY - camera.y) * ratio;
      camera.scale = next;
      applyCamera();
    }
    function resetCamera() {
      mobileView();
      camera.scale = isMobile() ? .95 : 1.05;
      camera.x = isMobile() ? -148 : 12;
      camera.y = isMobile() ? -12 : -12;
      applyCamera();
    }
    function focusOn(index) {
      const { x, y } = tips[index];
      const scale = Math.max(camera.scale, isMobile() ? 1.1 : 1.17);
      camera.scale = scale;
      camera.x = viewport.width * (isMobile() ? .52 : .66) - x * scale;
      camera.y = viewport.height * .5 - y * scale;
      applyCamera();
    }
    function drawSelectedLabel(index) {
      labelLayer.replaceChildren();
      if (index < 0) return;
      const { x, y } = tips[index];
      const value = lines[index].querySelector(".gp44-line-name")?.textContent?.trim() || "";
      const boxX = x > 870 ? x - 259 : x + 41;
      const boxY = Math.max(23, y - 68);
      const bubble = el(labelLayer, "g", { class: "gp44-focus-label" });
      el(bubble, "rect", { x: boxX, y: boxY, rx: 13, width: 225, height: 53 });
      el(bubble, "text", { x: boxX + 14, y: boxY + 22 }, "LINHA DE PESQUISA");
      el(bubble, "text", {
        x: boxX + 14, y: boxY + 41, class: "gp44-focus-name"
      }, short(value));
    }
    function renderRelated(index) {
      connectionLayer.replaceChildren();
      const counts = [
        ["projects", "#f0ad55"], ["people", "#b7df94"],
        ["publications", "#efca91"], ["theses", "#81c9b7"]
      ].filter(([key]) => Number(lines[index].dataset[key] || 0) > 0);
      const { x, y } = tips[index];
      counts.forEach(([key, color], i) => {
        const bx = x > 900 ? x - 82 - (i % 2) * 38 : x + 71 + (i % 2) * 38;
        const by = y - 28 + i * 23;
        svgPath(connectionLayer,
          "M " + x + " " + y + " Q " + (x + bx) / 2 + " " +
          (y - 45) + " " + bx + " " + by, "gp44-link-line");
        el(connectionLayer, "circle", {
          cx: bx, cy: by, r: 12, fill: color, class: "gp44-link-fruit"
        });
        el(connectionLayer, "text", {
          x: bx, y: by + 4, "text-anchor": "middle", class: "gp44-link-quantity"
        }, lines[index].dataset[key]);
      });
    }
    const matches = index => {
      const line = lines[index];
      const term = norm(search?.value);
      const name = line.querySelector(".gp44-line-name")?.textContent || "";
      const related = line.querySelector(".gp44-line-body")?.textContent || "";
      return (!term || norm(name + " " + related).includes(term)) &&
        (filter !== "linked" || line.dataset.hasLinks === "1");
    };
    function resetDetail() {
      const kicker = document.createElement("span");
      kicker.className = "gp44-detail-kicker";
      kicker.textContent = "EM FOCO";
      const placeholder = document.createElement("div");
      placeholder.className = "gp44-detail-placeholder";
      const mark = document.createElement("span");
      mark.className = "gp44-placeholder-symbol";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = "↗";
      const h = document.createElement("h2");
      h.textContent = "Escolha uma linha";
      const p = document.createElement("p");
      p.textContent = "Toque em uma folha do mapa ou selecione uma linha na lista para ver seus vínculos.";
      const a = document.createElement("a");
      a.href = "#gp44-directory";
      a.className = "gp44-jump-link";
      a.textContent = "Explorar por nome";
      placeholder.append(mark, h, p, a);
      detail.replaceChildren(kicker, placeholder);
    }
    function selectLine(index, move = false, source = "list") {
      if (!matches(index)) return;
      active = index;
      lines.forEach((line, i) => {
        const selected = i === index;
        line.classList.toggle("is-active", selected);
        line.querySelector(".gp44-line-button")
          ?.setAttribute("aria-pressed", String(selected));
      });
      nodeElements.forEach((node, i) => {
        node.classList.toggle("is-active", i === index);
        node.setAttribute("aria-pressed", String(i === index));
        branches[i].classList.toggle("is-active", i === index);
      });
      drawSelectedLabel(index);
      renderRelated(index);
      const line = lines[index];
      const kicker = document.createElement("span");
      kicker.className = "gp44-detail-kicker";
      kicker.textContent = "LINHA " + String(index + 1).padStart(2, "0");
      const h = document.createElement("h2");
      h.textContent = line.querySelector(".gp44-line-name")?.textContent || "Linha";
      const related = document.createElement("div");
      related.className = "gp44-detail-badges";
      [
        ["projects", "Projetos"], ["people", "Integrantes"],
        ["publications", "Publicações"], ["theses", "Teses e dissertações"]
      ].forEach(([key, text]) => {
        const number = Number(line.dataset[key] || 0);
        if (number > 0) {
          const badge = document.createElement("span");
          badge.textContent = number + " " + text.toLowerCase();
          related.appendChild(badge);
        }
      });
      const copy = line.querySelector(".gp44-line-body")?.cloneNode(true);
      if (copy) copy.className = "gp44-detail-content";
      detail.replaceChildren(kicker, h, related, ...(copy ? [copy] : []));
      if (move) {
        focusOn(index);
        if (isMobile() && source === "list")
          detail.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
      }
    }
    function updateFilters() {
      let number = 0;
      lines.forEach((line, i) => {
        const visible = matches(i);
        line.hidden = !visible;
        nodeElements[i].classList.toggle("is-dimmed", !visible);
        branches[i].classList.toggle("is-dimmed", !visible);
        if (visible) number++;
      });
      if (count) count.textContent = number + (number === 1 ? " linha" : " linhas");
      if (empty) empty.hidden = number > 0;
      if (active >= 0 && !matches(active)) {
        active = -1;
        nodeElements.forEach(node => {
          node.classList.remove("is-active");
          node.setAttribute("aria-pressed", "false");
        });
        branches.forEach(branch => branch.classList.remove("is-active"));
        lines.forEach(line => {
          line.classList.remove("is-active");
          line.querySelector(".gp44-line-button")?.setAttribute("aria-pressed", "false");
        });
        labelLayer.replaceChildren();
        connectionLayer.replaceChildren();
        resetDetail();
      }
    }

    lines.forEach((line, index) => line.querySelector(".gp44-line-button")
      ?.addEventListener("click", () => selectLine(index, true, "list")));
    search?.addEventListener("input", updateFilters);
    buttons.forEach(button => button.addEventListener("click", () => {
      filter = button.dataset.gp44Filter || "all";
      buttons.forEach(b => {
        const pressed = b === button;
        b.classList.toggle("is-active", pressed);
        b.setAttribute("aria-pressed", String(pressed));
      });
      updateFilters();
    }));
    const totalWithLinks = lines.filter(line => line.dataset.hasLinks === "1").length;
    const onlyLinked = buttons.find(button => button.dataset.gp44Filter === "linked");
    if (onlyLinked && totalWithLinks === 0) onlyLinked.hidden = true;
    zoomIn?.addEventListener("click", () => setZoom(camera.scale + .22));
    zoomOut?.addEventListener("click", () => setZoom(camera.scale - .22));
    home?.addEventListener("click", resetCamera);

    svg.addEventListener("wheel", event => {
      // Scroll normal continua sendo da página, exceto com Ctrl/Command.
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const pointerX = (event.clientX - rect.left) / rect.width * viewport.width;
      const pointerY = (event.clientY - rect.top) / rect.height * viewport.height;
      setZoom(camera.scale + (event.deltaY < 0 ? .16 : -.16), pointerX, pointerY);
    }, { passive: false });
    svg.addEventListener("pointerdown", event => {
      if (event.button !== 0 || event.target.closest(".gp44-tip")) return;
      dragging = {
        id: event.pointerId, x: event.clientX, y: event.clientY,
        oldX: camera.x, oldY: camera.y
      };
      wasDragged = false;
      svg.classList.add("is-dragging");
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener("pointermove", event => {
      if (!dragging || event.pointerId !== dragging.id) return;
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const deltaX = (event.clientX - dragging.x) / rect.width * viewport.width;
      const deltaY = (event.clientY - dragging.y) / rect.height * viewport.height;
      wasDragged = wasDragged || Math.abs(deltaX) + Math.abs(deltaY) > 4;
      camera.x = dragging.oldX + deltaX;
      camera.y = dragging.oldY + deltaY;
      applyCamera();
    });
    const release = event => {
      if (!dragging || event.pointerId !== dragging.id) return;
      dragging = null;
      svg.classList.remove("is-dragging");
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    };
    svg.addEventListener("pointerup", release);
    svg.addEventListener("pointercancel", release);
    host.addEventListener("keydown", event => {
      if (event.target !== host && event.target !== svg) return;
      const shift = 75;
      if (event.key === "ArrowLeft") camera.x += shift;
      else if (event.key === "ArrowRight") camera.x -= shift;
      else if (event.key === "ArrowUp") camera.y += shift;
      else if (event.key === "ArrowDown") camera.y -= shift;
      else return;
      event.preventDefault();
      applyCamera();
    });

    let lastMobile = isMobile();
    window.addEventListener("resize", () => {
      const nowMobile = isMobile();
      if (nowMobile !== lastMobile) {
        lastMobile = nowMobile;
        resetCamera();
        if (active >= 0) focusOn(active);
      }
    }, { passive: true });
    mobileView();
    resetCamera();
    updateFilters();
    root.classList.add("is-ready");
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();