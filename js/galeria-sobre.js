/* Galeria editorial da página Quem somos: fotos reais do acervo do GPENSC. */
(() => {
  'use strict';
  function iniciar() {
    document.querySelectorAll('.gp-sobre-fotos').forEach((galeria) => {
      const janela = galeria.querySelector('.gp-sobre-fotos-janela');
      const slides = [...galeria.querySelectorAll('.gp-sobre-foto')];
      const anterior = galeria.querySelector('.gp-sobre-fotos-anterior');
      const proximo = galeria.querySelector('.gp-sobre-fotos-proximo');
      const contador = galeria.querySelector('.gp-sobre-fotos-contador');
      if (!janela || slides.length === 0) return;
      let atual = 0;
      function atualizar(indice) {
        atual = Math.max(0, Math.min(slides.length - 1, indice));
        if (anterior) anterior.disabled = atual === 0;
        if (proximo) proximo.disabled = atual === slides.length - 1;
        if (contador) contador.textContent = 'Foto ' + (atual + 1) + ' de ' + slides.length;
      }
      function irPara(indice) {
        const destino = Math.max(0, Math.min(slides.length - 1, indice));
        janela.scrollTo({
          left: slides[destino].offsetLeft - slides[0].offsetLeft,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
        });
        atualizar(destino);
      }
      anterior?.addEventListener('click', () => irPara(atual - 1));
      proximo?.addEventListener('click', () => irPara(atual + 1));
      janela.addEventListener('keydown', (evento) => {
        if (evento.key === 'ArrowRight') { evento.preventDefault(); irPara(atual + 1); }
        if (evento.key === 'ArrowLeft') { evento.preventDefault(); irPara(atual - 1); }
      });
      let quadro = 0;
      janela.addEventListener('scroll', () => {
        if (quadro) cancelAnimationFrame(quadro);
        quadro = requestAnimationFrame(() => {
          const largura = Math.max(1, slides[1]?.offsetLeft - slides[0].offsetLeft || slides[0].clientWidth);
          atualizar(Math.round(janela.scrollLeft / largura));
        });
      }, { passive: true });
      atualizar(0);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true});
  else iniciar();
})();