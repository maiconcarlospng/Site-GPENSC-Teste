(function () {
  const html = window.html;
  const { useState } = CMS.React;

  const comoLista = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value.toJS === "function") {
      const converted = value.toJS();
      return Array.isArray(converted) ? converted : [];
    }
    return [];
  };

  // Resolve repository paths relative to /admin/ so previews also work on GitHub
  // Pages project sites, whose URLs contain /<repository>/ rather than the host root.
  const urlRelativaAoPainel = (valor) => {
    if (typeof valor !== "string" || !valor) return "";
    if (/^(blob:|data:|https?:\/\/)/i.test(valor)) return valor;
    if (valor.startsWith("../") || valor.startsWith("./")) return valor;
    return "../" + valor.replace(/^\/+/, "");
  };

  const srcDaImagem = (caminho, getAsset) => {
    if (typeof caminho !== "string" || !caminho) return "";
    if (typeof getAsset === "function") {
      const asset = getAsset(caminho);
      if (asset && typeof asset.url === "string" && asset.url) {
        return urlRelativaAoPainel(asset.url);
      }
    }
    return urlRelativaAoPainel(caminho);
  };
  const limitar = (valor, padrao, minimo, maximo) => {
    const numero = Number(valor);
    return Number.isFinite(numero) && valor !== "" && valor !== null
      ? Math.min(maximo, Math.max(minimo, numero))
      : padrao;
  };

  const focoX = (foto) => limitar(foto.foco_x, 50, 0, 100);
  const focoY = (foto) => limitar(foto.foco_y, 50, 0, 100);
  const zoomFoto = (foto) => limitar(foto.zoom, 100, 100, 200);

  const estiloEnquadramento = (foto) => {
    const x = focoX(foto);
    const y = focoY(foto);
    const zoom = zoomFoto(foto) / 100;
    return `object-position: ${x}% ${y}%; transform: scale(${zoom}); transform-origin: ${x}% ${y}%;`;
  };

  const GaleriaMultiplaControl = ({ forID, value, onChange, pickFile, getAsset }) => {
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");
    const fotos = comoLista(value);

    const adicionarFotos = async () => {
      setCarregando(true);
      setErro("");
      try {
        const selecionadas = await pickFile({
          kind: "image",
          accept: "image/*",
          multiple: true,
          allowURL: false,
        });

        if (!selecionadas) return;

        const lista = Array.isArray(selecionadas) ? selecionadas : [selecionadas];
        const novas = lista
          .filter((item) => item && typeof item.value === "string" && item.value)
          .map((item) => ({ arquivo: item.value, legenda: "", foco_x: 50, foco_y: 50, zoom: 100 }));

        if (novas.length) onChange([...fotos, ...novas]);
      } catch (error) {
        setErro(error && error.message ? error.message : "Não foi possível adicionar as fotos.");
      } finally {
        setCarregando(false);
      }
    };

    const alterarLegenda = (indice, legenda) => {
      onChange(fotos.map((foto, i) => (i === indice ? { ...foto, legenda } : foto)));
    };

    const alterarEnquadramento = (indice, campo, valor) => {
      const numero = Number(valor);
      onChange(fotos.map((foto, i) => (i === indice ? { ...foto, [campo]: numero } : foto)));
    };

    const centralizarEnquadramento = (indice) => {
      onChange(fotos.map((foto, i) => (i === indice
        ? { ...foto, foco_x: 50, foco_y: 50, zoom: 100 }
        : foto)));
    };

    const moverFoto = (indice, deslocamento) => {
      const destino = indice + deslocamento;
      if (destino < 0 || destino >= fotos.length) return;
      const atualizadas = [...fotos];
      const [foto] = atualizadas.splice(indice, 1);
      atualizadas.splice(destino, 0, foto);
      onChange(atualizadas);
    };

    const removerFoto = (indice) => {
      onChange(fotos.filter((_, i) => i !== indice));
    };

    return html`
      <div class="gpen-sc-galeria">
        <div class="gpen-sc-galeria__toolbar">
          <button
            id=${forID}
            type="button"
            disabled=${carregando}
            onClick=${adicionarFotos}
          >${carregando ? "Adicionando fotos…" : "Selecionar várias fotos"}</button>
          <span class="gpen-sc-galeria__count">${fotos.length} ${fotos.length === 1 ? "foto" : "fotos"} na galeria</span>
        </div>

        ${erro && html`<p class="gpen-sc-galeria__erro" role="alert">${erro}</p>`}

        ${fotos.length === 0 && html`
          <div class="gpen-sc-galeria__vazia">
            Nenhuma foto adicionada. Clique em “Selecionar várias fotos” para escolher imagens.
          </div>
        `}

        <div class="gpen-sc-galeria__grid">
          ${fotos.map((foto, indice) => {
            const caminho = typeof foto.arquivo === "string" ? foto.arquivo : "";
            const src = srcDaImagem(caminho, getAsset);
            const nomeArquivo = caminho.startsWith("blob:")
              ? "Imagem nova — será enviada ao salvar"
              : caminho.split("/").pop() || "Imagem selecionada";
            const x = focoX(foto);
            const y = focoY(foto);
            const zoom = zoomFoto(foto);
            const sufixo = forID + "-foto-" + indice;

            return html`
              <article class="gpen-sc-galeria__item" key=${caminho + "-" + indice}>
                <span class="gpen-sc-galeria__preview-label">Prévia do recorte no site</span>
                <div class="gpen-sc-galeria__imagem" title="Prévia aproximada do enquadramento da galeria no site">
                  ${src
                    ? html`<img src=${src} alt=${foto.legenda || "Prévia do recorte da foto no site"} style=${estiloEnquadramento(foto)} loading="lazy" />`
                    : html`<span class="gpen-sc-galeria__sem-imagem">Pré-visualização indisponível</span>`}
                </div>
                <div class="gpen-sc-galeria__corpo">
                  <details class="gpen-sc-galeria__recorte">
                    <summary>Ajustar recorte para a galeria</summary>
                    <p class="gpen-sc-galeria__recorte-ajuda">A prévia usa o quadro horizontal da página. Mova o foco e ajuste o zoom sem modificar o arquivo original.</p>
                    <div class="gpen-sc-galeria__controle-recorte">
                      <div class="gpen-sc-galeria__controle-recorte-cabecalho">
                        <label for=${sufixo + "-x"}>Horizontal</label>
                        <output for=${sufixo + "-x"}>${x}%</output>
                      </div>
                      <input class="gpen-sc-galeria__slider" id=${sufixo + "-x"} type="range" min="0" max="100" step="1" value=${x} onInput=${(event) => alterarEnquadramento(indice, "foco_x", event.currentTarget.value)} />
                    </div>
                    <div class="gpen-sc-galeria__controle-recorte">
                      <div class="gpen-sc-galeria__controle-recorte-cabecalho">
                        <label for=${sufixo + "-y"}>Vertical</label>
                        <output for=${sufixo + "-y"}>${y}%</output>
                      </div>
                      <input class="gpen-sc-galeria__slider" id=${sufixo + "-y"} type="range" min="0" max="100" step="1" value=${y} onInput=${(event) => alterarEnquadramento(indice, "foco_y", event.currentTarget.value)} />
                    </div>
                    <div class="gpen-sc-galeria__controle-recorte">
                      <div class="gpen-sc-galeria__controle-recorte-cabecalho">
                        <label for=${sufixo + "-zoom"}>Zoom</label>
                        <output for=${sufixo + "-zoom"}>${zoom}%</output>
                      </div>
                      <input class="gpen-sc-galeria__slider" id=${sufixo + "-zoom"} type="range" min="100" max="200" step="5" value=${zoom} onInput=${(event) => alterarEnquadramento(indice, "zoom", event.currentTarget.value)} />
                    </div>
                    <button class="gpen-sc-galeria__resetar-recorte" type="button" onClick=${() => centralizarEnquadramento(indice)}>Centralizar e redefinir zoom</button>
                  </details>
                  <label for=${forID + "-legenda-" + indice}>Legenda (opcional)</label>
                  <input
                    class="gpen-sc-galeria__legenda"
                    id=${forID + "-legenda-" + indice}
                    type="text"
                    value=${foto.legenda || ""}
                    placeholder="Digite a legenda da foto"
                    onChange=${(event) => alterarLegenda(indice, event.target.value)}
                  />
                  <div class="gpen-sc-galeria__acoes">
                    <button type="button" disabled=${indice === 0} onClick=${() => moverFoto(indice, -1)}>↑ Subir</button>
                    <button type="button" disabled=${indice === fotos.length - 1} onClick=${() => moverFoto(indice, 1)}>↓ Descer</button>
                    <button type="button" onClick=${() => removerFoto(indice)}>Remover</button>
                  </div>
                  <span class="gpen-sc-galeria__arquivo">${nomeArquivo}</span>
                </div>
              </article>
            `;
          })}
        </div>
      </div>
    `;
  };

  const GaleriaMultiplaPreview = ({ value, getAsset }) => {
    const fotos = comoLista(value).filter(
      (foto) => foto && typeof foto.arquivo === "string" && foto.arquivo,
    );

    if (!fotos.length) {
      return html`<p class="gpen-sc-galeria__preview-vazia">Nenhuma foto cadastrada na galeria.</p>`;
    }

    return html`
      <div class="gpen-sc-galeria__preview">
        ${fotos.map((foto, indice) => {
          const src = srcDaImagem(foto.arquivo, getAsset);
          return html`
            <figure key=${foto.arquivo + "-preview-" + indice}>
              ${src && html`<img src=${src} alt=${foto.legenda || "Foto " + (indice + 1)} style=${estiloEnquadramento(foto)} loading="lazy" />`}
              <figcaption>${foto.legenda || "Foto " + (indice + 1)}</figcaption>
            </figure>
          `;
        })}
      </div>
    `;
  };

  // Use the current Sveltia API name for the custom field type.
  CMS.registerFieldType("galeria-multipla-v2", GaleriaMultiplaControl, GaleriaMultiplaPreview);
})();
