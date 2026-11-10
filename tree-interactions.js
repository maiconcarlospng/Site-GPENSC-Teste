/* Expansão progressiva da árvore: galho, broto e folha. */
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-branch-toggle]');
  if (!button) return;

  const panelId = button.getAttribute('aria-controls');
  const panel = panelId && document.getElementById(panelId);
  if (!panel) return;

  const opening = button.getAttribute('aria-expanded') !== 'true';
  const currentLevel = button.closest('.branch-children');
  const scope = currentLevel || button.closest('.tree-map');

  if (scope) {
    const siblings = [...scope.querySelectorAll('[data-branch-toggle]')].filter((candidate) => {
      if (candidate === button) return false;
      return currentLevel
        ? candidate.closest('.branch-children') === currentLevel
        : !candidate.closest('.branch-children');
    });

    siblings.forEach((sibling) => {
      sibling.setAttribute('aria-expanded', 'false');
      const siblingPanel = document.getElementById(sibling.getAttribute('aria-controls'));
      if (!siblingPanel) return;
      siblingPanel.hidden = true;
      siblingPanel.querySelectorAll('[data-branch-toggle]').forEach((nested) => {
        nested.setAttribute('aria-expanded', 'false');
        const nestedPanel = document.getElementById(nested.getAttribute('aria-controls'));
        if (nestedPanel) nestedPanel.hidden = true;
      });
    });
  }

  button.setAttribute('aria-expanded', String(opening));
  panel.hidden = !opening;

  if (opening) {
    requestAnimationFrame(() => {
      const scroller = button.closest('.tree-world');
      const panelRect = panel.getBoundingClientRect();
      const viewportRect = scroller
        ? scroller.getBoundingClientRect()
        : { left: 0, right: window.innerWidth };
      const overflow = panelRect.right - viewportRect.right + 34;

      if (overflow > 0) {
        if (scroller) {
          scroller.scrollBy({ left: overflow, behavior: 'smooth' });
        } else {
          window.scrollBy({ left: overflow, behavior: 'smooth' });
        }
      }
    });
  }
});