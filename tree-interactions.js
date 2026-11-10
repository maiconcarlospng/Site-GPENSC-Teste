/* Interação dos galhos e subgalhos da árvore GPENSC */
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-branch-toggle]');
  if (!button) return;

  const panelId = button.getAttribute('aria-controls');
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;

  const opening = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(opening));
  panel.hidden = !opening;

  const limb = button.closest('.tree-limb');
  if (limb && button.classList.contains('limb-toggle')) {
    limb.classList.toggle('is-open', opening);
  }
});
