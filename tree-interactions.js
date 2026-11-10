/* A árvore avança horizontalmente: um nível por clique */
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-branch-toggle]');
  if (!button) return;
  const panelId = button.getAttribute('aria-controls');
  const panel = panelId && document.getElementById(panelId);
  if (!panel) return;
  const opening = button.getAttribute('aria-expanded') !== 'true';
  const parent = button.parentElement;
  const siblingButtons = parent ? parent.querySelectorAll(':scope > [data-branch-toggle]') : [];
  siblingButtons.forEach((sibling) => {
    if (sibling === button) return;
    const siblingPanel = document.getElementById(sibling.getAttribute('aria-controls'));
    sibling.setAttribute('aria-expanded', 'false');
    if (siblingPanel) {
      siblingPanel.hidden = true;
      siblingPanel.querySelectorAll('[data-branch-toggle]').forEach((nested) => {
        nested.setAttribute('aria-expanded', 'false');
        const nestedPanel = document.getElementById(nested.getAttribute('aria-controls'));
        if (nestedPanel) nestedPanel.hidden = true;
      });
    }
  });
  button.setAttribute('aria-expanded', String(opening));
  panel.hidden = !opening;
  if (opening) {
    requestAnimationFrame(() => {
      const panelRect = panel.getBoundingClientRect();
      if (panelRect.right > window.innerWidth - 28) {
        window.scrollBy({left: panelRect.right - window.innerWidth + 80, behavior: 'smooth'});
      }
    });
  }
});
