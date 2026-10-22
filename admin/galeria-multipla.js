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
  const srcDaImagem = (caminho, getAsset) => {
    if (typeof caminho !== "string" || !caminho) return "";
    if (typeof getAsset === "function") {
      const asset = getAsset(caminho);
      if (asset && asset.url) return asset.url;
    }
    if (
      caminho.startsWith("blob:") ||
      caminho.startsWith("data:") ||
      caminho.startsWith("http://") ||
      caminho.startsWith("https://")
    ) {
      return caminho;
    }
    const relativo = caminho.replace(/^\/+/, "");
    return "../" + relativo;
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
          .map((item) => ({ arquivo: item.value, legenda: "" }));

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

            return html`
              <article class="gpen-sc-galeria__item" key=${caminho + "-" + indice}>
                <div class="gpen-sc-galeria__imagem">
                  ${src
                    ? html`<img src=${src} alt=${foto.legenda || "Foto da galeria"} loading="lazy" />`
                    : html`<span class="gpen-sc-galeria__sem-imagem">Pré-visualização indisponível</span>`}
                </div>
                <div class="gpen-sc-galeria__corpo">
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
              ${src && html`<img src=${src} alt=${foto.legenda || "Foto " + (indice + 1)} loading="lazy" />`}
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
