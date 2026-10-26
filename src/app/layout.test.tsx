import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "--font-mock" }),
}));

import { quintalColors } from "@/shared/theme/tokens/colors";
import { metadata } from "./layout";

describe("RootLayout metadata & brand favicon", () => {
  it("exporta metadata com title, description e icons configurados para SVG e ICO", () => {
    expect(metadata.title).toBe("PetHost");
    expect(metadata.description).toBe("Hospedagem de pets perto de casa.");
    expect(metadata.icons).toEqual({
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
    });
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
