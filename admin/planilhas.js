(function () {
  const html = window.html;
  const { useState } = CMS.React;
  const plain = (value) => value && typeof value.toJS === "function" ? value.toJS() : value;
  const asList = (value) => Array.isArray(plain(value)) ? plain(value) : [];
  const normalize = (value) => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "");
  const asText = (value) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    return String(value);
  };

  const SpreadsheetEditorControl = ({ forID, value, onChange, field }) => {
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState([]);
    const [mode, setMode] = useState("add");
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const fieldConfig = plain(field) || {};
    const columns = Array.isArray(fieldConfig.fields) ? fieldConfig.fields.map(plain) : [];
    const records = asList(value).map((row) => ({ ...(plain(row) || {}) }));

    const updateCell = (index, name, nextValue) => {
      onChange(records.map((record, i) => i === index ? { ...record, [name]: nextValue } : record));
      setMessage("Alteração registrada no formulário. Clique em Salvar para publicar.");
      setError("");
    };

    const addRecord = () => {
      const blank = {};
      columns.forEach((column) => { blank[column.name] = ""; });
      onChange([...records, blank]);
      setMessage("Nova linha adicionada. Preencha os campos e clique em Salvar.");
      setError("");
    };

    const removeRecord = (index) => {
      onChange(records.filter((record, i) => i !== index));
      setMessage("Linha removida do formulário. Clique em Salvar para confirmar.");
    };

    const moveRecord = (index, shift) => {
      const target = index + shift;
      if (target < 0 || target >= records.length) return;
      const changed = [...records];
      const item = changed.splice(index, 1)[0];
      changed.splice(target, 0, item);
      onChange(changed);
      setMessage("Ordem atualizada. Clique em Salvar para confirmar.");
    };

    const renderCell = (record, index, column) => {
      const valueText = asText(record[column.name]);
      const id = forID + "-" + index + "-" + column.name;
      const label = column.label || column.name;
      const options = Array.isArray(column.options) ? column.options : [];

      if (column.widget === "select") {
        return html`
          <select id=${id} value=${valueText} onChange=${(event) => updateCell(index, column.name, event.target.value)}>
            <option value="">Selecione...</option>
            ${options.map((option) => {
              const optionValue = typeof option === "string" ? option : (option.value || option.label || "");
              const optionLabel = typeof option === "string" ? option : (option.label || option.value || "");
              return html`<option value=${optionValue}>${optionLabel}</option>`;
            })}
          </select>
        `;
      }

      if (column.widget === "text" || column.widget === "markdown" || column.widget === "richtext") {
        return html`
          <textarea id=${id} rows="2" placeholder=${"Digite " + label.toLocaleLowerCase("pt-BR")}
            value=${valueText} onInput=${(event) => updateCell(index, column.name, event.target.value)}></textarea>
        `;
      }

      const type = column.widget === "number" ? "number" :
        (column.widget === "date" || (column.widget === "datetime" && column.type === "date")) ? "date" : "text";
      const placeholder = column.widget === "image" ? "Caminho em img/ (ex.: img/equipe/foto.jpg)" : "Digite " + label.toLocaleLowerCase("pt-BR");
      return html`
        <input id=${id} type=${type} placeholder=${placeholder} value=${valueText}
          onChange=${(event) => updateCell(index, column.name, event.target.value)} />
      `;
    };

    const makeWorkbook = (rows, filename) => {
      if (!window.XLSX) {
        setError("O leitor de Excel não carregou. Atualize o painel e tente novamente.");
        return;
      }
      const workbook = window.XLSX.utils.book_new();
      const data = rows.map((record) => {
        const output = {};
        columns.forEach((column) => { output[column.name] = asText(record[column.name]); });
        return output;
      });
      const sheet = window.XLSX.utils.json_to_sheet(data, { header: columns.map((column) => column.name) });
      sheet["!cols"] = columns.map((column) => ({ wch: Math.min(36, Math.max(14, (column.label || column.name).length + 5)) }));
      window.XLSX.utils.book_append_sheet(workbook, sheet, "Dados");

      const instructions = [
        ["COMO PREENCHER A PLANILHA"],
        ["Edite ou acrescente registros na primeira aba (Dados)."],
        ["Não altere os nomes das colunas da primeira linha."],
        ["Deixe em branco os campos opcionais que não se aplicarem."],
        ["Imagens não são incorporadas ao Excel: envie-as no painel e informe o caminho em img/."],
        ["Importe o arquivo neste mesmo campo e revise a prévia antes de aplicar."],
        [],
        ["CAMPO", "DESCRIÇÃO"],
        ...columns.map((column) => [column.name, column.label || column.name])
      ];
      const helpSheet = window.XLSX.utils.aoa_to_sheet(instructions);
      helpSheet["!cols"] = [{ wch: 28 }, { wch: 80 }];
      window.XLSX.utils.book_append_sheet(workbook, helpSheet, "Instruções");
      window.XLSX.writeFile(workbook, filename);
      setError("");
    };

    const downloadTemplate = () => {
      const blank = {};
      columns.forEach((column) => { blank[column.name] = ""; });
      makeWorkbook([blank], "modelo-gpensc.xlsx");
      setMessage("Modelo Excel preparado. Preencha a aba Dados e importe o arquivo.");
    };

    const exportCurrent = () => {
      makeWorkbook(records, "dados-gpensc.xlsx");
      setMessage("Planilha com os registros atuais exportada.");
    };

    const recordKey = (record) => {
      const names = new Set(columns.map((column) => column.name));
      let keys = [];
      if (names.has("id")) keys = ["id"];
      else if (names.has("titulo") && names.has("ano")) keys = ["titulo", "ano", ...(names.has("autores") ? ["autores"] : [])];
      else if (names.has("titulo") && names.has("data") && names.has("autor")) keys = ["titulo", "data", "autor"];
      else if (names.has("titulo")) keys = ["titulo"];
      else if (names.has("nome")) keys = ["nome"];
      else if (names.has("url")) keys = ["url"];
      else if (columns.length) keys = [columns[0].name];
      const parts = keys.map((key) => normalize(record[key]));
      return parts.length && parts.every(Boolean) ? parts.join("|") : "";
    };

    const applyImport = () => {
      const required = columns.filter((column) => column.required);
      const validRows = [];
      let incomplete = 0;
      pending.forEach((record) => {
        if (required.some((column) => !asText(record[column.name]).trim())) incomplete++;
        else validRows.push(record);
      });

      const changed = [...records];
      const indices = new Map();
      changed.forEach((record, index) => {
        const key = recordKey(record);
        if (key && !indices.has(key)) indices.set(key, index);
      });

      let added = 0;
      let updated = 0;
      let duplicated = 0;
      validRows.forEach((record) => {
        const key = recordKey(record);
        const existingIndex = key ? indices.get(key) : undefined;
        if (existingIndex !== undefined) {
          if (mode === "update") {
            const merged = { ...changed[existingIndex] };
            columns.forEach((column) => {
              const incoming = record[column.name];
              if (incoming !== undefined && asText(incoming).trim() !== "") merged[column.name] = incoming;
            });
            changed[existingIndex] = merged;
            updated++;
          } else {
            duplicated++;
          }
          return;
        }
        changed.push(record);
        if (key) indices.set(key, changed.length - 1);
        added++;
      });

      onChange(changed);
      setPending([]);
      setFileName("");
      setError("");
      setMessage(added + " adicionados · " + updated + " atualizados · " +
        duplicated + " duplicados ignorados · " + incomplete +
        " com campos obrigatórios incompletos ignorados. Clique em Salvar para gravar.");
    };

    const importFile = async (event) => {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!file) return;
      if (!window.XLSX) {
        setError("O leitor de Excel não carregou. Atualize o painel e tente novamente.");
        return;
      }
      setLoading(true);
      setError("");
      setMessage("");
      try {
        const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true, raw: false });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) throw new Error("A planilha não contém uma aba de dados.");
        const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
          defval: "", raw: false, dateNF: "yyyy-mm-dd"
        });
        if (!rows.length) throw new Error("Nenhuma linha de dados foi encontrada na primeira aba.");

        const headers = Object.keys(rows[0] || {});
        const mapping = new Map();
        columns.forEach((column) => {
          const aliases = [normalize(column.name), normalize(column.label)];
          const match = headers.find((header) => aliases.includes(normalize(header)));
          if (match) mapping.set(column.name, match);
        });
        if (!mapping.size) throw new Error("Não reconheci as colunas. Use o modelo Excel disponível neste painel.");

        const imported = rows.map((row) => {
          const record = {};
          mapping.forEach((header, name) => { record[name] = asText(row[header]).trim(); });
          return record;
        }).filter((record) => Object.values(record).some((item) => asText(item).trim() !== ""));
        if (!imported.length) throw new Error("A planilha não contém registros preenchidos.");

        setPending(imported);
        setFileName(file.name);
        setMessage(imported.length + " linha(s) lida(s). Confira a prévia e confirme a importação.");
      } catch (caught) {
        setError(caught && caught.message ? caught.message : "Não foi possível ler a planilha.");
      } finally {
        setLoading(false);
      }
    };

    const label = fieldConfig.label || "registros";
    const singular = fieldConfig.label_singular || "registro";

    return html`
      <section class="gpen-planilha">
        <div class="gpen-planilha__intro">
          <div>
            <strong>Edição em tabela e importação de planilhas</strong>
            <p>Edite os registros aqui ou importe Excel/CSV. As alterações só vão para o site quando você clicar em Salvar no painel.</p>
          </div>
          <span class="gpen-planilha__contador">${records.length} ${records.length === 1 ? singular : label}</span>
        </div>

        <div class="gpen-planilha__acoes-principais">
          <button type="button" class="gpen-planilha__botao gpen-planilha__botao--principal" onClick=${addRecord}>+ Adicionar linha</button>
          <button type="button" class="gpen-planilha__botao" onClick=${() => document.getElementById(forID + "-arquivo")?.click()} disabled=${loading}>
            ${loading ? "Lendo arquivo..." : "Importar Excel/CSV"}
          </button>
          <button type="button" class="gpen-planilha__botao" onClick=${downloadTemplate}>Baixar modelo</button>
          <button type="button" class="gpen-planilha__botao" onClick=${exportCurrent}>Exportar Excel</button>
          <input id=${forID + "-arquivo"} class="gpen-planilha__input-arquivo" type="file" accept=".xlsx,.xls,.csv" onChange=${importFile} />
        </div>

        <p class="gpen-planilha__ajuda">Dica: baixe o modelo para conferir os nomes das colunas. Para fotos, envie o arquivo de imagem ao painel e preencha o caminho em img/.</p>
        ${error ? html`<div class="gpen-planilha__alerta gpen-planilha__alerta--erro" role="alert">${error}</div>` : ""}
        ${message ? html`<div class="gpen-planilha__alerta" role="status">${message}</div>` : ""}

        ${pending.length ? html`
          <div class="gpen-planilha__revisao">
            <div class="gpen-planilha__revisao-cabecalho">
              <div><strong>Prévia da importação</strong><span>${fileName} · ${pending.length} linha(s) reconhecida(s)</span></div>
              <label>Ao encontrar um registro repetido
                <select value=${mode} onChange=${(event) => setMode(event.target.value)}>
                  <option value="add">Manter o atual e ignorar a repetição</option>
                  <option value="update">Atualizar o atual com os valores preenchidos</option>
                </select>
              </label>
            </div>
            <div class="gpen-planilha__amostra">
              ${pending.slice(0, 4).map((record, index) => html`
                <div class="gpen-planilha__amostra-linha"><strong>${index + 1}.</strong><span>${columns.slice(0, 4).map((column) => asText(record[column.name])).filter(Boolean).join(" · ") || "Linha sem conteúdo visível"}</span></div>
              `)}
              ${pending.length > 4 ? html`<span class="gpen-planilha__mais">e mais ${pending.length - 4} linha(s)...</span>` : ""}
            </div>
            <div class="gpen-planilha__revisao-acoes">
              <button type="button" class="gpen-planilha__botao gpen-planilha__botao--principal" onClick=${applyImport}>Confirmar importação</button>
              <button type="button" class="gpen-planilha__botao" onClick=${() => { setPending([]); setFileName(""); }}>Cancelar</button>
            </div>
          </div>
        ` : ""}

        ${records.length === 0 ? html`
          <div class="gpen-planilha__vazia">Nenhum registro cadastrado. Adicione uma linha ou importe uma planilha.</div>
        ` : html`
          <div class="gpen-planilha__tabela-wrap">
            <table class="gpen-planilha__tabela">
              <thead><tr>
                ${columns.map((column) => html`<th scope="col">${column.label || column.name}${column.required ? " *" : ""}</th>`)}
                <th scope="col">Ações</th>
              </tr></thead>
              <tbody>
                ${records.map((record, index) => html`
                  <tr>
                    ${columns.map((column) => html`
                      <td>
                        <label class="gpen-planilha__rotulo-celula" for=${forID + "-" + index + "-" + column.name}>${column.label || column.name}</label>
                        ${renderCell(record, index, column)}
                      </td>
                    `)}
                    <td class="gpen-planilha__acoes-linha">
                      <button type="button" title="Mover para cima" aria-label="Mover linha para cima" disabled=${index === 0} onClick=${() => moveRecord(index, -1)}>↑</button>
                      <button type="button" title="Mover para baixo" aria-label="Mover linha para baixo" disabled=${index === records.length - 1} onClick=${() => moveRecord(index, 1)}>↓</button>
                      <button type="button" title="Remover linha" aria-label="Remover linha" onClick=${() => removeRecord(index)}>Remover</button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        `}
      </section>
    `;
  };

  const SpreadsheetEditorPreview = ({ value, field }) => {
    const records = asList(value);
    const config = plain(field) || {};
    return html`<span>${records.length} ${config.label || "registros"}</span>`;
  };

  CMS.registerFieldType("planilha-editor", SpreadsheetEditorControl, SpreadsheetEditorPreview);
})();