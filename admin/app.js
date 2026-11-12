(() => {
'use strict';
const REPO='maiconcarlospng/Site-GPENSC-Teste';
const BRANCH='main';
const WORKER='https://sveltia-cms-auth.maicon-carlos.workers.dev';
const API='https://api.github.com';
const $=s=>document.querySelector(s);
const state={token:sessionStorage.getItem('gpen_admin_token')||'',user:null,config:null,collections:[],active:null,contents:{},sha:{},editing:null};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=(message,error=false)=>{const el=document.createElement('div');el.className='toast'+(error?' error':'');el.textContent=message;$('#toast-root').append(el);setTimeout(()=>el.remove(),3800)};
const apiHeaders=()=>({'Authorization':'Bearer '+state.token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'});
async function api(path,options={}){const r=await fetch(API+path,{...options,headers:{...apiHeaders(),...(options.headers||{})}});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.message||'Falha ao comunicar com o GitHub.');return data}
function login(){
  const workerOrigin=new URL(WORKER).origin;
  const url=WORKER+'/auth?provider=github&site_id='+encodeURIComponent(location.hostname)+'&scope=repo';
  const popup=window.open(url,'gpen-github-auth','width=620,height=720,menubar=no,toolbar=no');
  if(!popup){toast('Permita a abertura da janela de autenticação.',true);return}
  $('#login-status').textContent='Aguardando autorização do GitHub…';
  let finished=false;
  const finish=()=>{if(finished)return;finished=true;clearTimeout(timeout);window.removeEventListener('message',listener)};
  const timeout=setTimeout(()=>{
    finish();
    $('#login-status').textContent='A autenticação não foi concluída. Feche a janela de autorização e tente novamente.';
  },180000);
  function listener(event){
    if(event.origin!==workerOrigin||event.source!==popup)return;
    const msg=String(event.data||'');
    // O Worker inicia um handshake: a janela principal precisa responder
    // para que o callback envie o token de volta com segurança.
    if(msg==='authorizing:github'){
      popup.postMessage('authorizing:github',workerOrigin);
      return;
    }
    if(!msg.startsWith('authorization:github:'))return;
    finish();
    try{
      const parts=msg.split(':');
      const result=JSON.parse(parts.slice(3).join(':'));
      if(parts[2]!=='success'||!result.token)throw new Error(result.error||'Autorização não concluída.');
      state.token=result.token;
      sessionStorage.setItem('gpen_admin_token',state.token);
      popup.close();
      initialize();
    }catch(e){
      $('#login-status').textContent=e.message;
      toast(e.message,true);
    }
  }
  window.addEventListener('message',listener);
}
async function initialize(){try{const user=await api('/user');state.user=user;$('#user-name').textContent=user.name||user.login;$('#login-view').hidden=true;$('#workspace').hidden=false;await loadConfig();await loadAll();renderNav();renderHome()}catch(e){state.token='';sessionStorage.removeItem('gpen_admin_token');$('#workspace').hidden=true;$('#login-view').hidden=false;$('#login-status').textContent=e.message;toast('Não foi possível conectar ao repositório.',true)}}
async function loadConfig(){const r=await api('/repos/'+REPO+'/contents/admin/config.yml?ref='+BRANCH);state.sha['admin/config.yml']=r.sha;const raw=decodeURIComponent(escape(atob(r.content.replace(/\n/g,''))));state.config=jsyaml.load(raw);state.collections=(state.config.collections||[]).flatMap(group=>(group.files||[]).map(file=>({...file,groupName:group.label,group:group.name})))}
async function readFile(path){const r=await api('/repos/'+REPO+'/contents/'+path+'?ref='+BRANCH);state.sha[path]=r.sha;return jsyaml.load(decodeURIComponent(escape(atob(r.content.replace(/\n/g,'')))))||{itens:[]}}
async function loadAll(){await Promise.all(state.collections.map(async item=>{try{state.contents[item.file]=await readFile(item.file)}catch(e){state.contents[item.file]={itens:[]}}}))}
function entryList(entry){return Array.isArray(state.contents[entry.file]?.itens)?state.contents[entry.file].itens:[]}
function isConfigCollection(entry){return entry?.group==='configuracoes'||String(entry?.file||'').startsWith('data/configuracoes/')}
function isGalleryCollection(entry){return entry?.name==='galeria'||entry?.file==='data/galeria.yml'}
function collectionSummary(entry){return isConfigCollection(entry)?'Configuração institucional':entryList(entry).length+' registros cadastrados'}
function titleOf(item){return item.titulo||item.nome||item.episodio||item.codigo||item.autor||'Registro sem título'}
function renderNav(){
  const nav=$('#collection-nav');
  const content=state.collections.map((c,i)=>({c,i})).filter(({c})=>!isConfigCollection(c));
  const settings=state.collections.map((c,i)=>({c,i})).filter(({c})=>isConfigCollection(c));
  const button=({c,i})=>'<button type="button" data-index="'+i+'" class="'+(state.active===i?'active':'')+'">'+
    '<span>'+esc(c.label)+'</span><span class="nav-count">'+(isConfigCollection(c)?'Editar':entryList(c).length)+'</span></button>';
  nav.innerHTML=
    '<button type="button" data-summary class="summary-nav-item '+(state.active===null?'active':'')+'"><span>Painel de resumo</span><span class="nav-count">Resumo</span></button>'+
    '<section class="menu-section menu-section-content" aria-label="Conteúdo do site">'+
      '<div class="menu-section-title">CONTEÚDO DO SITE</div>'+
      '<div class="menu-section-items">'+content.map(button).join('')+'</div>'+
    '</section>'+
    '<section class="menu-section menu-section-settings" aria-label="Configurações">'+
      '<div class="menu-section-title">CONFIGURAÇÕES</div>'+
      '<div class="menu-section-items">'+settings.map(button).join('')+'</div>'+
    '</section>';
  nav.querySelector('[data-summary]').addEventListener('click',()=>{renderHome();closeMobileMenu()});
  nav.querySelectorAll('[data-index]').forEach(b=>b.addEventListener('click',()=>{openCollection(Number(b.dataset.index));closeMobileMenu()}));
}
function renderHome(){state.active=null;$('#page-crumb').textContent='Painel de resumo';$('#collection-nav').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.hasAttribute('data-summary')));const total=key=>state.collections.filter(c=>c.name===key||c.group===key).reduce((n,c)=>n+entryList(c).length,0);const stats=[['Registros cadastrados',state.collections.reduce((n,c)=>n+entryList(c).length,0),'Conteúdos no repositório'],['Integrantes',state.collections.filter(c=>c.name==='equipe').reduce((n,c)=>n+entryList(c).length,0),'Equipe e colaboradores'],['Projetos',state.collections.filter(c=>c.name==='projetos').reduce((n,c)=>n+entryList(c).length,0),'Pesquisa e extensão'],['Notícias e eventos',state.collections.filter(c=>['noticias','eventos'].includes(c.name)).reduce((n,c)=>n+entryList(c).length,0),'Comunicação do grupo']];$('#page-content').innerHTML='<div class="page-heading"><div><span class="eyebrow">RESUMO DO REPOSITÓRIO</span><h1>Painel de resumo</h1><p>Gerencie os conteúdos institucionais do GPENSC em um só lugar.</p></div><button class="secondary-button" id="refresh-button">Atualizar dados</button></div><div class="stats-grid">'+stats.map(s=>'<article class="stat-card"><span>'+esc(s[0])+'</span><strong>'+s[1]+'</strong><small>'+esc(s[2])+'</small></article>').join('')+'</div><div class="panel-card"><h2>Áreas de gerenciamento</h2><div class="collection-grid">'+state.collections.map((c,i)=>'<button class="collection-card" data-open="'+i+'"><span class="eyebrow">'+esc(c.groupName||'CONTEÚDO')+'</span><strong>'+esc(c.label)+'</strong><small>'+esc(collectionSummary(c))+'</small></button>').join('')+'</div></div>';$('#refresh-button').onclick=async()=>{try{await loadAll();renderNav();renderHome();toast('Conteúdos atualizados.')}catch(e){toast(e.message,true)}};$('#page-content').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openCollection(Number(b.dataset.open)))}
function openCollection(index){state.active=index;const c=state.collections[index];if(isConfigCollection(c)){openConfigCollection(index);return}if(isGalleryCollection(c)){openGalleryCollection(index);return}renderNav();$('#page-crumb').textContent=c.label;const items=entryList(c);const fields=(c.fields||[]).find(f=>f.name==='itens')?.fields||[];const columns=fields.filter(f=>!['object','list'].includes(f.widget)).slice(0,3);const table=items.length?'<div class="table-wrap"><table class="data-table"><thead><tr>'+columns.map(f=>'<th>'+esc(f.label||f.name)+'</th>').join('')+'<th></th></tr></thead><tbody>'+items.map((item,i)=>'<tr>'+columns.map(f=>'<td>'+esc(String(item[f.name]??'—').slice(0,120))+'</td>').join('')+'<td><div class="row-actions"><button class="small-button" data-edit="'+i+'">Editar</button><button class="small-button danger-button" data-delete="'+i+'">Excluir</button></div></td></tr>').join('')+'</tbody></table></div>':'<div class="panel-card empty-state">Nenhum registro cadastrado nesta seção. Você pode começar adicionando o primeiro.</div>';const mobile=items.length?'<div class="mobile-record-list">'+items.map((item,i)=>'<article class="record-card"><div class="record-card-heading"><strong>'+esc(titleOf(item))+'</strong><span>Registro '+(i+1)+'</span></div><div class="record-card-meta">'+columns.filter(f=>f.name!=='titulo'&&f.name!=='nome').slice(0,2).map(f=>'<div><small>'+esc(f.label||f.name)+'</small><span>'+esc(String(item[f.name]??'—').slice(0,150))+'</span></div>').join('')+'</div><div class="record-card-actions"><button class="small-button" data-edit="'+i+'" aria-label="Editar '+esc(titleOf(item))+'">Editar</button><button class="small-button danger-button" data-delete="'+i+'" aria-label="Excluir '+esc(titleOf(item))+'">Excluir</button></div></article>').join('')+'</div>':'';const canBatch=Array.isArray(fields)&&fields.length>0;$('#page-content').innerHTML='<div class="page-heading collection-heading"><div><span class="eyebrow">'+esc(c.groupName||'GERENCIAMENTO')+'</span><h1>'+esc(c.label)+'</h1><p>'+items.length+' registros cadastrados nesta seção.</p></div><div class="collection-tools">'+(canBatch?'<button class="secondary-button" id="export-xlsx">Exportar Excel</button><button class="secondary-button" id="import-xlsx">Importar planilha</button>':'')+'<button class="primary-button" id="new-item">Adicionar registro</button></div></div>'+table+mobile;$('#new-item').onclick=()=>editItem(null);if(canBatch){$('#export-xlsx').onclick=()=>exportExcel(c,fields);$('#import-xlsx').onclick=()=>openExcelImport(c,fields)}$('#page-content').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editItem(Number(b.dataset.edit)));$('#page-content').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteItem(Number(b.dataset.delete)))}

