(() => {
  const section = document.querySelector('[data-posts-area]');
  if (!section) return;
  const make = (tag, text) => Object.assign(document.createElement(tag), {textContent: text || ''});
  const select = section.querySelector('select');
  const list = section.querySelector('.ig-post-list');
  const more = section.querySelector('button');
  const status = section.querySelector('[role=status]');
  let posts = [], matches = [], offset = 0;
  function append() {
    for (const post of matches.slice(offset, offset + 12)) {
      const card = make('article');
      const link = make('a','Ver publicação original');
      link.href = 'https://www.instagram.com/p/' + encodeURIComponent(post.id) + '/';
      if (post.capa) {
        const img = make('img');
        img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
        img.src = 'img/instagram-acervo/' + post.id + '.webp';
        card.append(img);
      }
      const date = post.data.split('-').reverse().join('/');
      const caption = make('p', post.texto);
      const details = make('details');
      details.append(make('summary','Ler legenda completa'),caption);
      card.append(make('small',date + ' · ' + post.tema),make('p',post.texto.split(/\n/).find(line=>line.trim())?.slice(0,150) || 'Registro do GPENSC'),details,link);
      list.append(card);
    }
    offset = Math.min(offset + 12, matches.length);
    more.hidden = offset >= matches.length;
    status.textContent = offset + ' de ' + matches.length + ' publicações';
  }
  function filter() {
    matches = posts.filter(p => !select.value || p.tema === select.value);
    offset = 0; list.replaceChildren(); append();
  }
  fetch('data/instagram/por-area/' + section.dataset.postsArea + '.json').then(r => {
    if (!r.ok) throw Error(); return r.json();
  }).then(data => {
    posts = data;
    for (const theme of [...new Set(posts.map(p=>p.tema))].sort((a,b)=>a.localeCompare(b,'pt-BR'))) select.add(new Option(theme,theme));
    select.onchange = filter; more.onclick = append; filter();
  }).catch(() => {status.textContent = 'Não foi possível carregar as publicações. Atualize a página para tentar novamente.';});
})();