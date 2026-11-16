/* GPENSC — galeria editorial: fotografias reais, sem clones nem autoplay.
   Navegação acessível por setas, teclado e deslize horizontal. */
(() => {
  "use strict";

  function iniciar() {
    document.querySelectorAll(".galeria--editorial").forEach(galeria => {
      if (galeria.dataset.galeriaPronta === "1") return;
      const faixa = galeria.querySelector(".galeria-faixa");
      const slides = [...galeria.querySelectorAll(".galeria-item")];
      const anterior = galeria.querySelector(".galeria-controle--anterior");
      const proximo = galeria.querySelector(".galeria-controle--proximo");
      const contador = galeria.querySelector(".galeria-contador");
      if (!faixa || slides.length === 0) return;

      galeria.dataset.galeriaPronta = "1";
      const reduzMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let atual = 0;
      let quadro = 0;

      function apresentar(indice) {
        atual = Math.max(0, Math.min(slides.length - 1, indice));
        if (contador) contador.textContent =
          String(atual + 1).padStart(2, "0") + " / " +
          String(slides.length).padStart(2, "0");
        if (anterior) anterior.disabled = atual === 0;
        if (proximo) proximo.disabled = atual === slides.length - 1;
      }

      function indiceCentral() {
        const retanguloFaixa = faixa.getBoundingClientRect();
        const centroFaixa = retanguloFaixa.left + retanguloFaixa.width / 2;
        let proximoIndice = 0;
        let menorDistancia = Infinity;
        slides.forEach((slide, indice) => {
          const retangulo = slide.getBoundingClientRect();
          const centro = retangulo.left + retangulo.width / 2;
          const distancia = Math.abs(centro - centroFaixa);
          if (distancia < menorDistancia) {
            menorDistancia = distancia;
            proximoIndice = indice;
          }
        });
        return proximoIndice;
      }

      function irPara(indice, semAnimacao = false) {
        const proximoIndice = Math.max(0, Math.min(slides.length - 1, indice));
        const slide = slides[proximoIndice];
        const retanguloFaixa = faixa.getBoundingClientRect();
        const retanguloSlide = slide.getBoundingClientRect();
        const destino = faixa.scrollLeft +
          (retanguloSlide.left + retanguloSlide.width / 2) -
          (retanguloFaixa.left + retanguloFaixa.width / 2);

        faixa.scrollTo({
          left: destino,
          behavior: semAnimacao || reduzMovimento() ? "auto" : "smooth"
        });
        apresentar(proximoIndice);
      }

      anterior?.addEventListener("click", () => irPara(atual - 1));
      proximo?.addEventListener("click", () => irPara(atual + 1));
      faixa.addEventListener("keydown", evento => {
        if (evento.key === "ArrowLeft") {
          evento.preventDefault();
          irPara(atual - 1);
        } else if (evento.key === "ArrowRight") {
          evento.preventDefault();
          irPara(atual + 1);
        }
      });

      faixa.addEventListener("scroll", () => {
        if (quadro) cancelAnimationFrame(quadro);
        quadro = requestAnimationFrame(() => apresentar(indiceCentral()));
      }, { passive: true });

      window.addEventListener("resize", () => irPara(atual, true), { passive: true });
      apresentar(0);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }
})();
