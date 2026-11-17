/* Testes offline do fluxo de edição em lote. Executar: node admin/testar-lote.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'lote-edicoes.js'),'utf8');
const store={};
const localStorage={
  getItem(key){return store[key]??null},
  setItem(key,value){store[key]=value},
  removeItem(key){delete store[key]}
};
const context={
  window:{},
  localStorage,
  document:{getElementById:()=>null,querySelectorAll:()=>[]},
  jsyaml:{dump:JSON.stringify},
  console,Date,JSON,Promise,Map,Set,URL,String,Array,Object,Number,
  encodeURIComponent,encodeURI,decodeURIComponent,
  btoa:val=>Buffer.from(val,'binary').toString('base64'),
  unescape,structuredClone,Math
};
vm.runInNewContext(src,context,{filename:'lote-edicoes.js'});
const apiFactory=(mode='normal')=>{
  const log=[];
  let errorOnce=true;
  const api=async(path,options)=>{
    const method=options?.method||'GET';log.push({path,method,options});
    if(method==='GET'&&path.includes('/contents/data/noticias.yml'))return {sha:mode==='conflict'?'sha-diferente':'sha-noticias',content:{sha:'sha-noticias-new'}};
    if(method==='GET'&&path.includes('/contents/data/eventos.yml'))return {sha:'sha-eventos',content:{sha:'sha-eventos-new'}};
    if(method==='GET'&&path.endsWith('/git/ref/heads/main'))return {object:{sha:'head'}};
    if(method==='GET'&&path.endsWith('/git/commits/head'))return {tree:{sha:'base-tree'}};
    if(method==='POST'&&path.endsWith('/git/trees'))return {sha:'new-tree'};
    if(method==='POST'&&path.endsWith('/git/commits'))return {sha:'new-commit'};
    if(method==='PATCH'&&path.endsWith('/git/refs/heads/main'))return {object:{sha:'new-commit'}};
    if(method==='PUT'&&path.includes('/contents/')){
      if(mode==='partial'&&errorOnce&&path.includes('eventos')){errorOnce=false;throw new Error('simulated failure')}
      return {content:{sha:'new-content-sha'}};
    }
    throw new Error('Unexpected API request: '+method+' '+path);
  };
  return {api,log};
};
const collections=[
  {file:'data/noticias.yml',label:'Notícias'},
  {file:'data/eventos.yml',label:'Agenda'}
];
const initial={
  'data/noticias.yml':{itens:[{id:'1',titulo:'Notícia antiga'}]},
  'data/eventos.yml':{itens:[]}
};
const initialSha={'data/noticias.yml':'sha-noticias','data/eventos.yml':'sha-eventos'};
function state(mode='github'){
  return {authMode:mode,collections,contents:structuredClone(initial),sha:{...initialSha}};
}
function create(st,api){
  return context.window.GPENSCBatchQueue.create({
    state:st,api,repo:'maiconcarlospng/Site-GPENSC-Teste',branch:'main',toast:()=>{}
  });
}
function stageTwo(q){
  q.stage(collections[0],{itens:[{id:'1',titulo:'Notícia editada'},{id:'2',titulo:'Notícia nova'}]});
  q.stage(collections[1],{itens:[{id:'3',titulo:'Curso'}]});
}
async function test(){
  const first=apiFactory(),q1=create(state(),first.api);
  q1.afterLoad();stageTwo(q1);
  assert.equal(q1.count(),2);
  assert.equal(first.log.length,0,'Preparar rascunhos não deve acessar o GitHub');
  const restoredState=state(),q2=create(restoredState,first.api);
  q2.afterLoad();
  assert.equal(restoredState.contents['data/noticias.yml'].itens.length,2);
  assert.equal(q2.count(),2,'Rascunhos precisam resistir a um recarregamento');
  await q2.publish();
  assert.equal(first.log.filter(x=>x.path.endsWith('/git/trees')&&x.method==='POST').length,1);
  assert.equal(first.log.filter(x=>x.path.endsWith('/git/refs/heads/main')&&x.method==='PATCH').length,1);
  assert.equal(q2.count(),0,'Fila precisa ficar vazia após confirmar o commit');
  const fail=apiFactory('conflict'),q3=create(state(),fail.api);
  q3.afterLoad();stageTwo(q3);
  await assert.rejects(q3.publish(),/Conflito/);
  assert.equal(q3.count(),2,'Conflitos não podem apagar rascunhos');
  assert.equal(fail.log.some(x=>x.method==='PATCH'),false,'Conflitos não podem publicar commits');
  await q3.clearAll();
  const partial=apiFactory('partial'),st=state('access-code'),q4=create(st,partial.api);
  q4.afterLoad();stageTwo(q4);
  await assert.rejects(q4.publish(),/interrompido/);
  assert.equal(q4.count(),1,'No envio sequencial, apenas arquivos não enviados permanecem na fila');
  assert.equal(st.sha['data/noticias.yml'],'new-content-sha','SHA do arquivo confirmado deve ser atualizado');
  await q4.publish();
  assert.equal(q4.count(),0,'Retentativa deve concluir pendências');
  process.stdout.write('OK: rascunho local, recuperação, commit único, conflito e envio por código.\n');
}
test().catch(error=>{console.error(error);process.exitCode=1});