function renderConfigControl(field,value,attribute='data-config-field'){
  const name=esc(field.name),label=esc(field.label||field.name),hint=field.hint?'<small>'+esc(field.hint)+'</small>':'';
  const required=field.required?'required':'';
  let control='';
  if(field.widget==='boolean'){
    control='<label class="config-toggle"><input type="checkbox" '+attribute+'="'+name+'" '+(value?'checked':'')+'><span>'+(value?'Ativado':'Desativado')+'</span></label>';
  }else if(field.widget==='text'||field.widget==='markdown'){
    control='<textarea '+attribute+'="'+name+'" '+required+'>'+esc(value??'')+'</textarea>';
  }else if(field.widget==='select'){
    const options=(field.options||[]).map(option=>'<option value="'+esc(option)+'" '+(String(option)===String(value??'')?'selected':'')+'>'+esc(option)+'</option>').join('');
    control='<select '+attribute+'="'+name+'" '+required+'><option value="">Selecione…</option>'+options+'</select>';
  }else{
    const type=field.widget==='number'?'number':field.widget==='date'?'date':'text';
    const pattern=Array.isArray(field.pattern)&&field.pattern[0]?' pattern="'+esc(field.pattern[0])+'"':'';
    control='<input type="'+type+'" '+attribute+'="'+name+'" value="'+esc(value??'')+'" '+required+pattern+'>';
  }
  return '<div class="field'+(['text','markdown'].includes(field.widget)?' full':'')+'"><label>'+label+(field.required?' *':'')+'</label>'+control+hint+'</div>';
}
function renderConfigListRow(field,item={}){
  const controls=(field.fields||[]).map(child=>renderConfigControl(child,item[child.name],'data-config-subfield')).join('');
  return '<div class="config-list-row" data-config-list-row><div class="config-list-row-fields">'+controls+'</div><button type="button" class="small-button danger-button" data-remove-config-row>Remover</button></div>';
}
function renderConfigField(field,value){
  if(field.widget!=='list'||!Array.isArray(field.fields))return renderConfigControl(field,value);
  const rows=Array.isArray(value)?value:[];
  return '<div class="field full config-list-field"><div class="config-list-heading"><label>'+esc(field.label||field.name)+'</label><button type="button" class="secondary-button" data-add-config-row="'+esc(field.name)+'">Adicionar item</button></div><div class="config-list-rows" data-config-list="'+esc(field.name)+'">'+rows.map(item=>renderConfigListRow(field,item)).join('')+'</div>'+(field.hint?'<small>'+esc(field.hint)+'</small>':'')+'</div>';
}
function openConfigCollection(index){
  state.active=index;
  const c=state.collections[index];
  const fields=Array.isArray(c.fields)?c.fields:[];
  const current=state.contents[c.file]&&typeof state.contents[c.file]==='object'?state.contents[c.file]:{};
  renderNav();
  $('#page-crumb').textContent=c.label;
  if(!fields.length){
    $('#page-content').innerHTML='<div class="panel-card empty-state">Esta configuração ainda não possui campos definidos no esquema do painel.</div>';
    return;
  }
  $('#page-content').innerHTML=
    '<div class="page-heading collection-heading"><div><span class="eyebrow">CONFIGURAÇÕES DO SITE</span><h1>'+esc(c.label)+'</h1><p>Edite os textos e opções desta área. As alterações serão gravadas no arquivo correspondente do site.</p></div><button type="button" class="secondary-button" id="back-to-summary">Painel de resumo</button></div>'+
    '<form id="config-form" class="config-form"><div class="panel-card"><div class="config-fields">'+fields.map(field=>renderConfigField(field,current[field.name]??field.default)).join('')+'</div></div>'+
    '<div class="config-actions"><span>As alterações só entram no site após salvar e publicar.</span><button type="submit" class="primary-button" id="save-config">Salvar configurações</button></div></form>';
  $('#back-to-summary').onclick=renderHome;
  const form=$('#config-form');
  form.addEventListener('click',event=>{
    const add=event.target.closest('[data-add-config-row]');
    if(add){
      const field=fields.find(item=>item.name===add.dataset.addConfigRow);
      const list=form.querySelector('[data-config-list="'+add.dataset.addConfigRow+'"]');
      if(field&&list)list.insertAdjacentHTML('beforeend',renderConfigListRow(field,{}));
      return;
    }
    const remove=event.target.closest('[data-remove-config-row]');
    if(remove)remove.closest('[data-config-list-row]')?.remove();
  });
  form.onsubmit=event=>saveConfigCollection(event,index,fields);
}
async function saveConfigCollection(event,index,fields){
  event.preventDefault();
  const form=event.currentTarget;
  const c=state.collections[index];
  const updated={...(state.contents[c.file]||{})};
  for(const field of fields){
    if(field.widget==='list'&&Array.isArray(field.fields)){
      const list=form.querySelector('[data-config-list="'+field.name+'"]');
      const rows=list?[...list.querySelectorAll('[data-config-list-row]')]:[];
      const values=[];
      for(const row of rows){
        const item={};
        for(const child of field.fields){
          const input=row.querySelector('[data-config-subfield="'+child.name+'"]');
          const value=!input?'':child.widget==='boolean'?input.checked:input.value;
          if(child.required&&(value===''||value===null||value===undefined)){
            toast('Preencha '+(child.label||child.name)+' em todos os itens.',true);
            input?.focus();
            return;
          }
          if(Array.isArray(child.pattern)&&child.pattern[0]&&value!==''&&!new RegExp(child.pattern[0]).test(String(value))){
            toast('Confira o formato de '+(child.label||child.name)+' em um dos itens.',true);
            input?.focus();
            return;
          }
          item[child.name]=value;
        }
        values.push(item);
      }
      updated[field.name]=values;
      continue;
    }
    const input=form.querySelector('[data-config-field="'+field.name+'"]');
    if(!input)continue;
    let value=field.widget==='boolean'?input.checked:input.value;
    if(field.widget==='number'&&value!=='')value=Number(value);
    if(field.required&&(value===''||value===null||value===undefined)){
      toast('Preencha o campo '+(field.label||field.name)+'.',true);
      input.focus();
      return;
    }
    if(Array.isArray(field.pattern)&&field.pattern[0]&&value!==''&&!new RegExp(field.pattern[0]).test(String(value))){
      toast('Confira o formato do campo '+(field.label||field.name)+'.',true);
      input.focus();
      return;
    }
    updated[field.name]=value;
  }
  const button=form.querySelector('#save-config');
  button.disabled=true;
  button.textContent='Salvando…';
  try{
    await saveCollection(c,updated);
    openConfigCollection(index);
    toast('Configuração salva no repositório.');
  }catch(error){
    button.disabled=false;
    button.textContent='Tentar novamente';
    toast(error.message,true);
  }
}


