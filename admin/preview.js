(() => {
  'use strict';
  if (window.__GPEN_PREVIEW__) return;
  window.__GPEN_PREVIEW__ = true;

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
  const clean = value => String(value ?? '').trim();
  const fieldName = field => {
    const path = field.getAttribute('data-key-path') || '';
    const parts = path.split(/[.[\]]/).filter(Boolean);
    return parts[parts.length - 1] || '';
  };
  const fieldLabel = field => {
    const header = field.querySelector(':scope > header');
    return clean(header?.innerText || field.querySelector('label')?.innerText || fieldName(field))
      .replace(/\s+/g, ' ').replace(/\s*(Obrigatório|Required)\s*/gi, '').trim();
  };
  const getValue = field => {
    const control = field.querySelector('input:not([type=checkbox]):not([type=radio]), textarea, select');
    if (control) return clean(control.value);
    const image = field.querySelector('img[src]');
    if (image) return image.currentSrc || image.src;
    const text = field.querySelector('[data-value], [role=combobox]');
    return clean(text?.getAttribute('data-value') || text?.innerText);
  };
  const getFields = () => {
    const container = document.querySelector('#page-container');
    if (!container) return [];
    return [...container.querySelectorAll('section.field[role="group"][data-key-path]')]
      .filter(field => field.getBoundingClientRect().width > 0)
      .map(field => ({name:fieldName(field), label:fieldLabel(field), value:getValue(field), element:field}))
      .filter(field => field.label && field.value);
  };
  const titleKeys = ['titulo','nome','sigla'];
  const descriptionKeys = ['resumo','descricao','conteudo','texto','sobre','ementa'];
  const imageKeys = ['imagem','foto','capa','logo'];
  const dateKeys = ['data','ano','inicio'];
  const linkKeys = ['url','link','site','doi'];
  function buildPreview() {
    const fields = getFields();
    const pick = keys => fields.find(field => keys.includes(field.name.toLowerCase()));
    const title = pick(titleKeys);
    const description = pick(descriptionKeys);
    const image = pick(imageKeys);
    const date = pick(dateKeys);
    const link = pick(linkKeys);
    const category = pick(['categoria','tipo','situacao','nivel','etapa']);
    const authors = pick(['autores','autor','coordenador','responsavel']);
    const imageURL = image?.value || image?.element.querySelector('img[src]')?.src || '';
    const isImage = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(imageURL) || imageURL.startsWith('blob:') || imageURL.startsWith('data:image/');
    const safeImage = isImage ? '<img class="gpen-preview-image" src="'+escapeHTML(imageURL)+'" alt="Imagem do conteúdo">' : '';
    const heading = title?.value || 'Título do conteúdo';
    const summary = description?.value || 'O resumo ou a descrição aparecerá aqui conforme você preencher o formulário.';
    const detail = fields.filter(field => ![title,description,image].includes(field)).slice(0,10);
    return '<div class="gpen-preview-site">'+
      '<div class="gpen-preview-brand"><span>GPENSC</span><small>Grupo de Pesquisa e Ensino em Nutrição e Saúde Coletiva · UFOP</small></div>'+
      '<div class="gpen-preview-page"><div class="gpen-preview-kicker">PRÉ-VISUALIZAÇÃO · NÃO PUBLICADO</div>'+
      '<article class="gpen-preview-card">'+safeImage+'<div class="gpen-preview-body">'+
      (category?.value?'<span class="gpen-preview-tag">'+escapeHTML(category.value)+'</span>':'')+
      '<h1>'+escapeHTML(heading)+'</h1>'+
      (date?.value?'<time>'+escapeHTML(date.value)+'</time>':'')+
      (authors?.value?'<p class="gpen-preview-byline">'+escapeHTML(authors.value)+'</p>':'')+
      '<p class="gpen-preview-description">'+escapeHTML(summary).replace(/\n/g,'<br>')+'</p>'+
      (detail.length?'<dl>'+detail.map(field=>'<div><dt>'+escapeHTML(field.label)+'</dt><dd>'+escapeHTML(field.value)+'</dd></div>').join('')+'</dl>':'')+
      (link?.value?'<p class="gpen-preview-link">'+escapeHTML(link.value)+'</p>':'')+
      '</div></article></div></div>';
  }
  function openPreview() {
    let modal = document.getElementById('gpen-live-preview');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'gpen-live-preview';
      modal.className = 'gpen-preview-overlay';
      modal.innerHTML = '<section class="gpen-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="gpen-preview-title">'+
        '<header><div><span>GPENSC</span><h2 id="gpen-preview-title">Pré-visualização do conteúdo</h2><p>Visualização provisória dos dados preenchidos. Nada será salvo ou publicado.</p></div>'+
        '<button type="button" data-preview-close aria-label="Fechar pré-visualização">×</button></header>'+
        '<div class="gpen-preview-content" data-preview-content></div>'+
        '<footer><span>Atualiza automaticamente enquanto você edita.</span><button type="button" data-preview-close>Voltar ao formulário</button></footer></section>';
      document.body.append(modal);
      modal.addEventListener('click', event => {
        if (event.target === modal || event.target.closest('[data-preview-close]')) modal.hidden = true;
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.hidden) modal.hidden = true;
      });
    }
    modal.querySelector('[data-preview-content]').innerHTML = buildPreview();
    modal.hidden = false;
  }
  function addButton() {
    const toolbar = document.querySelector('.sui.toolbar');
    const editor = document.querySelector('#page-container');
    if (!toolbar || !editor || document.querySelector('[data-gpen-preview-open]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gpen-preview-trigger';
    button.dataset.gpenPreviewOpen = 'true';
    button.innerHTML = '<span aria-hidden="true">◉</span> Pré-visualizar';
    button.addEventListener('click', openPreview);
    toolbar.append(button);
  }
  document.addEventListener('input', event => {
    const modal = document.getElementById('gpen-live-preview');
    if (modal && !modal.hidden && event.target.closest('#page-container')) {
      modal.querySelector('[data-preview-content]').innerHTML = buildPreview();
    }
  });
  document.addEventListener('change', event => {
    const modal = document.getElementById('gpen-live-preview');
    if (modal && !modal.hidden && event.target.closest('#page-container')) {
      modal.querySelector('[data-preview-content]').innerHTML = buildPreview();
    }
  });
  new MutationObserver(addButton).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',addButton);
  addButton();
})();