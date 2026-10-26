import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "--font-mock" }),
}));

import { quintalColors } from "@/shared/theme/tokens/colors";
import RootLayout, { metadata } from "./layout";
import { preload } from "react-dom";
import { TURMA_MEMBERS, turmaSrc } from "@/shared/ui/brand/turma";

vi.mock("react-dom", async (original) => ({ ...(await original<typeof import("react-dom")>()), preload: vi.fn() }));

describe("RootLayout metadata & brand favicon", () => {
  it("exporta metadata com title, description e icons configurados para SVG, ICO e iPhone", () => {
    expect(metadata.title).toBe("PetHost");
    expect(metadata.description).toBe("Hospedagem de pets perto de casa.");
    expect(metadata.icons).toEqual({
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    });
  });

  it("prévia de link usa a imagem grande do site com URL absoluta", () => {
    expect(metadata.metadataBase).toEqual(new URL("https://pethost.cfd"));
    expect(metadata.openGraph).toEqual({ type: "website", siteName: "PetHost", locale: "pt_BR" });
    expect(metadata.twitter).toEqual({ card: "summary_large_image" });
    expect(fs.readFileSync(path.resolve(__dirname, "opengraph-image.alt.txt"), "utf-8")).toMatch(/^PetHost: porta/);
  });

  it.each([
    ["opengraph-image.png", 1200, 630],
    ["apple-icon.png", 180, 180],
  ])("%s é PNG %ix%i leve o bastante para o WhatsApp", (file, width, height) => {
    const png = fs.readFileSync(path.resolve(__dirname, file));
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(png.readUInt32BE(16)).toBe(width);
    expect(png.readUInt32BE(20)).toBe(height);
    expect(png.length).toBeLessThan(300_000);
  });

  it("icon.svg reutiliza a porta do DoorMark conforme especificação de marca para favicon", () => {
    const svgPath = path.resolve(__dirname, "icon.svg");
    expect(fs.existsSync(svgPath)).toBe(true);

    const svgContent = fs.readFileSync(svgPath, "utf-8");
    // viewBox oficial da marca
    expect(svgContent).toContain('viewBox="0 0 100 110"');
    // Batente + luz e folha coral reutilizam os paths da porta
    expect(svgContent).toContain("M10 104V46A40 40 0 0 1 90 46V104Z");
    expect(svgContent).toContain("M50 104V46A20 40 0 0 1 90 46V104Z");
    // Cores oficiais do tema Quintal
    expect(svgContent).toContain(quintalColors.luz);
    expect(svgContent).toContain(quintalColors.coral);
    expect(svgContent).toContain(quintalColors.tinta);
    // Traço 14 no tamanho favicon (o traço engorda quando encolhe) e sem maçaneta
    expect(svgContent).toContain('stroke-width="14"');
    expect(svgContent).not.toContain("<circle");
  });

  it("favicon.ico é um arquivo ICO binário válido substituindo o padrão do Next.js", () => {
    const icoPath = path.resolve(__dirname, "favicon.ico");
    expect(fs.existsSync(icoPath)).toBe(true);

    const icoBuffer = fs.readFileSync(icoPath);
    // Header ICO: reservado = 0, tipo = 1 (ícone)
    expect(icoBuffer.readUInt16LE(0)).toBe(0);
    expect(icoBuffer.readUInt16LE(2)).toBe(1);
    const imageCount = icoBuffer.readUInt16LE(4);
    expect(imageCount).toBeGreaterThanOrEqual(1);
    // Não é o arquivo padrão de ~15KB do template Next.js
    expect(icoBuffer.length).toBeLessThan(10000);
  });
});

it("preloads every loader image before navigation needs the route fallback", () => {
  vi.mocked(preload).mockClear();
  RootLayout({ children: null });
  expect(preload).toHaveBeenCalledTimes(TURMA_MEMBERS.length);
  for (const member of TURMA_MEMBERS)
    expect(preload).toHaveBeenCalledWith(turmaSrc(member), { as: "image", fetchPriority: "high" });
});