function galleryPreviewUrl(path){
  const value=String(path||'');
  if(/^https?:\/\//i.test(value))return value;
  return '../'+value.replace(/^\/+/,'');
}
function openGalleryCollection(index){
  state.active=index;
  const c=state.collections[index];
  const items=entryList(c);
  renderNav();
  $('#page-crumb').textContent=c.label;
  $('#page-content').innerHTML=
    '<div class="page-heading collection-heading"><div><span class="eyebrow">'+esc(c.groupName||'MÍDIA E INSTITUIÇÕES')+'</span><h1>'+esc(c.label)+'</h1><p>'+items.length+' fotos cadastradas. Gerencie as imagens, legendas e pontos de foco.</p></div><button type="button" class="secondary-button" id="gallery-back">Painel de resumo</button></div>'+
    '<form id="gallery-form" class="gallery-form"><div class="gallery-photo-grid">'+items.map((item,i)=>
      '<article class="gallery-photo-card" data-gallery-row data-index="'+i+'"><div class="gallery-photo-preview"><img src="'+esc(galleryPreviewUrl(item.arquivo))+'" alt="'+esc(item.legenda||'Foto da galeria')+'" loading="lazy"><span>Foto '+(i+1)+'</span></div>'+
      '<div class="gallery-photo-fields"><div class="field full"><label>Legenda</label><input type="text" data-gallery-caption value="'+esc(item.legenda||'')+'" placeholder="Descreva a foto (opcional)"></div>'+
      '<div class="field"><label>Foco horizontal (%)</label><input type="number" data-gallery-focus-x min="0" max="100" step="1" value="'+esc(item.foco_x??'')+'" placeholder="50"></div>'+
      '<div class="field"><label>Foco vertical (%)</label><input type="number" data-gallery-focus-y min="0" max="100" step="1" value="'+esc(item.foco_y??'')+'" placeholder="50"></div>'+
      '<div class="field full"><label>Substituir imagem</label><input type="file" data-gallery-replace accept="image/*"></div></div>'+
      '<button type="button" class="small-button danger-button" data-gallery-remove>Remover foto</button></article>'
    ).join('')+'</div>'+
    '<div class="panel-card gallery-add-card"><div><h2>Adicionar novas fotos</h2><p>Selecione uma ou várias imagens. Elas serão enviadas para a pasta de imagens do site.</p></div><div class="field full"><label for="gallery-add-files">Selecionar imagens</label><input id="gallery-add-files" type="file" accept="image/*" multiple></div></div>'+
    '<div class="config-actions"><span>As imagens e legendas serão gravadas no repositório após salvar.</span><button type="submit" class="primary-button" id="save-gallery">Salvar galeria</button></div></form>';
  $('#gallery-back').onclick=renderHome;
  const form=$('#gallery-form');
  form.addEventListener('click',event=>{
    const remove=event.target.closest('[data-gallery-remove]');
    if(remove)remove.closest('[data-gallery-row]')?.remove();
  });
  form.onsubmit=event=>saveGalleryCollection(event,index);
}
async function saveGalleryCollection(event,index){
  event.preventDefault();
  const form=event.currentTarget;
  const c=state.collections[index];
  const button=form.querySelector('#save-gallery');
  const originals=entryList(c);
  const updated=[];
  button.disabled=true;
  button.textContent='Enviando imagens…';
  try{
    for(const row of form.querySelectorAll('[data-gallery-row]')){
      const old=originals[Number(row.dataset.index)]||{};
      const item={...old};
      const replacement=row.querySelector('[data-gallery-replace]')?.files?.[0];
      if(replacement)item.arquivo='/'+await uploadImage(replacement);
      const caption=row.querySelector('[data-gallery-caption]')?.value??'';
      item.legenda=caption;
      const focusX=row.querySelector('[data-gallery-focus-x]')?.value??'';
      const focusY=row.querySelector('[data-gallery-focus-y]')?.value??'';
      for(const [key,value] of [['foco_x',focusX],['foco_y',focusY]]){
        if(value==='')delete item[key];
        else{
          const number=Number(value);
          if(!Number.isFinite(number)||number<0||number>100)throw new Error('Os pontos de foco devem estar entre 0 e 100.');
          item[key]=number;
        }
      }
      updated.push(item);
    }
    const additions=[...(form.querySelector('#gallery-add-files')?.files||[])];
    for(const file of additions){
      const path=await uploadImage(file);
      updated.push({arquivo:'/'+path,legenda:''});
    }
    button.textContent='Salvando galeria…';
    await saveCollection(c,{...state.contents[c.file],itens:updated});
    openGalleryCollection(index);
    toast('Galeria atualizada com '+updated.length+' foto(s).');
  }catch(error){
    button.disabled=false;
    button.textContent='Tentar novamente';
    toast(error.message,true);
  }
}

function defaultItem(fields){const item={};fields.forEach(f=>{if(f.widget==='list')item[f.name]=[];else if(f.widget==='object')item[f.name]=defaultItem(f.fields||[]);else if(f.widget==='boolean')item[f.name]=false;else item[f.name]=''});return item}
function editItem(index){const c=state.collections[state.active];const schema=(c.fields||[]).find(f=>f.name==='itens')?.fields||[];const original=index===null?defaultItem(schema):structuredClone(entryList(c)[index]);state.editing={index,original};const fields=schema.map(f=>renderField(f,original[f.name])).join('');$('#modal-root').innerHTML='<div class="modal-backdrop"><form class="modal" id="entry-form"><div class="modal-head"><h2>'+(index===null?'Novo registro':'Editar registro')+'</h2><button type="button" class="small-button" id="close-modal">Fechar</button></div><div class="modal-body">'+fields+'</div><div class="modal-foot"><span class="eyebrow">ALTERAÇÕES SALVAS NO GITHUB</span><div><button type="button" class="secondary-button" id="cancel-modal">Cancelar</button><button type="submit" class="primary-button" id="save-entry">Salvar alterações</button></div></div></form></div>';$('#close-modal').onclick=$('#cancel-modal').onclick=closeModal;$('#entry-form').onsubmit=e=>saveEntry(e,schema)}
function renderField(f,value){const name=esc(f.name),label=esc(f.label||f.name),full=['text','list','object','markdown'].includes(f.widget)?' full':'';let input='';if(f.widget==='select'||f.widget==='relation'){let options=f.options||[];if(f.widget==='relation'){const rel=state.collections.find(c=>c.group===f.collection&&c.name===f.file);const relFields=(rel?.fields||[]).find(x=>x.name==='itens')?.fields||[];const idField=f.value_field?.split('.').pop()||'id',displayField=f.display_fields?.[0]?.split('.').pop()||'nome';options=entryList(rel||{file:''}).map(item=>({label:item[displayField],value:item[idField]}))}input='<select name="'+name+'"><option value="">Selecione…</option>'+options.map(o=>{const v=typeof o==='object'?o.value:o;const l=typeof o==='object'?o.label:o;return '<option value="'+esc(v)+'" '+(String(v)===String(value??'')?'selected':'')+'>'+esc(l)+'</option>'}).join('')+'</select>'}else if(['text','markdown','list','object'].includes(f.widget)){const v=['list','object'].includes(f.widget)?JSON.stringify(value??(f.widget==='list'?[]:{}),null,2):value??'';input='<textarea name="'+name+'" '+(['list','object'].includes(f.widget)?'data-json="true"':'')+'>'+esc(v)+'</textarea>'}else if(f.widget==='boolean'){input='<select name="'+name+'"><option value="false" '+(!value?'selected':'')+'>Não</option><option value="true" '+(value?'selected':'')+'>Sim</option></select>'}else if(f.widget==='image'||f.widget==='file'){input='<input type="text" name="'+name+'" value="'+esc(value||'')+'" placeholder="Caminho do arquivo (ex.: img/foto.jpg)"><input type="file" data-upload-for="'+name+'" accept="image/*">'}else{const type=['date','datetime'].includes(f.widget)?'date':f.widget==='number'?'number':'text';input='<input type="'+type+'" name="'+name+'" value="'+esc(value??'')+'" '+(f.required?'required':'')+'>'}return '<div class="field'+full+'"><label>'+label+(f.required?' *':'')+'</label>'+input+(f.hint?'<small>'+esc(f.hint)+'</small>':'')+'</div>'}
async function saveEntry(event,schema){event.preventDefault();const form=event.currentTarget;const item={...state.editing.original};for(const f of schema){const el=form.elements.namedItem(f.name);if(!el)continue;let value=el.value;if(f.widget==='boolean')value=value==='true';if(['list','object'].includes(f.widget)){try{value=JSON.parse(value)}catch(e){toast('O campo '+(f.label||f.name)+' precisa conter JSON válido.',true);return}}if(value!==''||f.required||Object.prototype.hasOwnProperty.call(item,f.name))item[f.name]=value}const uploads=form.querySelectorAll('[data-upload-for]');for(const input of uploads){if(!input.files?.[0])continue;try{const path=await uploadImage(input.files[0]);item[input.dataset.uploadFor]=path}catch(e){toast(e.message,true);return}}const c=state.collections[state.active];const list=entryList(c).slice();if(state.editing.index===null)list.push(item);else list[state.editing.index]=item;try{await saveCollection(c,{...state.contents[c.file],itens:list});closeModal();openCollection(state.active);renderNav();toast('Registro salvo no repositório.')}catch(error){toast(error.message,true)}}

function normalizeHeader(value){return String(value??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function excelCell(value){if(value instanceof Date&&!isNaN(value))return value.toISOString().slice(0,10);return value??''}
function exportExcel(c,fields){if(!window.XLSX){toast('A biblioteca de planilhas ainda não carregou. Atualize a página.',true);return}const rows=entryList(c).map(item=>Object.fromEntries(fields.map(f=>[f.label||f.name,(['list','object'].includes(f.widget)&&item[f.name]!=null)?JSON.stringify(item[f.name]):(item[f.name]??'')])));const ws=XLSX.utils.json_to_sheet(rows.length?rows:[Object.fromEntries(fields.map(f=>[f.label||f.name,'']))]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Registros');XLSX.writeFile(wb,'GPENSC-'+c.name+'.xlsx');toast('Planilha exportada.')}
function openExcelImport(c,fields){if(!window.XLSX){toast('A biblioteca de planilhas ainda não carregou. Atualize a página.',true);return}$('#modal-root').innerHTML='<div class="modal-backdrop"><section class="modal excel-modal"><div class="modal-head"><div><span class="eyebrow">IMPORTAÇÃO EM LOTE</span><h2>Adicionar registros por Excel</h2></div><button type="button" class="small-button" id="close-excel">Fechar</button></div><div class="modal-body excel-body"><div class="excel-intro"><strong>Importe vários registros de uma só vez.</strong><p>Use uma planilha .xlsx, .xls ou .csv. A primeira linha deve conter os nomes dos campos. Os registros serão adicionados aos atuais, sem apagar o que já existe.</p></div><div class="field full"><label for="excel-file">Selecionar planilha</label><input id="excel-file" type="file" accept=".xlsx,.xls,.csv"></div><div id="excel-preview" class="excel-preview"><p>Depois de selecionar o arquivo, confira a prévia antes de salvar.</p></div></div><div class="modal-foot"><span class="eyebrow">A IMPORTAÇÃO SÓ É GRAVADA APÓS SUA CONFIRMAÇÃO</span><div><button type="button" class="secondary-button" id="cancel-excel">Cancelar</button><button type="button" class="primary-button" id="confirm-excel" disabled>Adicionar registros</button></div></div></section></div>';$('#close-excel').onclick=$('#cancel-excel').onclick=closeModal;let pending=[];const fileInput=$('#excel-file');fileInput.onchange=async()=>{pending=[];$('#confirm-excel').disabled=true;const file=fileInput.files?.[0];if(!file)return;try{const data=await file.arrayBuffer();const wb=XLSX.read(data,{type:'array',cellDates:true});const sheet=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});if(!rows.length)throw new Error('A planilha está vazia ou não possui cabeçalho.');const headers=Object.keys(rows[0]);const mapping={};for(const f of fields){const candidates=[normalizeHeader(f.name),normalizeHeader(f.label)];mapping[f.name]=headers.find(h=>candidates.includes(normalizeHeader(h)))||null}const missing=fields.filter(f=>f.required&&!mapping[f.name]).map(f=>f.label||f.name);if(missing.length)throw new Error('Colunas obrigatórias não encontradas: '+missing.join(', ')+'. Use os nomes dos campos exibidos no painel.');const issues=[];pending=rows.map((row,i)=>{const item=defaultItem(fields);for(const f of fields){const h=mapping[f.name];if(!h)continue;let v=excelCell(row[h]);if(typeof v==='string')v=v.trim();if(['list','object'].includes(f.widget)&&v){try{v=JSON.parse(v)}catch{issues.push('Linha '+(i+2)+': '+(f.label||f.name)+' deve estar em JSON válido.')}}else if(f.widget==='boolean'){v=String(v).toLowerCase()==='true'||String(v).toLowerCase()==='sim'||String(v)==='1'}else if(f.widget==='number'&&v!==''){v=Number(String(v).replace(',','.'));if(!Number.isFinite(v))issues.push('Linha '+(i+2)+': valor numérico inválido em '+(f.label||f.name)+'.')}if(v!==''&&v!==undefined)item[f.name]=v}for(const f of fields.filter(x=>x.required)){if(item[f.name]===''||item[f.name]===undefined)issues.push('Linha '+(i+2)+': falta preencher '+(f.label||f.name)+'.')}return item});const preview=$('#excel-preview');preview.innerHTML='<div class="excel-summary"><strong>'+pending.length+' linhas encontradas</strong><span>'+Object.values(mapping).filter(Boolean).length+' de '+fields.length+' colunas reconhecidas</span></div><div class="excel-columns">'+fields.map(f=>'<span class="'+(mapping[f.name]?'mapped':'unmapped')+'">'+esc(f.label||f.name)+(mapping[f.name]?' · '+esc(mapping[f.name]):' · não encontrada')+'</span>').join('')+'</div>'+(issues.length?'<div class="excel-errors"><strong>Corrija antes de importar:</strong><ul>'+issues.slice(0,12).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+(issues.length>12?'<small>e mais '+(issues.length-12)+' ocorrência(s).</small>':'')+'</div>':'<p class="excel-ready">Prévia validada. Os registros serão acrescentados ao final da lista.</p>');$('#confirm-excel').disabled=issues.length>0||!pending.length; }catch(e){$('#excel-preview').innerHTML='<div class="excel-errors">'+esc(e.message)+'</div>';pending=[]}};$('#confirm-excel').onclick=async()=>{if(!pending.length)return;const button=$('#confirm-excel');button.disabled=true;button.textContent='Salvando…';try{await saveCollection(c,{...state.contents[c.file],itens:[...entryList(c),...pending]});const count=pending.length;closeModal();openCollection(state.active);renderNav();toast(count+' registro(s) importado(s) com sucesso.')}catch(e){button.disabled=false;button.textContent='Tentar novamente';toast(e.message,true)}}}
async function saveCollection(c,content){const path=c.file;const text=jsyaml.dump(content,{noRefs:true,lineWidth:120,quotingType:'"',forceQuotes:false});const body={message:'Atualiza '+c.label+' pelo painel GPENSC',content:btoa(unescape(encodeURIComponent(text))),branch:BRANCH};if(state.sha[path])body.sha=state.sha[path];const r=await api('/repos/'+REPO+'/contents/'+path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});state.sha[path]=r.content.sha;state.contents[path]=content}
async function uploadImage(file){const safe=file.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-');const path='img/'+Date.now()+'-'+safe;const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)});await api('/repos/'+REPO+'/contents/'+path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Adiciona mídia pelo painel GPENSC',content:base64,branch:BRANCH})});return path}
async function deleteItem(index){if(!confirm('Deseja excluir este registro? A alteração será salva no repositório.'))return;const c=state.collections[state.active];const items=entryList(c).slice();items.splice(index,1);try{await saveCollection(c,{...state.contents[c.file],itens:items});openCollection(state.active);renderNav();toast('Registro excluído.')}catch(e){toast(e.message,true)}}
function closeModal(){$('#modal-root').innerHTML=''}
$('#login-button').addEventListener('click',login);
function closeMobileMenu(){const side=$('.sidebar');side.classList.remove('mobile-open');$('#mobile-sections').setAttribute('aria-expanded','false')}
$('#mobile-home').addEventListener('click',()=>{closeMobileMenu();renderHome();window.scrollTo({top:0,behavior:'smooth'})});
$('#mobile-sections').addEventListener('click',()=>{const side=$('.sidebar');const open=!side.classList.contains('mobile-open');side.classList.toggle('mobile-open',open);$('#mobile-sections').setAttribute('aria-expanded',String(open));if(open)side.scrollIntoView({behavior:'smooth',block:'start'})});
$('#mobile-logout').addEventListener('click',()=>$('#logout-button').click());
$('#logout-button').addEventListener('click',()=>{sessionStorage.removeItem('gpen_admin_token');state.token='';state.user=null;$('#workspace').hidden=true;$('#login-view').hidden=false;$('#login-status').textContent='Sessão encerrada.'});
if(state.token)initialize();
})();