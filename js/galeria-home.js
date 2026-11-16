/* GPENSC — faixa de fotografias: navegação automática discreta.
   Preserva fotos, foco e zoom cadastrados no painel.
   Sem título, contador ou instruções visíveis. */
(() => {
  "use strict";
  const iniciar = () => {
    document.querySelectorAll(".galeria--faixa").forEach(galeria => {
      if (galeria.dataset.galeriaAtiva === "1") return;
      const faixa = galeria.querySelector(".galeria-faixa");
      const fotos = faixa ? [...faixa.querySelectorAll(":scope > .galeria-item")] : [];
      if (!faixa || !fotos.length) return;
      galeria.dataset.galeriaAtiva = "1";
      if (fotos.length < 2) return;

      const total = fotos.length;
      const clones = fotos.slice(0, Math.min(3, total)).map(foto => {
        const copia = foto.cloneNode(true);
        copia.setAttribute("aria-hidden", "true");
        copia.dataset.galeriaClone = "1";
        copia.querySelectorAll("img").forEach(img => {
          img.alt = "";
          img.loading = "eager";
        });
        faixa.appendChild(copia);
        return copia;
      });

      const criarControle = (classe, simbolo, texto) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "galeria-controle " + classe;
        botao.textContent = simbolo;
        botao.setAttribute("aria-label", texto);
        botao.setAttribute("aria-controls", faixa.id);
        galeria.appendChild(botao);
        return botao;
      };
      const anterior = criarControle("galeria-controle--anterior", "‹", "Fotografia anterior");
      const proximo = criarControle("galeria-controle--proximo", "›", "Próxima fotografia");
      const reduzir = matchMedia("(prefers-reduced-motion: reduce)");
      const emCelular = () => matchMedia("(max-width:767.98px)").matches;

      let atual = 0, timer = null, retomada = null, scrollFim = null, saltar = null;
      let programaticoAte = 0;
      const limparTempo = id => { if (id !== null) clearTimeout(id); };
      const parar = () => { if (timer !== null) clearInterval(timer); timer = null; };
      const deslocamento = (foto) => {
        const fr = faixa.getBoundingClientRect();
        const ir = foto.getBoundingClientRect();
        let destino = faixa.scrollLeft + ir.left - fr.left;
        if (emCelular()) destino -= (fr.width - ir.width) / 2;
        return Math.max(0, destino);
      };
      const ir = (foto, suave = true) => {
        if (!foto) return;
        programaticoAte = Date.now() + (suave ? 850 : 100);
        faixa.scrollTo({ left: deslocamento(foto), behavior: suave && !reduzir.matches ? "smooth" : "auto" });
      };

      // Um salto invisível após a foto clonada mantém o efeito de faixa contínua.
      const voltarAoInicio = () => {
        programaticoAte = Date.now() + 200;
        faixa.style.setProperty("scroll-behavior", "auto", "important");
        faixa.style.setProperty("scroll-snap-type", "none", "important");
        faixa.scrollLeft = deslocamento(fotos[0]);
        requestAnimationFrame(() => {
          faixa.style.removeProperty("scroll-behavior");
          faixa.style.removeProperty("scroll-snap-type");
        });
      };
      const mover = (i, manual = false) => {
        if (manual) {
          parar();
          limparTempo(retomada);
          retomada = setTimeout(iniciarAutomatico, 7000);
        }
        limparTempo(saltar);
        if (i >= total) {
          atual = 0;
          ir(clones[0], true);
          saltar = setTimeout(voltarAoInicio, reduzir.matches ? 80 : 750);
        } else {
          atual = Math.max(0, i);
          ir(fotos[atual], true);
        }
      };
      const podeAvancar = () => {
        if (document.hidden || reduzir.matches) return false;
        if (matchMedia("(hover:hover) and (pointer:fine)").matches && galeria.matches(":hover")) return false;
        if (galeria.contains(document.activeElement)) return false;
        return true;
      };
      const iniciarAutomatico = () => {
        parar();
        if (!podeAvancar()) return;
        timer = setInterval(() => {
          if (podeAvancar()) mover(atual + 1);
          else parar();
        }, 5000);
      };
      const pausarTemporariamente = () => {
        parar();
        limparTempo(retomada);
        retomada = setTimeout(iniciarAutomatico, 7000);
      };

      anterior.addEventListener("click", () => {
        mover(atual === 0 ? total - 1 : atual - 1, true);
        anterior.blur();
      });
      proximo.addEventListener("click", () => {
        mover(atual + 1, true);
        proximo.blur();
      });
      galeria.addEventListener("mouseenter", parar);
      galeria.addEventListener("mouseleave", iniciarAutomatico);
      galeria.addEventListener("focusin", parar);
      galeria.addEventListener("focusout", () => setTimeout(iniciarAutomatico, 50));
      faixa.addEventListener("pointerdown", pausarTemporariamente, { passive: true });
      faixa.addEventListener("keydown", event => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          mover((atual + (event.key === "ArrowRight" ? 1 : total - 1)) % total, true);
        }
      });
      faixa.addEventListener("scroll", () => {
        if (Date.now() < programaticoAte) return;
        limparTempo(scrollFim);
        scrollFim = setTimeout(() => {
          const viewport = faixa.getBoundingClientRect();
          const centro = emCelular() ? viewport.left + viewport.width / 2 : viewport.left + 16;
          let melhor = 0, distanciaMinima = Infinity;
          [...fotos, ...clones].forEach((item, i) => {
            const r = item.getBoundingClientRect();
            const x = emCelular() ? r.left + r.width / 2 : r.left;
            const distancia = Math.abs(x - centro);
            if (distancia < distanciaMinima) { distanciaMinima = distancia; melhor = i; }
          });
          atual = melhor % total;
          if (melhor >= total) voltarAoInicio();
          pausarTemporariamente();
        }, 160);
      }, { passive: true });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) parar();
        else iniciarAutomatico();
      });
      window.addEventListener("resize", () => {
        parar();
        ir(fotos[atual], false);
        iniciarAutomatico();
      }, { passive: true });
      iniciarAutomatico();
    });
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  else iniciar();
})();