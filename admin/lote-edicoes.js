/* GPENSC · edições em lote, revisão pré-publicação e rascunhos locais.
   Sem credenciais em armazenamento persistente; apenas conteúdo e metadados. */
(() => {
  'use strict';
  const KEY='gpensc_admin_pendentes_v3';
  const DB_NAME='gpensc_admin_midia_pendente_v1';
  const STORE='arquivos';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const short=(text,size=92)=>String(text??'').replace(/\s+/g,' ').slice(0,size);
  const encodeUTF8=text=>btoa(unescape(encodeURIComponent(text)));
  const filePath=path=>path.split('/').map(encodeURIComponent).join('/');
  const mediaSize=size=>size>=1024*1024?(size/1048576).toFixed(1)+' MB':(size/1024).toFixed(1)+' KB';
  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(new Error('Este navegador não oferece armazenamento de mídia para rascunhos.'));return}
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
      req.onerror=()=>reject(req.error||new Error('Falha no armazenamento local de mídia.'));
      req.onsuccess=()=>resolve(req.result);
    });
  }
  async function dbDo(mode,callback){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,mode);
        const request=callback(tx.objectStore(STORE));
        tx.oncomplete=()=>resolve(request.result);
        tx.onabort=()=>reject(tx.error||new Error('A gravação local foi interrompida.'));
        request.onerror=()=>reject(request.error);
        tx.onerror=()=>reject(tx.error);
      });
    } finally {db.close()}
  }
  const dbPut=(path,blob)=>dbDo('readwrite',store=>store.put(blob,path));
  const dbGet=path=>dbDo('readonly',store=>store.get(path));
  const dbDelete=path=>dbDo('readwrite',store=>store.delete(path));
  function toBase64(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('Não foi possível ler o arquivo local.'));
      reader.onload=()=>resolve(String(reader.result||'').split(',')[1]);
      reader.readAsDataURL(file);
    });
  }
  function displayName(record){
    if(!record||typeof record!=='object')return 'Registro';
    return short(record.titulo||record.nome||record.episodio||record.autor||record.codigo||record.id||record.data||'Registro sem título',95);
  }
  function identity(item){
    for(const field of ['id','codigo','lattes','url','titulo','nome','episodio','autor']){
      if(item?.[field]!==undefined&&item[field]!==null&&String(item[field]).trim())return field+':'+String(item[field]).trim();
    }
    return 'record:'+JSON.stringify(item);
  }
  function changes(before,after){
    const output={added:[],removed:[],modified:[],config:[]};
    const oldItems=Array.isArray(before?.itens)?before.itens:null;
    const newItems=Array.isArray(after?.itens)?after.itens:null;
    if(oldItems&&newItems){
      const oldMap=new Map(),newMap=new Map();
      oldItems.forEach(item=>{const key=identity(item);if(!oldMap.has(key))oldMap.set(key,[]);oldMap.get(key).push(item)});
      newItems.forEach(item=>{const key=identity(item);if(!newMap.has(key))newMap.set(key,[]);newMap.get(key).push(item)});
      for(const key of new Set([...oldMap.keys(),...newMap.keys()])){
        const a=oldMap.get(key)||[],b=newMap.get(key)||[];
        const size=Math.min(a.length,b.length);
        for(let i=0;i<size;i++)if(!equal(a[i],b[i]))output.modified.push(displayName(b[i]));
        b.slice(size).forEach(x=>output.added.push(displayName(x)));
        a.slice(size).forEach(x=>output.removed.push(displayName(x)));
      }
    }
    for(const key of new Set([...Object.keys(before||{}),...Object.keys(after||{})])){
      if(key==='itens'&&oldItems&&newItems)continue;
      if(!equal(before?.[key],after?.[key]))output.config.push({
        key,old:short(typeof before?.[key]==='object'?JSON.stringify(before[key]):before?.[key],85),
        next:short(typeof after?.[key]==='object'?JSON.stringify(after[key]):after?.[key],85)
      });
    }
    return output;
  }
  function create({state,api,repo,branch,toast}){
    let pending={},assets={},publishing=false,loaded=false,notice='';
    try{
      const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
      if(saved&&typeof saved==='object'){
        pending=saved.pending&&typeof saved.pending==='object'?saved.pending:{};
        assets=saved.assets&&typeof saved.assets==='object'?saved.assets:{};
      }
    }catch(error){notice='Não foi possível restaurar os rascunhos deste navegador.'}
    function persist(nextPending=pending,nextAssets=assets){
      try{localStorage.setItem(KEY,JSON.stringify({pending:nextPending,assets:nextAssets,version:3}))}
      catch(error){throw new Error('Sem espaço para guardar os rascunhos neste navegador. Publique ou remova alterações antigas antes de continuar.')}
    }
    function total(){return Object.keys(pending).length+Object.keys(assets).length}
    function updateUI(){
      const count=total();
      const label=document.getElementById('pending-count');
      if(label)label.textContent=count;
      const button=document.getElementById('pending-trigger');
      if(button){button.classList.toggle('has-pending',count>0);button.setAttribute('aria-label',count+' seções ou arquivos pendentes. Revisar antes de publicar.')}
      const mobile=document.getElementById('mobile-review');
      if(mobile){mobile.querySelector('span').textContent=count?'Revisar ('+count+')':'Revisar';mobile.classList.toggle('has-pending',count>0)}
      document.querySelectorAll('[data-batch-count]').forEach(el=>el.textContent=count);
      document.querySelectorAll('[data-batch-review]').forEach(el=>el.classList.toggle('has-pending',count>0));
    }
    function afterLoad(){
      state.remoteContents=clone(state.contents);
      for(const [path,draft] of Object.entries(pending)){
        if(!state.collections.some(c=>c.file===path)||!draft||!draft.content){delete pending[path];continue}
        state.contents[path]=clone(draft.content);
      }
      loaded=true;
      persist();updateUI();
    }
    function stage(entry,content){
      if(publishing)throw new Error('Publicação em andamento. Aguarde a conclusão da operação.');
      if(!loaded)throw new Error('O painel ainda não terminou de carregar os conteúdos.');
      const path=entry.file;
      if(!/^data\/[\w\-./]+\.ya?ml$/i.test(path))throw new Error('Arquivo fora das coleções permitidas.');
      const base=state.remoteContents?.[path];
      if(!base)throw new Error('O arquivo original não está disponível para revisão.');
      const next=clone(pending),before=pending[path]?.original||clone(base);
      if(equal(base,content))delete next[path];
      else next[path]={label:entry.label||path,baseSha:pending[path]?.baseSha||state.sha[path],original:before,content:clone(content),date:new Date().toISOString()};
      persist(next,assets);
      pending=next;state.contents[path]=clone(content);
      updateUI();
      return !equal(base,content);
    }
    async function stageMedia(file,replacePath=null,existingSha=null){
      if(publishing)throw new Error('Publicação em andamento.');
      if(!file||!file.size)throw new Error('Selecione um arquivo válido.');
      if(file.size>20*1024*1024)throw new Error('O arquivo deve ter até 20 MB.');
      const safe=file.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9._-]/g,'-');
      const path=replacePath||'img/'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'-'+safe;
      if(!path.startsWith('img/')||path.includes('..')||/[\u0000-\u001f]/.test(path))throw new Error('Caminho de mídia inválido.');
      await dbPut(path,file);
      const next=clone(assets);
      next[path]={path,name:file.name,size:file.size,sha:existingSha||null,action:existingSha?'substituir':'adicionar',date:new Date().toISOString()};
      try{persist(pending,next)}catch(error){await dbDelete(path);throw error}
      assets=next;updateUI();
      return path;
    }
    function localReferences(path){
      const refs=[];
      for(const c of state.collections||[]){
        const data=state.contents?.[c.file];
        if(data&&JSON.stringify(data).includes(path))refs.push(c.label||c.file);
      }
      return refs;
    }
    async function stageDeletion(path,sha,size=0){
      if(publishing)throw new Error('A publicação está em andamento.');
      if(typeof path!=='string'||!path.startsWith('img/')||path.includes('..')||/[\u0000-\u001f]/.test(path))throw new Error('Caminho de material inválido.');
      if(!/^[a-f0-9]{40}$/i.test(String(sha||'')))throw new Error('É necessário atualizar a biblioteca para identificar a versão do arquivo.');
      // Verificação por vínculo confirmado, não por bloqueio indiscriminado de pastas.
      const codeReferences=window.GPENSC_STATIC_MEDIA_REFERENCES;
      if(!codeReferences)throw new Error('O inventário de vínculos não carregou. Atualize o painel antes de excluir.');
      if(codeReferences.has(path))throw new Error('O arquivo ainda é usado pelo código ou pela identidade visual do site.');
      const linked=localReferences(path);
      if(linked.length)throw new Error('Material vinculado aos cadastros de '+linked.slice(0,5).join(', ')+'. Remova os vínculos nas edições primeiro e confira a fila.');
      const next=clone(assets);
      if(next[path]?.action==='adicionar'){ // Um novo arquivo ainda não publicado só precisa ser retirado da fila.
        delete next[path];persist(pending,next);assets=next;await dbDelete(path).catch(()=>{});updateUI();return 'cancelado';
      }
      next[path]={path,name:path.split('/').pop(),size,sha,action:'remover',date:new Date().toISOString()};
      persist(pending,next);assets=next;await dbDelete(path).catch(()=>{});updateUI();return 'pendente';
    }
    async function deleteAsset(path){
      if(publishing)return;
      if(Object.values(pending).some(x=>JSON.stringify(x.content).includes(path))){
        toast('Esta mídia é usada em um rascunho. Remova o vínculo no editor antes de descartá-la.',true);return false
      }
      const next=clone(assets);delete next[path];
      persist(pending,next);assets=next;await dbDelete(path).catch(()=>{});updateUI();return true;
    }
    function removeDraft(path){
      if(publishing)return false;
      const next=clone(pending);delete next[path];
      persist(next,assets);pending=next;
      if(state.remoteContents?.[path])state.contents[path]=clone(state.remoteContents[path]);
      updateUI();return true;
    }
    async function clearAll(){
      if(publishing)return;
      const oldAssets=Object.keys(assets);
      persist({},{});
      pending={};assets={};
      for(const [path,remote] of Object.entries(state.remoteContents||{}))state.contents[path]=clone(remote);
      await Promise.all(oldAssets.map(path=>dbDelete(path).catch(()=>{})));
      updateUI();
    }
    function reviewSections(){
      const rows=Object.entries(pending).map(([path,draft])=>{
        const summary=changes(draft.original,draft.content);
        const counts=[summary.added.length+' novos',summary.modified.length+' editados',summary.removed.length+' removidos',summary.config.length+' configurações'];
        const items=[
          ...summary.added.slice(0,9).map(label=>'<li><span class="batch-tag batch-tag-new">Novo</span>'+esc(label)+'</li>'),
          ...summary.modified.slice(0,9).map(label=>'<li><span class="batch-tag batch-tag-edit">Editado</span>'+esc(label)+'</li>'),
          ...summary.removed.slice(0,9).map(label=>'<li><span class="batch-tag batch-tag-remove">Removido</span>'+esc(label)+'</li>'),
          ...summary.config.slice(0,10).map(item=>'<li><span class="batch-tag batch-tag-edit">Campo</span><strong>'+esc(item.key)+'</strong><small>'+esc(item.old)+' → '+esc(item.next)+'</small></li>')
        ].join('');
        const remoteSha=state.sha[path],conflict=Boolean(remoteSha&&draft.baseSha&&remoteSha!==draft.baseSha);
        return '<article class="batch-review-item"><header><div><span class="eyebrow">'+esc(path)+'</span><h3>'+esc(draft.label)+'</h3><p>'+counts.join(' · ')+'</p></div><button type="button" class="batch-remove" data-batch-remove="'+esc(path)+'">Descartar</button></header>'+
          (conflict?'<p class="batch-conflict">O arquivo mudou no GitHub desde o início deste rascunho. Descarte e refaça a edição a partir da versão atual antes de publicar.</p>':'')+
          '<details><summary>Ver o que mudou</summary><ul class="batch-change-list">'+items+'</ul></details></article>';
      }).join('');
      const media=Object.values(assets).map(a=>'<article class="batch-media-item'+(a.action==='remover'?' batch-media-deletion':'')+'"><span class="batch-file-type">'+esc(a.action==='remover'?'REMOVER':a.action==='substituir'?'SUBSTITUIR':'NOVO ARQUIVO')+'</span><div><strong>'+esc(a.name)+'</strong><small>'+esc(a.path)+' · '+esc(mediaSize(a.size))+(a.action==='remover'?' · Arquivo será excluído do repositório':'')+'</small></div><button class="batch-remove" type="button" data-batch-remove-asset="'+esc(a.path)+'">'+(a.action==='remover'?'Cancelar exclusão':'Descartar')+'</button></article>').join('');
      return {rows,media};
    }
    function renderReview(container,handlers={}){
      const count=total(),parts=reviewSections();
      container.innerHTML='<div class="page-heading batch-review-heading"><div><span class="eyebrow">REVISÃO ANTES DA PUBLICAÇÃO</span><h1>Alterações pendentes</h1><p>Prepare várias mudanças e confira o conteúdo como em uma lista de revisão. Nada nesta fila foi enviado ao site.</p></div></div>'+
        '<div class="batch-summary-bar"><div><strong>'+count+'</strong><span>itens na fila</span></div><div><strong>'+Object.keys(pending).length+'</strong><span>seções editadas</span></div><div><strong>'+Object.keys(assets).length+'</strong><span>mídias</span></div></div>'+
        (notice?'<p class="batch-notice">'+esc(notice)+'</p>':'')+
        (count?'<section class="batch-review-list" aria-label="Resumo das alterações">'+parts.rows+parts.media+'</section>':'<div class="batch-empty"><h2>Nenhuma alteração pendente</h2><p>Edite notícias, equipe, agenda, projetos ou outras seções. Cada edição ficará aqui até a publicação.</p></div>')+
        '<div class="batch-checkout"><div><strong>Conferência final</strong><p>'+(state.authMode==='access-code'?'No acesso por código, os arquivos são enviados em sequência após sua confirmação. Se houver erro, os restantes continuam pendentes.':'No acesso com GitHub, as alterações são reunidas em um único commit.')+'</p></div><div class="batch-checkout-actions"><button type="button" class="secondary-button" id="batch-discard-all"'+(!count||publishing?' disabled':'')+'>Descartar tudo</button><button type="button" class="primary-button" id="batch-publish-all"'+(!count||publishing?' disabled':'')+'>Publicar tudo ('+count+' arquivo'+(count===1?'':'s')+')</button></div></div>'+
        '<p class="batch-publish-status" id="batch-publish-status" role="status"></p>';
      container.querySelectorAll('[data-batch-remove]').forEach(btn=>btn.onclick=()=>{
        if(!confirm('Descartar as alterações pendentes de '+btn.dataset.batchRemove+'?'))return;
        removeDraft(btn.dataset.batchRemove);renderReview(container,handlers);handlers.changed?.();
      });
      container.querySelectorAll('[data-batch-remove-asset]').forEach(btn=>btn.onclick=async()=>{
        if(!confirm('Descartar a mídia pendente?'))return;
        if(await deleteAsset(btn.dataset.batchRemoveAsset)){renderReview(container,handlers);handlers.changed?.()}
      });
      container.querySelector('#batch-discard-all').onclick=async()=>{
        if(!confirm('Descartar TODAS as edições pendentes e voltar aos conteúdos publicados? Esta ação não pode ser desfeita.'))return;
        await clearAll();renderReview(container,handlers);handlers.changed?.();toast('Rascunhos locais descartados.');
      };
      container.querySelector('#batch-publish-all').onclick=async()=>{
        if(!confirm('Confirmar a publicação de '+total()+' alteração(ões) no site do GPENSC?'))return;
        container.querySelectorAll('button').forEach(button=>button.disabled=true);
        const info=container.querySelector('#batch-publish-status');
        const progress=message=>{info.textContent=message};
        try{
          const result=await publish(progress);
          progress(result.message);
          toast(result.message);
          if(handlers.finished)await handlers.finished(result);
          else renderReview(container,handlers);
        }catch(error){
          notice=error.message||'Erro ao publicar alterações.';
          progress(notice);
          toast(notice,true);
          renderReview(container,handlers);
        }
      };
    }
    function yamlText(draft){
      return jsyaml.dump(draft.content,{noRefs:true,lineWidth:120,quotingType:'"',forceQuotes:false});
    }
    async function verify(ref=branch){
      for(const [path,draft] of Object.entries(pending)){
        if(!/^data\/[\w./\-]+\.ya?ml$/i.test(path))throw new Error('Arquivo indevido na fila de publicação.');
        const fresh=await api('/repos/'+repo+'/contents/'+filePath(path)+'?ref='+ref);
        if(fresh.sha!==draft.baseSha)throw new Error('Conflito no arquivo "'+draft.label+'". Alguém alterou esta seção depois de você iniciar o rascunho. Descarte apenas esta edição, atualize os dados e refaça a alteração.');
      }
      for(const meta of Object.values(assets)){
        if(meta.action==='remover'){
          const linked=localReferences(meta.path);
          if(linked.length)throw new Error('O material '+meta.name+' ainda é usado nos cadastros: '+linked.join(', ')+'.');
        }
        if(meta.sha&&state.authMode==='github'){
          const current=await api('/repos/'+repo+'/contents/'+filePath(meta.path)+'?ref='+ref);
          if(current.sha!==meta.sha)throw new Error('A mídia '+meta.name+' foi alterada no GitHub depois do rascunho. Remova-a da fila e selecione novamente.');
        }
        if(meta.action!=='remover'){
          const blob=await dbGet(meta.path);
          if(!blob)throw new Error('A mídia "'+meta.name+'" não está mais armazenada neste dispositivo. Descarte-a e selecione o arquivo novamente.');
        }
      }
    }
    async function submitAtomic(progress){
      // A branch pode avançar entre a leitura do HEAD e o PATCH. Nessa situação,
      // recriamos o commit sobre o HEAD mais recente, sem sobrescrever outros commits.
      const maxAttempts=4;
      const preparedBlobs=new Map();
      async function publicationResult(saved,createdTree){
        const contentShas={};
        for(const path of Object.keys(pending)){
          const entry=(createdTree.tree||[]).find(item=>item.path===path&&item.type==='blob');
          let sha=entry?.sha;
          if(!sha){
            // Atualizar os SHAs locais evita conflitos falsos na próxima edição.
            try{
              const published=await api('/repos/'+repo+'/contents/'+filePath(path)+'?ref='+saved.sha);
              sha=published.sha;
            }catch(error){ /* O commit já foi confirmado; não marcar a publicação como falha. */ }
          }
          if(sha)contentShas[path]=sha;
        }
        return {sha:saved.sha,contentShas,message:'Todas as alterações foram enviadas em um único commit. A publicação do site será processada pelo GitHub Actions.'};
      }
      for(let attempt=1;attempt<=maxAttempts;attempt++){
        progress(attempt===1
          ?'Preparando um único commit com todas as alterações…'
          :'O repositório mudou durante o envio. Atualizando a base e tentando novamente ('+attempt+'/'+maxAttempts+')…');
        const base=await api('/repos/'+repo+'/git/ref/heads/'+branch);
        const baseSha=base.object?.sha;
        if(!baseSha)throw new Error('Não foi possível identificar o commit atual do site.');
        // Em cada tentativa, verificar os arquivos editados na versão realmente atual.
        // Se a mesma seção foi alterada por outra pessoa, manter o rascunho para revisão.
        await verify(baseSha);
        const commit=await api('/repos/'+repo+'/git/commits/'+baseSha);
        const baseTree=commit.tree?.sha;
        if(!baseTree)throw new Error('Não foi possível acessar a árvore do repositório.');
        const tree=Object.entries(pending).map(([path,draft])=>({
          path,mode:'100644',type:'blob',content:yamlText(draft)
        }));
        for(const meta of Object.values(assets)){
          if(meta.action==='remover'){
            progress('Preparando exclusão: '+meta.name+'…');
            tree.push({path:meta.path,mode:'100644',type:'blob',sha:null});
            continue;
          }
          if(!preparedBlobs.has(meta.path)){
            progress('Preparando mídia: '+meta.name+'…');
            const blob=await dbGet(meta.path);
            const body={content:await toBase64(blob),encoding:'base64'};
            const created=await api('/repos/'+repo+'/git/blobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
            preparedBlobs.set(meta.path,created.sha);
          }
          tree.push({path:meta.path,mode:'100644',type:'blob',sha:preparedBlobs.get(meta.path)});
        }
        const createdTree=await api('/repos/'+repo+'/git/trees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base_tree:baseTree,tree})});
        const saved=await api('/repos/'+repo+'/git/commits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
          message:'Conteúdos GPENSC: publicação revisada de '+total()+' alterações via painel',
          tree:createdTree.sha,parents:[baseSha]
        })});
        progress('Confirmando a publicação no GitHub…');
        const fresh=await api('/repos/'+repo+'/git/ref/heads/'+branch);
        if(fresh.object?.sha!==baseSha){
          if(attempt<maxAttempts)continue;
          throw new Error('O repositório foi atualizado várias vezes durante o envio. Os rascunhos foram preservados; tente publicar novamente.');
        }
        try{
          await api('/repos/'+repo+'/git/refs/heads/'+branch,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:saved.sha,force:false})});
        }catch(error){
          // O GitHub pode concluir o PATCH mas a resposta se perder na conexão.
          // Verificar antes de tentar outro commit evita uma publicação duplicada.
          let latest;
          try{latest=await api('/repos/'+repo+'/git/ref/heads/'+branch)}catch(readError){throw error}
          if(latest.object?.sha===saved.sha)return publicationResult(saved,createdTree);
          const moved=latest.object?.sha!==baseSha;
          const nonFastForward=/fast[ -]?forward/i.test(String(error.message||''));
          if((moved||nonFastForward)&&attempt<maxAttempts)continue;
          if(moved||nonFastForward)throw new Error('O GitHub recebeu outras alterações durante a publicação. Seus rascunhos continuam salvos; tente novamente. Se a mesma seção foi alterada, revise o conflito antes de publicar.');
          throw error;
        }
        return publicationResult(saved,createdTree);
      }
      throw new Error('Não foi possível sincronizar a publicação com o repositório. Nenhum rascunho foi descartado.');
    }
    async function submitSequential(progress){
      const changes=[...Object.entries(pending).map(([path,draft])=>({path,draft,kind:'yaml'})),...Object.values(assets).map(meta=>({path:meta.path,meta,kind:meta.action==='remover'?'remove':'media'}))];
      let completed=0;
      // Arquivos novos primeiro, cadastros depois e exclusões por último.
      const priority={media:0,yaml:1,remove:2};
      changes.sort((a,b)=>priority[a.kind]-priority[b.kind]);
      for(const entry of changes){
        progress('Enviando '+(completed+1)+' de '+changes.length+': '+entry.path);
        const body=entry.kind==='yaml'?{
          message:'GPENSC: publica edição revisada de '+entry.draft.label,
          content:encodeUTF8(yamlText(entry.draft)),branch,
          sha:entry.draft.baseSha
        }:entry.kind==='remove'?{
          message:'GPENSC: remover material após revisão editorial',
          sha:entry.meta.sha,branch
        }:{
          message:'GPENSC: '+entry.meta.action+' mídia revisada',
          content:await toBase64(await dbGet(entry.meta.path)),branch,
          ...(entry.meta.sha?{sha:entry.meta.sha}:{})
        };
        let saved;
        try{
          saved=await api('/repos/'+repo+'/contents/'+filePath(entry.path),{method:entry.kind==='remove'?'DELETE':'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        }catch(error){
          throw new Error('Envio interrompido após '+completed+' arquivo(s). Os demais permanecem na fila. Detalhes: '+(error.message||'falha no GitHub')+'.');
        }
        if(entry.kind==='yaml'){
          if(saved?.content?.sha)state.sha[entry.path]=saved.content.sha;
          delete pending[entry.path];
          if(state.remoteContents)state.remoteContents[entry.path]=clone(entry.draft.content);
        }else{
          delete assets[entry.path];await dbDelete(entry.path).catch(()=>{});
        }
        persist();completed++;updateUI();
      }
      return {message:'As '+completed+' alterações foram enviadas pelo acesso por código. A compilação do site será iniciada pelo GitHub Actions.'};
    }
    async function publish(progress=()=>{}){
      if(publishing)throw new Error('Já existe um envio em andamento.');
      if(!total())throw new Error('Não há alterações pendentes para publicar.');
      publishing=true;notice='';
      try{
        progress('Verificando conflitos e arquivos pendentes…');
        const byCode=state.authMode==='access-code';
        if(byCode)await verify();
        const result=byCode?await submitSequential(progress):await submitAtomic(progress);
        if(state.authMode!=='access-code'){
          const pendingAssets=Object.keys(assets);
          for(const [path,draft] of Object.entries(pending)){
            if(state.remoteContents)state.remoteContents[path]=clone(draft.content);
            if(result.contentShas?.[path])state.sha[path]=result.contentShas[path];
          }
          pending={};assets={};persist();
          await Promise.all(pendingAssets.map(path=>dbDelete(path).catch(()=>{})));
        }
        updateUI();return result;
      }finally{publishing=false;updateUI()}
    }
    function banner(){
      const count=total();
      return '<section class="batch-dashboard-notice" aria-label="Edições em preparação"><div><span class="eyebrow">FLUXO DE PUBLICAÇÃO</span><strong>'+(count?count+' itens aguardando revisão':'Edite várias áreas antes de publicar')+'</strong><p>'+(count?'Você pode continuar editando sem afetar o site público.':'As mudanças são guardadas como rascunhos neste navegador até você confirmar o envio.')+'</p></div><button type="button" class="secondary-button" data-batch-review>Revisar e publicar <span data-batch-count>'+count+'</span></button></section>';
    }
    return {afterLoad,stage,stageMedia,stageDeletion,removeDraft,deleteAsset,clearAll,updateUI,renderReview,publish,items:()=>clone(pending),assets:()=>clone(assets),count:total,banner,isPublishing:()=>publishing};
  }
  window.GPENSCBatchQueue={create};
})();