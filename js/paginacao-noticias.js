/* Paginação progressiva para as notícias do GPENSC. Todas continuam no HTML e acessíveis sem JS. */
(() => {
  "use strict";
  function init() {
    document.querySelectorAll(".gp-noticias-paginadas").forEach((root) => {
      if (root.dataset.paginationReady === "true") return;
      const pages = Array.from(root.querySelectorAll(":scope > .gp-noticias-pagina"));
      if (pages.length < 2) return;
      root.dataset.paginationReady = "true";
      const total = pages.length;
      let current = 1;
      const nav = document.createElement("nav");
      nav.className = "gp-noticias-paginacao";
      nav.setAttribute("aria-label", "Páginas de notícias");
      const buttons = document.createElement("div");
      buttons.className = "gp-noticias-paginacao-botoes";
      const status = document.createElement("p");
      status.className = "gp-noticias-paginacao-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      nav.append(buttons, status);
      root.append(nav);

      function visibleNumbers(page) {
        if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
        const items = new Set([1, total, page - 1, page, page + 1]);
        if (page < 4) [2, 3, 4].forEach((x) => items.add(x));
        if (page > total - 3) [total - 3, total - 2, total - 1].forEach((x) => items.add(x));
        return [...items].filter((x) => x > 0 && x <= total).sort((a,b) => a-b);
      }
      function addButton(label, page, kind, disabled = false) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "gp-noticias-pagina-btn" + (kind ? " gp-noticias-pagina-btn--" + kind : "");
        b.textContent = label;
        b.disabled = disabled;
        if (page === current && kind === "number") {
          b.classList.add("is-current");
          b.setAttribute("aria-current", "page");
          b.setAttribute("aria-label", "Página " + page + " de " + total + ", atual");
        } else if (kind === "number") {
          b.setAttribute("aria-label", "Ir para a página " + page + " de " + total);
        } else {
          b.setAttribute("aria-label", kind === "prev" ? "Página anterior" : "Próxima página");
        }
        b.addEventListener("click", () => changePage(page, true));
        buttons.append(b);
      }
      function changePage(next, scroll) {
        if (next < 1 || next > total) return;
        current = next;
        pages.forEach((section, index) => {
          section.hidden = index + 1 !== current;
          section.setAttribute("aria-hidden", section.hidden ? "true" : "false");
        });
        buttons.replaceChildren();
        addButton("‹ Anterior", current - 1, "prev", current === 1);
        let previous = 0;
        visibleNumbers(current).forEach((n) => {
          if (n - previous > 1) {
            const dots = document.createElement("span");
            dots.className = "gp-noticias-pagina-reticencias";
            dots.textContent = "…";
            dots.setAttribute("aria-hidden", "true");
            buttons.append(dots);
          }
          addButton(String(n), n, "number");
          previous = n;
        });
        addButton("Próxima ›", current + 1, "next", current === total);
        status.textContent = "Página " + current + " de " + total;
        if (scroll) {
          const y = root.getBoundingClientRect().top;
          if (y < 60 || y > window.innerHeight * .6) root.scrollIntoView({behavior:"smooth",block:"start"});
        }
      }
      changePage(1, false);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
