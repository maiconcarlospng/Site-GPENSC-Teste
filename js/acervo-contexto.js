/* Referencias historicas do Instagram nas areas do site: nao altera o CMS. */
(() => {
  'use strict';
  const root = document.getElementById('gp-ig-contextual');
  if (!root) return;
  const page = (window.location.pathname.split('/').pop() || 'index.html').replace(/\.html?$/i, '').toLowerCase();
  const settings = {
    index: {
      heading: 'O GPENSC no Instagram',
      limit: 3,
      filter: p => p.origem === 'gpenscufop' &&
        ['Pesquisa', 'Divulgação científica', 'Nossa história', 'Ensino / Extensão'].includes(p.categoria)
    },
    grupo: {
      heading: 'Nossa trajetória no Instagram',
      filter: p => p.categoria === 'Nossa história' &&
        ['Defesas e qualificações', 'Internacionalização e intercâmbios', 'Memória e trajetória'].includes(p.tema)
    },
    pesquisa: {
      heading: 'Pesquisas divulgadas no Instagram',
      filter: p => p.categoria === 'Pesquisa' &&
        !['Equipe e integrantes', 'Defesas e qualificações', 'Congressos e encontros'].includes(p.tema)
    },
    extensao: {
      heading: 'Registros relacionados à extensão',
      // Ensino e extensão foram coletados numa categoria conjunta. Exigir menção explicita
      // a extensao impede apresentar cursos comuns como projetos de extensao certificados.
      filter: p => p.categoria === 'Ensino / Extensão' &&
        /extens[aã]o/i.test([p.titulo, p.resumo].join(' '))
    },
    ensino: {
      heading: 'Formação e ensino no Instagram',
      filter: p => p.categoria === 'Ensino / Extensão' &&
        ['Formação e cursos', 'Capacitação em epidemiologia'].includes(p.tema)
    },
    conteudos: {
      heading: 'Divulgação científica no Instagram',
      filter: p => p.categoria === 'Divulgação científica' &&
        ['GPENSC no Ar e podcasts', 'Divulgação e educação alimentar', 'Ciência e sociedade'].includes(p.tema)
    }
  };
  const context = settings[page];
  if (!context) { root.remove(); return; }

  const title = root.querySelector('.gp-ig-contexto-titulo');
  const grid = root.querySelector('.gp-ig-contexto-grade');
  const status = root.querySelector('.gp-ig-contexto-status');
  const link = root.querySelector('.gp-ig-contexto-link');
  if (title) title.textContent = context.heading;
  if (link) link.href = 'acervo-instagram.html';

  const files = Array.from({length: 7}, (_, i) =>
    'data/instagram/registros-' + String(i + 1).padStart(2, '0') + '.json');
  const textEl = (tag, css, content) => {
    const e = document.createElement(tag);
    if (css) e.className = css;
    e.textContent = content || '';
    return e;
  };
  const crop = (s, n) => {
    const clean = String(s || '').replace(/\s+/g, ' ').trim();
    return clean.length > n ? clean.slice(0, n).trimEnd().replace(/[.,;:!?-]+$/, '') + '…' : clean;
  };
  const safeInstagram = raw => {
    try {
      const u = new URL(raw);
      return u.protocol === 'https:' && ['instagram.com','www.instagram.com'].includes(u.hostname) ? u.href : '';
    } catch { return ''; }
  };
  const dateBR = date => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return 'Registro sem data';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC', month: 'short', year: 'numeric'
    }).format(new Date(date + 'T12:00:00Z'));
  };
  const selectBalanced = list => {
    const chosen = [];
    const themes = new Set();
    for (const p of list) {
      if (themes.has(p.tema)) continue;
      chosen.push(p);
      themes.add(p.tema);
      if (chosen.length === 4) return chosen;
    }
    for (const p of list) {
      if (chosen.some(x => x.id === p.id)) continue;
      chosen.push(p);
      if (chosen.length === 4) break;
    }
    return chosen;
  };
  function render(posts) {
    const selected = selectBalanced(
      posts.filter(p => p && p.data && context.filter(p) && safeInstagram(p.url))
        .sort((a, b) => b.data.localeCompare(a.data))
    ).slice(0, context.limit || 4);
    if (!selected.length) {
      root.remove();
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const p of selected) {
      const card = textEl('article', 'gp-ig-contexto-card');
      const label = textEl('div', 'gp-ig-contexto-meta', dateBR(p.data) + ' · ' + p.tema);
      const h3 = textEl('h3', 'gp-ig-contexto-nome', crop(p.titulo || p.resumo || p.tema, 106));
      const excerpt = textEl('p', 'gp-ig-contexto-resumo', crop(p.resumo, 148));
      const source = textEl('a', 'gp-ig-contexto-fonte', 'Ver postagem original');
      source.href = safeInstagram(p.url);
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      card.append(label, h3, excerpt, source);
      fragment.append(card);
    }
    grid.replaceChildren(fragment);
    if (status) status.remove();
    root.hidden = false;
  }

  Promise.all(files.map(async file => {
    const response = await fetch(file, {cache: 'force-cache'});
    if (!response.ok) throw new Error('Falha ao carregar o acervo');
    const result = await response.json();
    if (!Array.isArray(result)) throw new Error('Formato incorreto do acervo');
    return result;
  })).then(chunks => {
    const unique = new Map();
    chunks.flat().forEach(p => { if (p && p.id) unique.set(p.id, p); });
    render([...unique.values()]);
  }).catch(() => {
    // Nao interfere com o resto da pagina caso os dados estejam indisponiveis.
    root.remove();
  });
})();