import { describe, expect, it } from "vitest";
import { isIsaacAccountsPrototypeEnabled } from "../src/lib/accounts/demo-gate";

describe("Isaac accounts prototype gate", () => {
  it("fails closed when the local-development opt-in is absent", () => {
    expect(isIsaacAccountsPrototypeEnabled({ dev: true, server: true })).toBe(false);
    expect(isIsaacAccountsPrototypeEnabled({})).toBe(false);
  });

  it("enables the prototype only for an explicit local development opt-in", () => {
    expect(isIsaacAccountsPrototypeEnabled({ dev: true, server: true, optIn: "1" })).toBe(true);
    expect(isIsaacAccountsPrototypeEnabled({ dev: true, server: true, optIn: "true" })).toBe(true);
    expect(isIsaacAccountsPrototypeEnabled({ dev: true, server: true, optIn: "yes" })).toBe(true);
  });

  it("rejects the opt-in outside development and for unsupported values", () => {
    expect(isIsaacAccountsPrototypeEnabled({ dev: true, server: false, optIn: "1" })).toBe(false);
    expect(isIsaacAccountsPrototypeEnabled({ dev: false, server: true, optIn: "1" })).toBe(false);
    expect(isIsaacAccountsPrototypeEnabled({ server: true, optIn: "true" })).toBe(false);
    expect(isIsaacAccountsPrototypeEnabled({ dev: true, server: true, optIn: "on" })).toBe(false);
    expect(isIsaacAccountsPrototypeEnabled({ dev: true, server: true, optIn: true })).toBe(false);
  });
});
