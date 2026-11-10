import { describe, expect, it } from "vitest";
import { buildNodes, decay, edgeColor, edgeLength, FADE_MS, falloff, GAP, parseHex, RADIUS } from "../src/scripts/servicios-dot-grid";

describe("servicios CTA dot grid", () => {
  it("lays a centred grid of dots every 48px that covers the whole area", () => {
    const { nodes, cols, rows } = buildNodes(500, 200);
    expect(GAP).toBe(48);
    expect(cols).toBe(Math.floor(500 / 48) + 1);
    expect(rows).toBe(Math.floor(200 / 48) + 1);
    expect(nodes).toHaveLength(cols * rows);
    // Centrada: el mismo margen a izquierda y derecha, y arriba y abajo.
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    expect(Math.min(...xs)).toBeCloseTo(500 - Math.max(...xs));
    expect(Math.min(...ys)).toBeCloseTo(200 - Math.max(...ys));
    expect(nodes[1]!.x - nodes[0]!.x).toBe(GAP);
    expect(nodes.every((n) => n.a === 0)).toBe(true);
  });

  it("lights dots fully under the cursor and fades them out smoothly towards the edge of the radius", () => {
    expect(falloff(0)).toBe(1);
    expect(falloff(RADIUS)).toBe(0);
    expect(falloff(RADIUS + 50)).toBe(0);
    const mid = falloff(RADIUS / 2);
    expect(mid).toBeGreaterThan(0.3);
    expect(mid).toBeLessThan(0.7);
    expect(falloff(20)).toBeGreaterThan(falloff(80));
  });

  it("leaves a trail that fades to zero in about 900ms", () => {
    expect(FADE_MS).toBe(900);
    expect(decay(1, 450)).toBeCloseTo(0.5);
    expect(decay(1, 900)).toBe(0);
    expect(decay(0.1, 500)).toBe(0);
    let a = 1;
    for (let t = 0; t < 900; t += 16) a = decay(a, 16);
    expect(a).toBeLessThan(0.02);
  });

  it("grows the segment between two dots with the activation, leaving space around each dot", () => {
    expect(edgeLength(0)).toBe(0);
    expect(edgeLength(1)).toBe(GAP - 12);
    expect(edgeLength(0.5)).toBeGreaterThan(edgeLength(0.25));
    expect(edgeLength(2)).toBe(edgeLength(1));
  });

  it("colours segments from brand blue at the edge to light blue at the core, more opaque the more active", () => {
    const from: [number, number, number] = [0, 102, 255];
    const to: [number, number, number] = [153, 194, 255];
    expect(edgeColor(0, from, to)).toBe("rgba(0, 102, 255, 0.150)");
    expect(edgeColor(1, from, to)).toBe("rgba(153, 194, 255, 1.000)");
    expect(parseHex("#0066ff", [1, 1, 1])).toEqual([0, 102, 255]);
    expect(parseHex(" #fff", [1, 1, 1])).toEqual([255, 255, 255]);
    expect(parseHex("var(--x)", [1, 2, 3])).toEqual([1, 2, 3]);
  });
});
