import { describe, expect, it } from "vitest";
import { quintalColors } from "@/shared/theme/tokens/colors";
import { buildMapStyle, MAP_TILES_URL } from "./mapStyle";

describe("estilo do mapa da busca", () => {
  const style = buildMapStyle(quintalColors);

  it("REQ-SRCH-013 usa só tiles do OpenFreeMap, com atribuição ao OpenStreetMap", () => {
    const source = style.sources.openmaptiles;
    expect(source).toMatchObject({ type: "vector", url: MAP_TILES_URL });
    expect((source as { attribution: string }).attribution).toContain("OpenStreetMap");
    expect(style.glyphs).toContain("tiles.openfreemap.org");
  });

  it("REQ-SRCH-013 sem POIs nem ruído: só terra, água, ruas e bairros, e nenhuma cor fora da marca", () => {
    const layers = style.layers.map((layer) => ("source-layer" in layer ? layer["source-layer"] : undefined));
    expect(new Set(layers)).toEqual(new Set(["landcover", "park", "water", "transportation", "place"]));
    const colors = JSON.stringify(style.layers).match(/#[0-9A-Fa-f]{6}/g) ?? [];
    const brand = new Set(Object.values(quintalColors).map((color) => color.toLowerCase()));
    expect(colors.length).toBeGreaterThan(0);
    for (const color of colors) expect(brand.has(color.toLowerCase())).toBe(true);
  });

  it("REQ-SRCH-013 avenidas em gema com contorno de tinta por baixo, ruas secundárias em cartão", () => {
    const paint = (id: string) => style.layers.find((layer) => layer.id === id)?.paint as Record<string, unknown>;
    expect(paint("avenidas-fill")["line-color"]).toBe(quintalColors.gema);
    expect(paint("avenidas-casing")["line-color"]).toBe(quintalColors.tinta);
    expect(paint("secundarias-fill")["line-color"]).toBe(quintalColors.cartao);
    const ids = style.layers.map((layer) => layer.id);
    expect(ids.indexOf("avenidas-casing")).toBeLessThan(ids.indexOf("avenidas-fill"));
  });

  it("REQ-SRCH-013 hierarquia de ruas: só vias principais em gema, secundárias em cartão, locais quase invisíveis, bairros só os maiores", () => {
    const layer = (id: string) => style.layers.find((item) => item.id === id) as Record<string, unknown>;
    expect(JSON.stringify(layer("avenidas-fill").filter)).toContain('["primary","trunk","motorway"]');
    expect(JSON.stringify(layer("secundarias-fill").filter)).toContain('["secondary","tertiary"]');
    const locais = layer("locais");
    expect(locais.minzoom).toBeGreaterThanOrEqual(14);
    expect((locais.paint as Record<string, number>)["line-opacity"]).toBeLessThanOrEqual(0.2);
    expect(JSON.stringify(layer("bairros").filter)).toContain('["suburb"]');
  });
});
