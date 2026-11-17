import { createDemoPromotion } from "../lib/accounts/demo-feed";
import { createDemoSession } from "../lib/accounts/demo-session";

const root = document.querySelector<HTMLElement>("[data-demo-promotions]");
if (root) {
  const session = createDemoSession();
  const gate = document.querySelector<HTMLElement>("[data-demo-promotion-gate]");
  if (gate) gate.hidden = session.isSignedIn();
  root.hidden = !session.isSignedIn();
  const promotions = createDemoPromotion();
  const form = root.querySelector<HTMLFormElement>("[data-demo-promo-form]")!;
  const brief = form.elements.namedItem("brief") as HTMLTextAreaElement;
  const error = root.querySelector<HTMLElement>("[data-demo-promo-error]")!;
  const checkout = root.querySelector<HTMLElement>("[data-demo-promo-checkout]")!;
  const orders = root.querySelector<HTMLElement>("[data-demo-promo-orders]")!;
  const renderOrders = () => { orders.replaceChildren(...promotions.orders().map((order) => { const item = document.createElement("li"); item.className = "promo-order"; item.textContent = `${order.projectId === "demo-pana-pay" ? "Pana Pay" : "Ruta Viva"} · ${order.status === "paid" ? "Pagada en demo" : "Pendiente de pago simulado"}`; return item; })); };
  brief.addEventListener("input", () => { root.querySelector<HTMLElement>("[data-demo-promo-count]")!.textContent = `${brief.value.length}/600`; });
  form.addEventListener("submit", (event) => { event.preventDefault(); if (!(form.elements.namedItem("terms") as HTMLInputElement).checked) { error.textContent = "Confirma que entiendes la simulación."; error.hidden = false; return; } const outcome = promotions.create(String(new FormData(form).get("project")), brief.value); if (!outcome.ok) { error.textContent = outcome.error; error.hidden = false; return; } error.hidden = true; checkout.hidden = false; checkout.replaceChildren(); const box = document.createElement("div"); box.className = "checkout"; box.innerHTML = "<h3>Resumen del pedido</h3><p>Pago simulado · no se procesa dinero real.</p>"; const pay = document.createElement("button"); pay.className = "button button-primary"; pay.type = "button"; pay.textContent = "Simular pago"; pay.addEventListener("click", () => { promotions.pay(outcome.value.id); box.textContent = "Solicitud recibida. El pago quedó marcado como simulado."; renderOrders(); }); box.append(pay); checkout.append(box); form.reset(); renderOrders(); });
  renderOrders();
}
