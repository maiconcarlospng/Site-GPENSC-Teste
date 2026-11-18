(() => {
  const root = document.querySelector('[data-agenda]');
  const source = document.querySelector('.gp-agenda-dados');
  if (!root || !source) return;
  const entries = [...source.querySelectorAll('[data-dia]')].map(el => ({...el.dataset, titulo:el.textContent.trim()})).sort((a,b)=>a.dia.localeCompare(b.dia));
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part = type => parts.find(p=>p.type===type).value;
  const today = [part('year'),part('month'),part('day')].join('-');
  const list = root.querySelector('.gp-ag-lista');
  const make = (tag,text) => Object.assign(document.createElement(tag),{textContent:text});
  function show(items,empty) {
    list.replaceChildren();
    for (const item of items) {
      const card = make('article','');
      card.append(make('small',[item.dia.split('-').reverse().join('/'),item.tipo].filter(Boolean).join(' · ')),make('strong',item.titulo));
      if(item.local) card.append(make('span',item.local));
      if(/^https?:\/\//i.test(item.url || '')) {const link=make('a','Mais informações');link.href=item.url;card.append(link)}
      list.append(card);
    }
    if(!items.length) list.append(make('p',empty));
  }
  root.hidden=false;
  if(root.dataset.agenda==='inicio') {show(entries.filter(e=>e.dia>=today).slice(0,3),'Nenhuma atividade programada no momento.');return}
  let month = new Date(Number(part('year')),Number(part('month'))-1,1);
  const grid=root.querySelector('.gp-ag-grade'), period=root.querySelector('[data-periodo]');
  function render() {
    const y=month.getFullYear(),m=month.getMonth(),prefix=y+'-'+String(m+1).padStart(2,'0')+'-';
    const events=entries.filter(e=>e.dia.startsWith(prefix));
    const label=month.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    root.querySelector('.gp-ag-nav strong').textContent=label;
    period.textContent='Atividades de '+label;
    show(events,'Nenhuma atividade cadastrada neste mês.');
    grid.replaceChildren();
    for(const day of ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']) grid.append(make('small',day));
    for(let i=0;i<(month.getDay()+6)%7;i++) grid.append(make('span',''));
    for(let day=1;day<=new Date(y,m+1,0).getDate();day++) {
      const iso=prefix+String(day).padStart(2,'0'),items=events.filter(e=>e.dia===iso);
      const cell=make(items.length?'button':'span',String(day));
      if(iso===today)cell.setAttribute('aria-current','date');
      if(items.length){cell.type='button';cell.setAttribute('aria-label',day+' de '+label+', '+items.length+' atividade(s)');cell.onclick=()=>{period.textContent='Atividades de '+day+' de '+label;show(items,'')}}
      grid.append(cell);
    }
  }
  for(const button of root.querySelectorAll('[data-mover]')) button.onclick=()=>{month.setMonth(month.getMonth()+Number(button.dataset.mover));render()};
  root.querySelector('[data-hoje]').onclick=()=>{month=new Date(Number(part('year')),Number(part('month'))-1,1);render()};
  render();
})();