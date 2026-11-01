/** "Promociones" block of the profile: request and (mock) pay for a note on the Asilo Digital blog. */
import { PROMO_BLOG, type PromotionOrder } from "../lib/accounts/types";
import { clearErrors, esc, setFieldError, store, toast } from "./accounts-client";

const root = document.querySelector<HTMLElement>("[data-promotions]");
const me = store.currentAccount();

if (root && me) {
  const form = root.querySelector<HTMLFormElement>("[data-promo-form]")!;
  const empty = root.querySelector<HTMLElement>("[data-promo-empty]")!;
  const checkout = root.querySelector<HTMLElement>("[data-promo-checkout]")!;
  const ordersBox = root.querySelector<HTMLElement>("[data-promo-orders]")!;
  const ordersTitle = root.querySelector<HTMLElement>("[data-promo-orders-title]")!;
  const select = form.elements.namedItem("project") as HTMLSelectElement;
  const brief = form.elements.namedItem("brief") as HTMLTextAreaElement;
  const count = root.querySelector<HTMLElement>("[data-promo-count]")!;
  const usd = (n: number) => `$${n.toLocaleString("es-VE")} USD`;
  const date = (t: number) => new Date(t).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" });

  const projects = store.postableProjects();
  form.hidden = projects.length === 0;
  empty.hidden = projects.length !== 0;
  select.innerHTML = projects.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
  const wanted = new URLSearchParams(location.search).get("promocion");
  if (wanted && projects.some((p) => p.id === wanted)) {
    select.value = wanted;
    queueMicrotask(() => root.scrollIntoView({ block: "start" }));
  }
  brief.addEventListener("input", () => { count.textContent = `${brief.value.length}/${PROMO_BLOG.briefMax}`; });

  function renderCheckout(order: PromotionOrder | null) {
    if (!order) { checkout.hidden = true; checkout.innerHTML = ""; return; }
    const project = store.getProject(order.projectId);
    checkout.hidden = false;
    if (order.status === "paid") {
      checkout.innerHTML = `<div class="checkout-done" role="status"><h3>¡Solicitud recibida!</h3>
        <p>El equipo de Asilo Digital te escribirá a <strong>${esc(me!.email)}</strong> para coordinar la nota sobre <strong>${esc(project?.name ?? "tu proyecto")}</strong>.</p></div>`;
      return;
    }
    checkout.innerHTML = `<div class="checkout"><h3>Resumen del pedido</h3>
      <dl><div><dt>Producto</dt><dd>${esc(PROMO_BLOG.name)}</dd></div>
      <div><dt>Proyecto</dt><dd>${esc(project?.name ?? "—")}</dd></div>
      <div><dt>Total</dt><dd><strong>${usd(order.amountUsd)}</strong></dd></div></dl>
      <p class="mock-note" role="note">Pago simulado: no se realiza ningún cobro. Al conectar el procesador de pagos, aquí se abrirá el pago de ${usd(order.amountUsd)}.</p>
      <div class="step-actions"><button class="button button-secondary" type="button" data-pay-later>Pagar después</button>
      <button class="button button-primary" type="button" data-pay="${esc(order.id)}">Pagar ${usd(order.amountUsd)}</button></div></div>`;
    checkout.querySelector<HTMLElement>("[data-pay]")!.focus();
  }

  function renderOrders() {
    store.refresh();
    const orders = store.promotionOrders();
    ordersTitle.hidden = orders.length === 0;
    ordersBox.innerHTML = orders.map((o) => `<li class="promo-order">
      <div><strong>${esc(o.project?.name ?? "Proyecto")}</strong><small>${esc(date(o.createdAt))} · ${usd(o.amountUsd)}</small></div>
      <span class="chip ${o.status === "paid" ? "chip--stage" : ""}">${o.status === "paid" ? "Pagada" : "Pendiente de pago"}</span>
      ${o.status === "pending_payment" ? `<div class="row-actions"><button class="link-button" type="button" data-resume="${esc(o.id)}">Pagar</button><button class="link-button" type="button" data-cancel="${esc(o.id)}">Cancelar</button></div>` : ""}
    </li>`).join("");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors(form);
    if (!(form.elements.namedItem("terms") as HTMLInputElement).checked) return setFieldError(form, "terms", "Acepta las condiciones para continuar.");
    const r = store.createPromotionOrder(select.value, brief.value);
    if (!r.ok) return setFieldError(form, r.field, r.error);
    form.reset();
    count.textContent = `0/${PROMO_BLOG.briefMax}`;
    renderOrders();
    renderCheckout(r.value);
  });

  root.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("button");
    if (!t) return;
    if (t.dataset.pay) {
      const r = store.payPromotionOrder(t.dataset.pay);
      if (!r.ok) return toast(r.error);
      renderOrders();
      renderCheckout(r.value);
      toast("Pago registrado.");
    } else if (t.dataset.payLater !== undefined) {
      renderCheckout(null);
      toast("Tu solicitud quedó pendiente de pago.");
    } else if (t.dataset.resume) {
      renderCheckout(store.promotionOrders().find((o) => o.id === t.dataset.resume) ?? null);
      checkout.scrollIntoView({ block: "nearest" });
    } else if (t.dataset.cancel) {
      if (!window.confirm("¿Cancelar esta solicitud?")) return;
      store.cancelPromotionOrder(t.dataset.cancel);
      renderCheckout(null);
      renderOrders();
    }
  });

  renderOrders();
}
