/* Carrosséis de notícias reproduzidos com URLs externas, sem copiar imagens. */
(() => {
  "use strict";
  const prefix = "data/instagram/carrosseis-";
  const files = [1, 2, 3, 4].map(n => prefix + String(n).padStart(2, "0") + ".json");
  const getCode = (url) => {
    const m = String(url || "").match(/instagram\.com\/(?:p|reel|tv)\/([\w-]+)/i);
    return m ? m[1] : null;
  };
  const imageUrl = (value) => typeof value === "string" && /^https:\/\//.test(value);
  const build = (frame, urls, link) => {
    if (frame.querySelector(".gp-ig-gallery")) return;
    const holder = document.createElement("div");
    holder.className = "gp-ig-gallery";
    holder.setAttribute("role", "group");
    holder.setAttribute("aria-label", "Carrossel original do Instagram com " + urls.length + " imagens");
    holder.tabIndex = 0;
    const img = document.createElement("img");
    img.className = "gp-ig-photo";
    img.alt = "Imagem 1 de " + urls.length + " da publicação do GPENSC";
    img.loading = "lazy";
    img.decoding = "async";
    const error = document.createElement("a");
    error.className = "gp-ig-image-error";
    error.href = link;
    error.target = "_blank";
    error.rel = "noopener noreferrer";
    error.textContent = "Imagem temporariamente indisponível · Ver no Instagram";
    error.hidden = true;
    const back = document.createElement("button");
    back.className = "gp-ig-arrow gp-ig-arrow--back";
    back.type = "button";
    back.setAttribute("aria-label", "Imagem anterior");
    back.textContent = "‹";
    const next = document.createElement("button");
    next.className = "gp-ig-arrow gp-ig-arrow--next";
    next.type = "button";
    next.setAttribute("aria-label", "Próxima imagem");
    next.textContent = "›";
    const nav = document.createElement("div");
    nav.className = "gp-ig-indicators";
    nav.setAttribute("aria-label", "Indicadores de imagens");
    const dots = urls.map((_, i) => {
      const dot = document.createElement("button");
      dot.className = "gp-ig-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", "Mostrar imagem " + (i + 1));
      dot.addEventListener("click", () => show(i));
      nav.append(dot);
      return dot;
    });
    const count = document.createElement("span");
    count.className = "gp-ig-count";
    let current = 0;
    let loaded = false;
    function show(i) {
      current = (i + urls.length) % urls.length;
      img.hidden = false;
      error.hidden = true;
      img.alt = "Imagem " + (current + 1) + " de " + urls.length + " da publicação do GPENSC";
      img.src = urls[current];
      count.textContent = (current + 1) + "/" + urls.length;
      back.disabled = current === 0;
      next.disabled = current === urls.length - 1;
      dots.forEach((dot, j) => {
        dot.classList.toggle("is-active", j === current);
        dot.setAttribute("aria-current", j === current ? "true" : "false");
      });
    }
    img.addEventListener("load", () => {
      loaded = true;
      frame.classList.add("gp-ig-gallery-ready");
      img.hidden = false;
      error.hidden = true;
    });
    img.addEventListener("error", () => {
      img.hidden = true;
      error.hidden = false;
      if (loaded) frame.classList.add("gp-ig-gallery-ready");
    });
    back.addEventListener("click", () => show(current - 1));
    next.addEventListener("click", () => show(current + 1));
    holder.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" && current > 0) {e.preventDefault(); show(current - 1);}
      if (e.key === "ArrowRight" && current < urls.length - 1) {e.preventDefault(); show(current + 1);}
    });
    let startX = null;
    holder.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) startX = e.touches[0].clientX;
    }, {passive: true});
    holder.addEventListener("touchend", (e) => {
      if (startX === null || e.changedTouches.length !== 1) return;
      const delta = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(delta) > 42) show(Math.max(0, Math.min(urls.length - 1, current + (delta < 0 ? 1 : -1))));
    }, {passive: true});
    holder.append(img, error, back, next, nav, count);
    frame.append(holder);
    show(0);
  };
  async function init() {
    const frames = Array.from(document.querySelectorAll(".nt-img[data-gp-instagram-url]"));
    if (!frames.length) return;
    const byCode = new Map();
    frames.forEach(frame => {
      const code = getCode(frame.getAttribute("data-gp-instagram-url"));
      if (!code) return;
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code).push(frame);
    });
    if (!byCode.size) return;
    const chunks = await Promise.all(files.map(file =>
      fetch(file, {cache:"default"}).then(res => res.ok ? res.json() : {}).catch(() => ({}))
    ));
    const media = Object.assign({}, ...chunks);
    byCode.forEach((framesForPost, code) => {
      const images = (media[code] || []).filter(imageUrl);
      if (images.length < 2) return;
      framesForPost.forEach(frame => build(frame, images, frame.getAttribute("data-gp-instagram-url")));
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
