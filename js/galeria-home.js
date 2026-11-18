/* GPENSC — faixa de fotografias: centralizada no primeiro quadro e contínua
   nos dois sentidos. Pausa ao receber foco, hover ou interação manual. */
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
      const quantidadeClones = Math.min(3, total);
      const clonar = foto => {
        const copia = foto.cloneNode(true);
        copia.setAttribute("aria-hidden", "true");
        copia.dataset.galeriaClone = "1";
        copia.querySelectorAll("img").forEach(img => {
          img.alt = "";
          img.loading = "eager";
          img.removeAttribute("id");
        });
        return copia;
      };
      // Moldura anterior e posterior: os dois extremos podem fazer a volta
      // sem mostrar espaço vazio nem inverter a direção do movimento.
      const clonesInicio = fotos.slice(-quantidadeClones).map(clonar);
      [...clonesInicio].reverse().forEach(copia => faixa.insertBefore(copia, faixa.firstChild));
      const clonesFim = fotos.slice(0, quantidadeClones).map(clonar);
      clonesFim.forEach(copia => faixa.appendChild(copia));
      const itensTrilho = [...clonesInicio, ...fotos, ...clonesFim];
      const deslocamento = foto => {
        const fr = faixa.getBoundingClientRect();
        const ir = foto.getBoundingClientRect();
        let destino = faixa.scrollLeft + ir.left - fr.left;
        if (matchMedia("(max-width:767.98px)").matches) {
          destino -= (fr.width - ir.width) / 2;
        }
        return Math.max(0, destino);
      };

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

      // Indicadores reais da galeria: representam as fotos originais,
      // não os clones usados para a rolagem circular.
      const indicadores = document.createElement("div");
      indicadores.className = "gp-galeria-indicadores";
      indicadores.setAttribute("role", "group");
      indicadores.setAttribute("aria-label", "Selecionar fotografia");
      const bolinhas = fotos.map((_, i) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "gp-galeria-indicador";
        botao.setAttribute("aria-label", "Ir para fotografia " + (i + 1) + " de " + total);
        indicadores.appendChild(botao);
        return botao;
      });
      galeria.appendChild(indicadores);
      const atualizarIndicadores = () => bolinhas.forEach((botao, i) => {
        const ativo = i === atual;
        botao.classList.toggle("ativo", ativo);
        botao.setAttribute("aria-pressed", String(ativo));
      });
      let atual = 0, timer = null, retomada = null, scrollFim = null, saltar = null;
      atualizarIndicadores();
      bolinhas.forEach((botao, i) => botao.addEventListener("click", () => mover(i, true)));
      let programaticoAte = 0;
      const limparTempo = id => { if (id !== null) clearTimeout(id); };
      const parar = () => { if (timer !== null) clearInterval(timer); timer = null; };
      const ir = (foto, suave = true) => {
        if (!foto) return;
        programaticoAte = Date.now() + (suave ? 900 : 120);
        faixa.scrollTo({
          left: deslocamento(foto),
          behavior: suave && !reduzir.matches && !document.documentElement.classList.contains("gp-a11y-motion") ? "smooth" : "auto"
        });
      };
      const voltarAoOriginal = foto => {
        if (!foto) return;
        programaticoAte = Date.now() + 240;
        faixa.style.setProperty("scroll-behavior", "auto", "important");
        faixa.style.setProperty("scroll-snap-type", "none", "important");
        faixa.scrollLeft = deslocamento(foto);
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
          ir(clonesFim[0], true);
          saltar = setTimeout(() => voltarAoOriginal(fotos[0]), reduzir.matches ? 80 : 800);
        } else if (i < 0) {
          atual = total - 1;
          ir(clonesInicio[clonesInicio.length - 1], true);
          saltar = setTimeout(() => voltarAoOriginal(fotos[total - 1]), reduzir.matches ? 80 : 800);
        } else {
          atual = i;
          ir(fotos[atual], true);
        }
        atualizarIndicadores();
      };
      const podeAvancar = () => {
        if (document.hidden || reduzir.matches || document.documentElement.classList.contains("gp-a11y-motion")) return false;
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
        mover(atual - 1, true);
        anterior.blur();
      });
      proximo.addEventListener("click", () => {
        mover(atual + 1, true);
        proximo.blur();
      });
      document.addEventListener("gp:a11y-change", () => {
        if (document.documentElement.classList.contains("gp-a11y-motion")) parar();
        else iniciarAutomatico();
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
          itensTrilho.forEach((item, i) => {
            const r = item.getBoundingClientRect();
            const x = emCelular() ? r.left + r.width / 2 : r.left;
            const distancia = Math.abs(x - centro);
            if (distancia < distanciaMinima) { distanciaMinima = distancia; melhor = i; }
          });
          const base = clonesInicio.length;
          if (melhor < base) {
            atual = (total - base + melhor + total) % total;
            voltarAoOriginal(fotos[atual]);
          } else if (melhor >= base + total) {
            atual = (melhor - base - total) % total;
            voltarAoOriginal(fotos[atual]);
          } else {
            atual = melhor - base;
          }
          atualizarIndicadores();
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

      // Recentraliza no início depois que layout e fotos estiverem prontos.
      // O segundo frame e o evento load evitam que celulares mostrem o trilho
      // na posição zero enquanto imagens ainda estão carregando.
      const ajustarInicio = () => {
        if (atual !== 0) return;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          voltarAoOriginal(fotos[0]);
        }));
      };
      faixa.querySelectorAll("img").forEach(img => {
        if (!img.complete) img.addEventListener("load", ajustarInicio, { once: true });
      });
      window.addEventListener("pageshow", ajustarInicio, { once: true });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        voltarAoOriginal(fotos[0]);
        iniciarAutomatico();
      }));
    });
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  else iniciar();
})();
