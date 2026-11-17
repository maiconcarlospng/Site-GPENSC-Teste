(() => {
  'use strict';
  const root = document.getElementById('gp-ig-root');
  if (!root) return;

  const status = document.getElementById('gp-ig-status');
  const groupsEl = document.getElementById('gp-ig-grupos');
  const searchEl = document.getElementById('gp-ig-busca');
  const areaEl = document.getElementById('gp-ig-area');
  const yearEl = document.getElementById('gp-ig-ano');
  const yearNow = new Date().getFullYear();
  const files = Array.from({length: 7}, (_, i) => 'data/instagram/registros-' + String(i + 1).padStart(2, '0') + '.json');

  let records = [];
  const params = new URLSearchParams(window.location.search);

  function node(tag, className, content) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content !== undefined && content !== null) el.textContent = String(content);
    return el;
  }
  function safeLink(raw) {
    try {
      const parsed = new URL(raw);
      return parsed.protocol === 'https:' && (parsed.hostname === 'instagram.com' || parsed.hostname === 'www.instagram.com') ? parsed.href : '';
    } catch (_) { return ''; }
  }
  function formatDate(raw) {
    if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'Data não informada';
    return new Intl.DateTimeFormat('pt-BR', {timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric'})
      .format(new Date(raw + 'T12:00:00Z'));
  }
  function normalize(raw) {
    return String(raw || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  function option(select, value, label) {
    const el = node('option', '', label);
    el.value = value;
    select.append(el);
  }
  function render() {
    const term = normalize(searchEl.value.trim());
    const area = areaEl.value;
    const year = yearEl.value;
    const filtered = records.filter(post => {
      if (area && post.categoria !== area) return false;
      if (year && !post.data.startsWith(year)) return false;
      if (!term) return true;
      return normalize([post.titulo, post.resumo, post.tema, post.data].join(' ')).includes(term);
    });
    const byTheme = new Map();
    filtered.forEach(post => {
      const key = post.tema || 'Outros registros';
      if (!byTheme.has(key)) byTheme.set(key, []);
      byTheme.get(key).push(post);
    });
    const grouped = Array.from(byTheme, ([name, posts]) => ({
      name,
      posts: posts.sort((a, b) => b.data.localeCompare(a.data)),
    })).sort((a, b) => b.posts[0].data.localeCompare(a.posts[0].data) || a.name.localeCompare(b.name, 'pt-BR'));

    status.textContent = filtered.length + ' registros em ' + grouped.length + ' temas. ' +
      (area || year || term ? 'Filtros aplicados.' : 'Acervo em revisão editorial.');
    groupsEl.replaceChildren();
    if (!grouped.length) {
      groupsEl.append(node('p', 'gp-ig-empty', 'Nenhum registro encontrado. Tente outro termo ou remova os filtros.'));
      return;
    }

    const frag = document.createDocumentFragment();
    grouped.forEach(({name, posts}) => {
      const detail = node('details', 'gp-ig-tema');
      const summary = node('summary', 'gp-ig-tema-cabecalho');
      const info = node('span', 'gp-ig-tema-info');
      info.append(node('strong', 'gp-ig-tema-nome', name));
      const years = posts.map(x => Number(x.data.slice(0, 4))).filter(Number.isFinite);
      const since = years.length ? Math.min(...years) : yearNow;
      const until = years.length ? Math.max(...years) : yearNow;
      info.append(node('span', 'gp-ig-tema-detalhe',
        posts.length + (posts.length === 1 ? ' publicação · ' : ' publicações · ') +
        (since === until ? String(since) : since + '–' + until)));
      summary.append(info, node('span', 'gp-ig-tema-acao', 'Ver registros'));
      detail.append(summary);

      const list = node('ol', 'gp-ig-lista');
      posts.forEach(post => {
        const li = node('li', 'gp-ig-item');
        const meta = node('span', 'gp-ig-item-meta', formatDate(post.data) + ' · ' +
          (post.formato === 'Sidecar' || post.formato === 'carousel_container' ? 'Carrossel' :
            post.formato === 'Video' || post.formato === 'clips' ? 'Vídeo' : 'Imagem') +
          (post.origem && post.origem !== 'gpenscufop' ? ' · @' + post.origem : ''));
        const title = node('h3', 'gp-ig-item-titulo', post.titulo || 'Registro do GPENSC');
        const excerpt = node('p', 'gp-ig-item-resumo', post.resumo || 'Ver publicação original no Instagram.');
        li.append(meta, title, excerpt);
        const href = safeLink(post.url);
        if (href) {
          const link = node('a', 'gp-ig-fonte', 'Ver publicação original no Instagram');
          link.href = href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          li.append(link);
        }
        list.append(li);
      });
      detail.append(list);
      frag.append(detail);
    });
    groupsEl.append(frag);
  }

  status.textContent = 'Carregando registros do acervo…';
  Promise.all(files.map(async path => {
    const response = await fetch(path, {cache: 'no-cache'});
    if (!response.ok) throw new Error('Falha ao abrir o arquivo: ' + path);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Formato de acervo inválido.');
    return data;
  })).then(parts => {
    const unique = new Map();
    parts.flat().forEach(post => {
      if (post && post.id && post.data && post.tema) unique.set(post.id, post);
    });
    records = Array.from(unique.values()).sort((a, b) => b.data.localeCompare(a.data));
    const areas = [...new Set(records.map(x => x.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    areas.forEach(area => option(areaEl, area, area));
    const years = [...new Set(records.map(x => x.data.slice(0, 4)))].sort().reverse();
    years.forEach(year => option(yearEl, year, year));
    const desiredArea = params.get('area') || '';
    if (areas.includes(desiredArea)) areaEl.value = desiredArea;
    const desiredYear = params.get('ano') || '';
    if (years.includes(desiredYear)) yearEl.value = desiredYear;
    [searchEl, areaEl, yearEl].forEach(el => el.addEventListener(el === searchEl ? 'input' : 'change', render));
    render();
  }).catch(error => {
    status.textContent = 'Não foi possível carregar o acervo neste momento.';
    groupsEl.append(node('p', 'gp-ig-empty', 'Os dados importados não puderam ser carregados. ' + error.message));
  });
})();