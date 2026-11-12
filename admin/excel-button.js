(() => {
  "use strict";

  const repo = "maiconcarlospng/Site-GPENSC-Teste";
  const allowedFiles = new Set([
    "noticias", "eventos", "linhas", "projetos", "publicacoes", "livros",
    "defesas", "equipe", "disciplinas", "videos", "sites", "apoio",
    "parcerias", "linha_tempo"
  ]);

  let root;
  let button;
  let menu;

  const currentFile = () => {
    const route = decodeURIComponent(window.location.hash || "");
    const match = route.match(/\/entries\/([^/?#]+)/i);
    if (!match) return null;
    const file = match[1].replace(/\.yml$/i, "");
    return allowedFiles.has(file) ? file : null;
  };

  const notify = (message) => {
    const notice = document.createElement("div");
    notice.textContent = message;
    Object.assign(notice.style, {
      position: "fixed", right: "22px", bottom: "76px", zIndex: "100000",
      maxWidth: "min(360px, calc(100vw - 32px))", padding: "11px 14px",
      borderRadius: "9px", background: "#244d31", color: "#fff",
      boxShadow: "0 8px 24px rgba(0,0,0,.18)", font: "600 13px/1.45 Inter, sans-serif"
    });
    document.body.appendChild(notice);
    window.setTimeout(() => notice.remove(), 3600);
  };

  const downloadWorkbook = async () => {
    const file = currentFile();
    if (!file) {
      notify("Abra uma seção de conteúdo para exportar os registros.");
      return;
    }
    if (!window.XLSX || !window.jsyaml) {
      notify("Os recursos do Excel ainda estão carregando. Atualize o painel.");
      return;
    }

    button.disabled = true;
    button.textContent = "Preparando...";
    try {
      const url = "https://raw.githubusercontent.com/" + repo + "/admin-rascunhos/data/" + file + ".yml";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível acessar os dados salvos desta seção.");
      const yamlText = await response.text();
      const parsed = window.jsyaml.load(yamlText) || {};
      const records = Array.isArray(parsed.itens) ? parsed.itens : [];
      if (!records.length) {
        notify("Esta seção ainda não possui registros para exportar.");
        return;
      }

      const workbook = window.XLSX.utils.book_new();
      const sheet = window.XLSX.utils.json_to_sheet(records);
      sheet["!cols"] = Object.keys(records[0]).map((key) => ({
        wch: Math.min(42, Math.max(14, key.length + 5))
      }));
      window.XLSX.utils.book_append_sheet(workbook, sheet, "Registros");
      window.XLSX.writeFile(workbook, "gpensc-" + file + ".xlsx");
      notify("Arquivo Excel dos dados salvos no rascunho preparado.");
    } catch (error) {
      notify(error && error.message ? error.message : "Não foi possível gerar o arquivo Excel.");
    } finally {
      button.disabled = false;
      button.textContent = "Excel";
    }
  };

  const closeMenu = () => {
    if (menu) menu.hidden = true;
    if (button) button.setAttribute("aria-expanded", "false");
  };

  const createButton = () => {
    if (root || !document.body) return;
    root = document.createElement("div");
    root.id = "gpen-excel-tools";
    Object.assign(root.style, {
      position: "fixed", right: "22px", bottom: "20px", zIndex: "99999",
      fontFamily: "Inter, sans-serif"
    });

    button = document.createElement("button");
    button.type = "button";
    button.textContent = "Excel";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-haspopup", "true");
    Object.assign(button.style, {
      minWidth: "82px", minHeight: "42px", padding: "9px 16px",
      border: "1px solid #1f4d2b", borderRadius: "9px",
      background: "#1f4d2b", color: "#fff", font: "700 13px Inter, sans-serif",
      boxShadow: "0 5px 18px rgba(31,77,43,.2)", cursor: "pointer"
    });

    menu = document.createElement("div");
    menu.hidden = true;
    Object.assign(menu.style, {
      position: "absolute", right: "0", bottom: "50px", width: "230px",
      padding: "10px", border: "1px solid #dce6d8", borderRadius: "10px",
      background: "#fff", boxShadow: "0 10px 28px rgba(0,0,0,.14)"
    });

    const title = document.createElement("strong");
    title.textContent = "Planilha da seção";
    Object.assign(title.style, {
      display: "block", margin: "2px 5px 8px", color: "#244d31",
      fontSize: "12px"
    });

    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.textContent = "Exportar dados salvos (.xlsx)";
    Object.assign(exportButton.style, {
      width: "100%", padding: "10px", border: "0", borderRadius: "7px",
      background: "#f2f7ef", color: "#31543a", textAlign: "left",
      font: "600 12px Inter, sans-serif", cursor: "pointer"
    });
    exportButton.addEventListener("click", () => {
      closeMenu();
      downloadWorkbook();
    });

    const note = document.createElement("p");
    note.textContent = "Exporta os registros salvos na branch de rascunhos. As edições ainda não salvas no Sveltia não entram no arquivo.";
    Object.assign(note.style, {
      margin: "8px 5px 2px", color: "#748075", fontSize: "10px", lineHeight: "1.45"
    });

    menu.append(title, exportButton, note);
    button.addEventListener("click", () => {
      const opening = menu.hidden;
      menu.hidden = !opening;
      button.setAttribute("aria-expanded", String(opening));
    });
    root.append(menu, button);
    document.body.appendChild(root);

    document.addEventListener("click", (event) => {
      if (!root.contains(event.target)) closeMenu();
    });
  };

  const sync = () => {
    const loggedIn = !document.body.classList.contains("gpen-login-active");
    if (loggedIn && !root) createButton();
    if (root) {
      root.style.display = loggedIn && currentFile() ? "block" : "none";
      closeMenu();
    }
  };

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("hashchange", sync);
  document.addEventListener("DOMContentLoaded", sync);
  sync();
})();
