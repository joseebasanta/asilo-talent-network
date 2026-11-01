import { timeAgo } from "../lib/accounts/format";
import { esc, requireSession, store, toast } from "./accounts-client";
import { postHtml } from "./feed-ui";

const me = requireSession();
const root = document.querySelector<HTMLElement>("[data-moderation]")!;

if (me) {
  root.querySelector<HTMLElement>("[data-body]")!.hidden = false;
  const list = root.querySelector<HTMLElement>("[data-list]")!;
  const render = () => {
    store.refresh();
    const reports = store.openReports();
    list.innerHTML = reports.length
      ? reports.map((r) => `<li class="report" data-report="${esc(r.id)}">
          <p class="field-hint">Reportada por ${esc(r.reporterName)} · ${esc(timeAgo(r.createdAt))}</p>
          ${postHtml(r.post).replace(/<footer[\s\S]*<\/footer>/, "").replace(/<details[\s\S]*?<\/details>/, "")}
          <div class="row-actions"><button class="button button-primary" type="button" data-hide="${esc(r.id)}">Ocultar anuncio</button>
          <button class="button button-secondary" type="button" data-dismiss="${esc(r.id)}">Descartar reporte</button></div></li>`).join("")
      : `<li class="empty"><p>No hay reportes pendientes.</p></li>`;
  };
  list.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("button");
    if (!b) return;
    if (b.dataset.hide) { store.resolveReport(b.dataset.hide, "hide"); toast("Publicación oculta."); render(); }
    if (b.dataset.dismiss) { store.resolveReport(b.dataset.dismiss, "dismiss"); toast("Reporte descartado."); render(); }
  });
  render();
}
