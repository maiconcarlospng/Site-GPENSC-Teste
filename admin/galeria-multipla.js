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
          allowURL: false
        });

        if (!selecionadas) return;

        const lista = Array.isArray(selecionadas) ? selecionadas : [selecionadas];
        const novas = lista
          .filter((item) => item && typeof item.value === "string" && item.value)
          .map((item) => ({ arquivo: item.value, legenda: "" }));

        if (novas.length) {
          onChange([...fotos, ...novas]);
        }
      } catch (error) {
        setErro(error && error.message ? error.message : "Não foi possível adicionar as fotos.");
      } finally {
        setCarregando(false);
      }
    };

    const alterarLegenda = (indice, legenda) => {
      onChange(fotos.map((foto, i) => i === indice ? { ...foto, legenda } : foto));
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
            Nenhuma foto adicionada. Clique em “Selecionar várias fotos” para escolher uma ou mais imagens.
          </div>
        `}

        <div class="gpen-sc-galeria__grid">
          ${fotos.map((foto, indice) => {
            const caminho = typeof foto.arquivo === "string" ? foto.arquivo : "";
            const asset = caminho && typeof getAsset === "function" ? getAsset(caminho) : undefined;
            const src = asset && asset.url
              ? asset.url
              : (/^(blob:|data:|https?:\/\/|\/)/i.test(caminho) ? caminho : (caminho ? "/" + caminho : ""));

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
                    <button type="button" disabled=${indice === 0} onClick=${() => moverFoto(indice, -1)} title="Mover para cima">↑ Subir</button>
                    <button type="button" disabled=${indice === fotos.length - 1} onClick=${() => moverFoto(indice, 1)} title="Mover para baixo">↓ Descer</button>
                    <button type="button" onClick=${() => removerFoto(indice)}>Remover</button>
                  </div>
                  <span class="gpen-sc-galeria__count">${caminho}</span>
                </div>
              </article>
            `;
          })}
        </div>
      </div>
    `;
  };

  CMS.registerWidget("galeria-multipla-v2", GaleriaMultiplaControl);
})();
