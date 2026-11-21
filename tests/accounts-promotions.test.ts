import { describe, expect, it } from "vitest";
import { createDemoPromotion } from "../src/lib/accounts/demo-feed";

describe("demo promotions", () => {
  it("creates a simulated order, previews checkout, and marks it paid without a processor", () => {
    const promotions = createDemoPromotion();
    const order = promotions.create("demo-pana-pay", "Una historia de crecimiento y pagos sencillos para comercios venezolanos.");
    expect(order.ok).toBe(true);
    if (order.ok) {
      expect(promotions.checkout(order.value.id)).toContain("Pago simulado");
      expect(promotions.pay(order.value.id).status).toBe("paid");
    }
  });

  it("validates the brief and never exposes real credentials or calls", () => {
    const promotions = createDemoPromotion();
    expect(promotions.create("demo-ruta-viva", "Una historia de crecimiento y pagos sencillos para comercios venezolanos.").ok).toBe(false);
    expect(promotions.create("demo-pana-pay", "corto").ok).toBe(false);
    expect(promotions.create("demo-pana-pay", "x".repeat(601)).ok).toBe(false);
    expect(promotions.source()).not.toMatch(/fetch|localStorage|password|token|GOOGLE|APPWRITE/i);
  });
});
