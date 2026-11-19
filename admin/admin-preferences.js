/* Preferências visuais locais do painel GPENSC.
   Não altera dados do repositório, credenciais ou fluxo de publicação. */
(() => {
  'use strict';
  const storageKey = 'gpensc_admin_visual_prefs_v1';
  const keys = {
    dark: ['pref-dark', 'adminTheme', 'dark', 'light'],
    compact: ['pref-compact', 'adminDensity', 'compact', 'comfortable'],
    contrast: ['pref-contrast', 'adminContrast', 'high', 'normal'],
    font: ['pref-font', 'adminFont', 'large', 'normal'],
    motion: ['pref-motion', 'adminMotion', 'reduce', 'normal']
  };
  const trigger = document.getElementById('admin-settings-trigger');
  const dialog = document.getElementById('admin-preferences-dialog');
  if (!trigger || !dialog) return;

  const defaultSettings = () => ({dark:false, compact:false, contrast:false, font:false, motion:false});
  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const output = defaultSettings();
      Object.keys(output).forEach(key => output[key] = raw[key] === true);
      return output;
    } catch (_) {
      return defaultSettings();
    }
  }
  function persist(value) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (_) {
      /* The appearance still changes for this session if storage is blocked. */
    }
  }
  let current = read();
  function apply() {
    for (const [key, spec] of Object.entries(keys)) {
      document.documentElement.dataset[spec[1]] = current[key] ? spec[2] : spec[3];
    }
  }
  function syncInputs() {
    for (const [key, spec] of Object.entries(keys)) {
      const input = document.getElementById(spec[0]);
      if (input) input.checked = current[key];
    }
  }
  function close() {
    if (dialog.open) dialog.close();
  }
  function open() {
    syncInputs();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  apply();
  trigger.addEventListener('click', () => open());
  document.getElementById('admin-preferences-close')?.addEventListener('click', close);
  document.getElementById('admin-preferences-done')?.addEventListener('click', close);
  document.getElementById('admin-preferences-reset')?.addEventListener('click', () => {
    current = defaultSettings();
    persist(current);
    apply();
    syncInputs();
  });
  for (const [key, spec] of Object.entries(keys)) {
    document.getElementById(spec[0])?.addEventListener('change', event => {
      current[key] = Boolean(event.target.checked);
      persist(current);
      apply();
    });
  }
  dialog.addEventListener('click', event => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('close', () => {
    if (trigger.isConnected) trigger.focus({preventScroll:true});
  });
  /* Reuses the already-established mobile Home navigation, including
     its unsaved-changes guard; no duplicate editor logic. */
  document.getElementById('mobile-app-back')?.addEventListener('click', () => {
    document.getElementById('mobile-home')?.click();
  });
})();
