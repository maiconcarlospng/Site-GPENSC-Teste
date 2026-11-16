/* Calendário da home GPENSC: navegação por mês e data local do visitante.
   Os eventos são gerados pelo Quarto/R a partir do painel, não por este script. */
(() => {
  "use strict";

  function initCalendar() {
    const calendar = document.querySelector(".gp-month-calendar");
    if (!calendar || calendar.dataset.enhanced === "true") return;

    const header = calendar.querySelector(".gp-month-head");
    const monthTitle = header?.querySelector("strong");
    const grid = calendar.querySelector(".gp-month-grid");
    if (!header || !monthTitle || !grid) return;

    const months = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const eventsByDay = new Map();
    calendar.querySelectorAll(".gp-month-data time[datetime]").forEach((item) => {
      const iso = item.getAttribute("datetime");
      const title = item.getAttribute("data-title")?.trim();
      if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso) || !title) return;
      if (!eventsByDay.has(iso)) eventsByDay.set(iso, []);
      if (!eventsByDay.get(iso).includes(title)) eventsByDay.get(iso).push(title);
    });

    const dateNow = new Date();
    let selected = new Date(dateNow.getFullYear(), dateNow.getMonth(), 1);
    const isoDate = (year, month, day) =>
      [year, String(month + 1).padStart(2, "0"), String(day).padStart(2, "0")].join("-");

    const control = (label, glyph, direction) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gp-month-nav-button";
      button.setAttribute("aria-label", label);
      button.textContent = glyph;
      button.addEventListener("click", () => {
        selected = new Date(selected.getFullYear(), selected.getMonth() + direction, 1);
        render();
      });
      return button;
    };

    const navigation = document.createElement("div");
    navigation.className = "gp-month-controls";
    navigation.append(
      control("Mês anterior", "‹", -1),
      control("Próximo mês", "›", 1)
    );
    header.append(navigation);

    function render() {
      const year = selected.getFullYear();
      const month = selected.getMonth();
      const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const slots = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;
      const monthLabel = months[month].replace(/^./, (c) => c.toUpperCase()) + " de " + year;
      const now = new Date();
      const todayIso = isoDate(now.getFullYear(), now.getMonth(), now.getDate());
      const content = document.createDocumentFragment();

      monthTitle.textContent = monthLabel;
      calendar.setAttribute("aria-label", "Calendário de " + monthLabel);

      for (let i = 0; i < slots; i += 1) {
        const day = i - firstDayOffset + 1;
        if (day < 1 || day > daysInMonth) {
          const blank = document.createElement("span");
          blank.className = "gp-month-blank";
          blank.setAttribute("aria-hidden", "true");
          content.append(blank);
          continue;
        }

        const iso = isoDate(year, month, day);
        const titles = eventsByDay.get(iso) || [];
        const hasEvent = titles.length > 0;
        const isToday = iso === todayIso;
        const cell = document.createElement(hasEvent ? "a" : "span");
        cell.className = [
          "gp-month-cell",
          isToday ? "is-today" : "",
          hasEvent ? "has-event" : ""
        ].filter(Boolean).join(" ");
        const readable = [
          day + " de " + months[month],
          isToday ? "hoje" : "",
          titles.join("; ")
        ].filter(Boolean).join(", ");
        cell.setAttribute("aria-label", readable);

        if (hasEvent) {
          cell.href = "atualizacoes.html#agenda";
          cell.title = titles.join(" · ");
        }

        const time = document.createElement("time");
        time.dateTime = iso;
        time.textContent = String(day);
        cell.append(time);

        if (hasEvent) {
          const dot = document.createElement("span");
          dot.className = "gp-month-dot";
          dot.setAttribute("aria-hidden", "true");
          cell.append(dot);
        }
        content.append(cell);
      }
      grid.replaceChildren(content);
    }

    calendar.dataset.enhanced = "true";
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCalendar, { once: true });
  } else {
    initCalendar();
  }
})();
