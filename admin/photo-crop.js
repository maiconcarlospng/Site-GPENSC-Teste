(() => {
  'use strict';
  const formats = {
    gallery: [['Galeria · computador', 5 / 4], ['Galeria · celular', 7 / 5]],
    portrait: [['Foto da equipe · quadrada', 1]],
    book: [['Capa de livro · vertical', 2 / 3]],
    video: [['Miniatura de vídeo · horizontal', 16 / 9]],
    wide: [['Imagem horizontal', 16 / 9]],
  };
  const originals = new WeakMap();

  function geometry(width, height, ratio, zoom, x, y) {
    const cropWidth = Math.min(width, height * ratio) / zoom;
    const cropHeight = cropWidth / ratio;
    return [(width - cropWidth) * x, (height - cropHeight) * y, cropWidth, cropHeight];
  }

  function files(input) {
    const selected = [...(input?.files || [])];
    for (const [index, file] of originals.get(input) || []) selected[index] = file;
    return selected;
  }

  function replace(input, index, file) {
    if (!originals.has(input)) originals.set(input, new Map());
    originals.get(input).set(index, file);
    input.dispatchEvent(new CustomEvent('imagecropped', {bubbles: true}));
  }

  async function edit(source, format) {
    if (document.querySelector('.photo-crop-dialog')) throw new Error('Já existe um recorte aberto.');
    const dialog = document.createElement('dialog');
    dialog.className = 'photo-crop-dialog';
    dialog.setAttribute('aria-labelledby', 'photo-crop-title');
    dialog.innerHTML = `
      <form method="dialog">
        <header><h2 id="photo-crop-title">Recortar foto</h2><button type="submit" value="cancel" class="small-button">Fechar</button></header>
        <div class="photo-crop-body">
          <label>Formato da imagem <select name="ratio"></select></label>
          <div class="photo-crop-preview"><canvas aria-label="Prévia do recorte"></canvas></div>
          <div class="photo-crop-controls">
            <label>Zoom <input name="zoom" type="range" min="1" max="4" step=".05" value="1"></label>
            <label>Posição horizontal <input name="x" type="range" min="0" max="100" value="50"></label>
            <label>Posição vertical <input name="y" type="range" min="0" max="100" value="50"></label>
          </div>
          <p role="status">Carregando imagem…</p>
        </div>
        <footer><button type="submit" value="cancel" class="secondary-button">Cancelar</button><button type="button" class="primary-button" disabled>Aplicar recorte</button></footer>
      </form>`;
    const form = dialog.querySelector('form');
    const controls = form.elements;
    const available = [...(formats[format] || []), ['Quadrado', 1], ['Horizontal 4:3', 4 / 3], ['Horizontal 16:9', 16 / 9], ['Vertical 4:5', 4 / 5]];
    for (const [label, ratio] of available) controls.ratio.add(new Option(label, ratio));
    const status = dialog.querySelector('[role=status]');
    const apply = dialog.querySelector('.primary-button');
    const canvas = dialog.querySelector('canvas');
    const image = new Image();
    let objectUrl, result;
    const controller = new AbortController();
    const closed = new Promise(resolve => dialog.addEventListener('close', () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      dialog.remove();
      resolve(result);
    }, {once: true}));
    document.body.append(dialog);
    dialog.showModal();

    function frame() {
      return geometry(image.naturalWidth, image.naturalHeight, Number(controls.ratio.value),
        Number(controls.zoom.value), Number(controls.x.value) / 100, Number(controls.y.value) / 100);
    }
    function paint() {
      const area = frame();
      const scale = Math.min(1, 640 / Math.max(area[2], area[3]));
      canvas.width = Math.max(1, Math.round(area[2] * scale));
      canvas.height = Math.max(1, Math.round(area[3] * scale));
      canvas.getContext('2d').drawImage(image, ...area, 0, 0, canvas.width, canvas.height);
    }
    form.addEventListener('input', () => { if (!apply.disabled) paint(); });
    apply.onclick = () => {
      apply.disabled = true;
      const area = frame();
      const output = document.createElement('canvas');
      const scale = Math.min(1, 1800 / Math.max(area[2], area[3]));
      output.width = Math.max(1, Math.round(area[2] * scale));
      output.height = Math.max(1, Math.round(area[3] * scale));
      output.getContext('2d').drawImage(image, ...area, 0, 0, output.width, output.height);
      output.toBlob(blob => {
        if (!dialog.open) return;
        if (!blob) { status.textContent = 'Não foi possível gerar o recorte.'; apply.disabled = false; return; }
        const name = source instanceof File ? source.name.replace(/\.[^.]+$/, '') : 'foto';
        result = new File([blob], name + '-recorte.' + (blob.type === 'image/webp' ? 'webp' : 'png'), {type: blob.type});
        dialog.close();
      }, 'image/webp', .92);
    };
    try {
      let blob = source;
      if (typeof source === 'string') {
        const response = await fetch(source, {signal: controller.signal});
        if (!response.ok) throw new Error('Falha ao baixar a foto.');
        blob = await response.blob();
      }
      if (blob.size > 20 * 1024 * 1024) throw new Error('Escolha uma imagem de até 20 MB.');
      if (controller.signal.aborted) return closed;
      objectUrl = URL.createObjectURL(blob);
      image.src = objectUrl;
      await image.decode();
      if (!dialog.open) return closed;
      paint();
      apply.disabled = false;
      status.textContent = 'Ajuste o enquadramento pela prévia. O original será preservado.';
    } catch (error) {
      if (!controller.signal.aborted) status.textContent = 'Não foi possível abrir a foto. Se ela estiver em um site externo, selecione uma cópia neste dispositivo.';
    }
    return closed;
  }

  document.addEventListener('change', event => {
    if (event.target.matches('input[type=file]')) originals.delete(event.target);
  }, true);
  window.GPENSCPhotoCrop = {edit, files, replace};
})();
