(() => {
'use strict';
if (window.__GPEN_BATCH_PUBLISH__) return;
window.__GPEN_BATCH_PUBLISH__ = true;

const OWNER='maiconcarlospng';
const REPO='Site-GPENSC-Teste';
const FULL_REPO=OWNER+'/'+REPO;
const DRAFT='admin-rascunhos';
const MAIN='main';
const WORKER='https://sveltia-cms-auth.maicon-carlos.workers.dev';
const API='https://api.github.com';
let compareData=null;
let busy=false;
let modal=null;
let button=null;
let token=sessionStorage.getItem('gpen_admin_token')||'';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labelFor=path=>{
 const names={'data/noticias.yml':'Notícias','data/eventos.yml':'Agenda e eventos','data/linhas.yml':'Linhas de pesquisa','data/projetos.yml':'Projetos','data/publicacoes.yml':'Publicações','data/livros.yml':'Livros','data/defesas.yml':'Defesas e bancas','data/equipe.yml':'Equipe e integrantes','data/disciplinas.yml':'Disciplinas e ensino','data/linha_tempo.yml':'Linha do tempo','data/galeria.yml':'Galeria de fotos','data/videos.yml':'Vídeos','data/sites.yml':'Sites recomendados','data/apoio.yml':'Instituições parceiras','data/parcerias.yml':'Parcerias'};
 return names[path]||path;
};
async function publicApi(path){
 const r=await fetch(API+path,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},cache:'no-store'});
 const data=await r.json().catch(()=>({}));
 if(!r.ok) throw new Error(data.message||'Não foi possível consultar o GitHub.');
 return data;
}
async function authedApi(path,method='GET',body){
 const r=await fetch(API+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},body:body?JSON.stringify(body):undefined});
 const data=await r.json().catch(()=>({}));
 if(!r.ok) throw new Error(data.message||'Falha na operação autenticada do GitHub.');
 return data;
}
async function refresh(){
 try{
  compareData=await publicApi('/repos/'+FULL_REPO+'/compare/'+MAIN+'...'+DRAFT);
  renderButton();
  if(modal&&!modal.hidden) renderModal();
 }catch(error){
  compareData=null;
  renderButton(error.message);
 }
}
function ensureButton(){
 if(button||!document.body) return;
 button=document.createElement('button');
 button.type='button';
 button.id='gpen-batch-publish';
 button.addEventListener('click',openModal);
 document.body.append(button);
 renderButton();
}
function renderButton(error){
 if(!button)return;
 const count=compareData?.files?.length||0;
 button.innerHTML='<span class="gpen-batch-dot"></span><span>Salvar alterações</span><b>'+count+'</b>';
 button.classList.toggle('has-changes',count>0);
 button.title=error|| (count?count+' arquivo(s) alterado(s) aguardando publicação':'Nenhuma alteração aguardando publicação');
 button.setAttribute('aria-label',button.title);
}
function ensureModal(){
 if(modal)return;
 modal=document.createElement('div');
 modal.id='gpen-batch-modal';
 modal.className='gpen-batch-overlay';
 modal.hidden=true;
 modal.innerHTML='<section class="gpen-batch-dialog" role="dialog" aria-modal="true" aria-labelledby="gpen-batch-title">'+
 '<header><div><span class="gpen-batch-eyebrow">PUBLICAÇÃO DO SITE</span><h2 id="gpen-batch-title">Alterações pendentes</h2><p>Revise o que foi salvo no rascunho antes de atualizar o site público.</p></div><button type="button" data-close aria-label="Fechar">×</button></header>'+
 '<div class="gpen-batch-body" data-body><div class="gpen-batch-loading">Consultando alterações…</div></div>'+
 '<footer><span class="gpen-batch-note">O site público permanece intacto até a publicação.</span><div><button type="button" class="gpen-batch-secondary" data-close>Fechar</button><button type="button" class="gpen-batch-primary" data-publish disabled>Confirmar publicação</button></div></footer>'+
 '</section>';
 document.body.append(modal);
 modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-close]'))modal.hidden=true;if(e.target.closest('[data-publish]'))publish();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal&&!modal.hidden)modal.hidden=true;});
}
async function openModal(){
 ensureModal();modal.hidden=false;
 const publishButton=modal.querySelector('[data-publish]');publishButton.hidden=false;publishButton.textContent='Confirmar publicação';
 modal.querySelector('[data-body]').innerHTML='<div class="gpen-batch-loading">Consultando alterações…</div>';
 await refresh();
}
function renderModal(){
 if(!modal)return;
 const body=modal.querySelector('[data-body]');
 const files=compareData?.files||[];
 if(!compareData){body.innerHTML='<p class="gpen-batch-error">Não foi possível consultar a branch de rascunhos. Tente novamente.</p>';return;}
 if(!files.length){body.innerHTML='<div class="gpen-batch-empty"><strong>Tudo atualizado</strong><span>Não há alterações salvas aguardando publicação.</span></div>';modal.querySelector('[data-publish]').disabled=true;return;}
 body.innerHTML='<div class="gpen-batch-summary"><strong>'+files.length+' arquivo(s) modificado(s)</strong><span>As alterações estão guardadas em segurança e ainda não aparecem no site.</span></div><ul class="gpen-batch-files">'+files.map(file=>'<li><span class="gpen-batch-file-icon">YML</span><span><strong>'+esc(labelFor(file.filename))+'</strong><small>'+esc(file.filename)+'</small></span><em>'+({added:'Novo',modified:'Alterado',removed:'Removido',renamed:'Renomeado'}[file.status]||'Alterado')+'</em></li>').join('')+'</ul><div class="gpen-batch-warning">Ao publicar, todas essas alterações serão reunidas em uma única publicação na versão principal do site.</div>';
 modal.querySelector('[data-publish]').disabled=busy;
}
function login(){
 return new Promise((resolve,reject)=>{
  const popup=window.open(WORKER+'/auth?provider=github&site_id='+encodeURIComponent(location.hostname)+'&scope=repo','gpen-github-auth','width=620,height=720,menubar=no,toolbar=no');
  if(!popup){reject(new Error('Permita a abertura da janela de autenticação do GitHub.'));return;}
  const timeout=setTimeout(()=>{window.removeEventListener('message',listener);reject(new Error('A autenticação expirou. Tente novamente.'));},180000);
  function listener(event){
   if(event.origin!==new URL(WORKER).origin)return;
   const msg=String(event.data||'');
   if(!msg.startsWith('authorization:github:'))return;
   clearTimeout(timeout);window.removeEventListener('message',listener);
   try{
    const parts=msg.split(':');const result=JSON.parse(parts.slice(3).join(':'));
    if(parts[2]!=='success'||!result.token)throw new Error(result.error||'Autorização não concluída.');
    token=result.token;sessionStorage.setItem('gpen_admin_token',token);popup.close();resolve(token);
   }catch(error){reject(error);}
  }
  window.addEventListener('message',listener);
 });
}
async function publish(){
 if(busy)return;
 busy=true;
 const action=modal.querySelector('[data-publish]');
 action.disabled=true;action.textContent='Preparando publicação…';
 try{
  await refresh();
  const files=compareData?.files||[];
  if(!files.length)throw new Error('Não há alterações para publicar.');
  if(!token)await login();
  else {try{await authedApi('/user');}catch(e){token='';sessionStorage.removeItem('gpen_admin_token');await login();}}
  const open=await authedApi('/repos/'+FULL_REPO+'/pulls?state=open&head='+OWNER+':'+DRAFT+'&base='+MAIN);
  let pr=Array.isArray(open)&&open.length?open[0]:null;
  if(!pr){
   pr=await authedApi('/repos/'+FULL_REPO+'/pulls','POST',{
    title:'Atualização de conteúdos do GPENSC',
    head:DRAFT,base:MAIN,
    body:'Publicação conjunta dos conteúdos preparados no painel administrativo GPENSC.\n\nArquivos incluídos:\n'+files.map(f=>'- '+f.filename).join('\n')
   });
  }
  action.textContent='Publicando no site…';
  const merged=await authedApi('/repos/'+FULL_REPO+'/pulls/'+pr.number+'/merge','PUT',{
   merge_method:'squash',
   commit_title:'Atualiza conteúdos do GPENSC',
   commit_message:'Publicação conjunta pelo painel administrativo GPENSC',
   sha:pr.head.sha
  });
  if(!merged.merged)throw new Error(merged.message||'O GitHub não confirmou a publicação.');
  action.textContent='Finalizando…';
  await authedApi('/repos/'+FULL_REPO+'/git/refs/heads/'+DRAFT,'PATCH',{sha:merged.sha,force:true});
  compareData=null;
  modal.querySelector('[data-body]').innerHTML='<div class="gpen-batch-success"><strong>Publicação concluída</strong><span>As alterações foram reunidas em um único commit. O site será atualizado pelo GitHub Pages.</span><a href="https://github.com/'+FULL_REPO+'/commit/'+merged.sha+'" target="_blank" rel="noopener">Ver publicação no GitHub ↗</a></div>';
  action.hidden=true;
  renderButton();
 }catch(error){
  modal.querySelector('[data-body]').insertAdjacentHTML('beforeend','<p class="gpen-batch-error">'+esc(error.message)+'</p>');
  action.disabled=false;action.textContent='Tentar novamente';
 }finally{
  busy=false;
  if(!action.hidden&&action.textContent!=='Tentar novamente')action.textContent='Confirmar publicação';
  if(!action.hidden)action.disabled=!(compareData?.files?.length);
 }
}
function start(){
 ensureButton();
 refresh();
 setInterval(refresh,30000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
