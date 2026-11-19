/* Calendário público: lê exclusivamente eventos e defesas gerados pelo Quarto. */
(() => {
  'use strict';
  const root = document.querySelector('[data-agenda]');
  const source = document.querySelector('.gp-agenda-dados');
  if (!root || !source) return;

  const entries = [...source.querySelectorAll('[data-dia]')]
    .map(el => ({...el.dataset, titulo:el.textContent.trim()}))
    .filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item.dia))
    .sort((a,b) => a.dia.localeCompare(b.dia));
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date());
  const part = type => parts.find(p => p.type === type).value;
  const today = [part('year'),part('month'),part('day')].join('-');
  const list = root.querySelector('.gp-ag-lista');
  if (!list) return;
  const make = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const monthName = date => date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  const shortMonth = iso => new Date(Number(iso.slice(0,4)),Number(iso.slice(5,7))-1,1)
    .toLocaleDateString('pt-BR',{month:'short'}).replace('.','');

  function show(items, mode = 'month') {
    list.replaceChildren();
    if (!items.length) {
      const state = make('div',undefined,'gp-ag-empty-state');
      const illustration = document.createElement('img');
      illustration.src = 'img/ilustracoes/agenda.svg';
      illustration.alt = '';
      illustration.setAttribute('aria-hidden','true');
      illustration.loading = 'lazy';
      state.append(illustration,
        make('strong',mode === 'day' ? 'Nenhuma atividade nesta data' : 'Sem atividades cadastradas neste mês'),
        make('p',mode === 'day'
          ? 'Escolha outro dia ou veja a programação do mês.'
          : 'Novas reuniões, defesas e eventos aparecem aqui quando forem publicados.'));
      list.append(state);
      return;
    }
    for (const item of items) {
      const card = make('article',undefined,'gp-ag-event');
      const date = make('div',undefined,'gp-ag-event-date');
      date.append(make('strong',String(Number(item.dia.slice(8,10)))),
        make('small',shortMonth(item.dia)));
      const body = make('div',undefined,'gp-ag-event-content');
      if (item.tipo) body.append(make('span',item.tipo));
      body.append(make('strong',item.titulo));
      if (item.local) body.append(make('p',item.local));
      if (/^https?:\/\//i.test(item.url || '')) {
        const link = make('a','Mais informações');
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        body.append(link);
      }
      card.append(date,body);
      list.append(card);
    }
  }

  root.hidden = false;
  if (root.dataset.agenda === 'inicio') {
    show(entries.filter(e => e.dia >= today).slice(0,3));
    return;
  }
  const grid = root.querySelector('.gp-ag-grade');
  const period = root.querySelector('[data-periodo]');
  const subtitle = root.querySelector('[data-subtitulo]');
  const total = root.querySelector('[data-total]');
  const totalLabel = root.querySelector('[data-total-label]');
  const viewAll = root.querySelector('[data-todos]');
  if (!grid || !period) return;

  let month = new Date(Number(part('year')),Number(part('month'))-1,1);
  let selected = null;
  function render() {
    const y = month.getFullYear(), m = month.getMonth();
    const prefix = y + '-' + String(m+1).padStart(2,'0') + '-';
    const label = monthName(month);
    const events = entries.filter(item => item.dia.startsWith(prefix));
    const selectedEvents = selected ? events.filter(item=>item.dia===selected) : events;
    const activeDay = selected ? Number(selected.slice(8,10)) : null;
    const dateLabel = selected ? activeDay+' de '+label : label;

    root.querySelector('.gp-ag-nav strong').textContent = label;
    period.textContent = selected ? 'Atividades de '+dateLabel : 'Atividades de '+label;
    if (subtitle) subtitle.textContent = selected
      ? (selectedEvents.length ? 'Programação da data selecionada.' : 'Nenhuma atividade registrada nesta data.')
      : (events.length ? 'Confira os compromissos registrados neste período.' : 'A programação deste período ainda não foi publicada.');
    if (total) total.textContent = String(events.length);
    if (totalLabel) totalLabel.textContent = events.length === 1 ? 'atividade no mês' : 'atividades no mês';
    if (viewAll) viewAll.hidden = !selected;
    show(selectedEvents,selected ? 'day' : 'month');

    grid.replaceChildren();
    for (const weekday of ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']) {
      grid.append(make('span',weekday,'gp-ag-weekday'));
    }
    for (let i=0;i<(month.getDay()+6)%7;i++) {
      const spacer = make('span',undefined,'gp-ag-empty');
      spacer.setAttribute('aria-hidden','true');
      grid.append(spacer);
    }
    for (let day=1;day<=new Date(y,m+1,0).getDate();day++) {
      const iso = prefix+String(day).padStart(2,'0');
      const count = events.filter(e=>e.dia===iso).length;
      const button = make('button',String(day),'gp-ag-day'+(count?' is-event':''));
      button.type = 'button';
      button.setAttribute('aria-label',day+' de '+label+(count?', '+count+(count===1?' atividade':' atividades'): ', sem atividades'));
      button.setAttribute('aria-pressed',String(iso===selected));
      if (iso===today) button.setAttribute('aria-current','date');
      button.addEventListener('click',()=>{selected=(selected===iso?null:iso);render();});
      grid.append(button);
    }
  }
  for (const button of root.querySelectorAll('[data-mover]')) {
    button.addEventListener('click',()=>{
      month = new Date(month.getFullYear(),month.getMonth()+Number(button.dataset.mover),1);
      selected = null;
      render();
    });
  }
  root.querySelector('[data-hoje]')?.addEventListener('click',()=>{
    month = new Date(Number(part('year')),Number(part('month'))-1,1);
    selected = null;
    render();
  });
  viewAll?.addEventListener('click',()=>{selected=null;render();});
  render();
})();
