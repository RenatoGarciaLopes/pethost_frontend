import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import config from "../next.config";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");

describe("assets públicos da marca usados pelo site e e-mails", () => {
  it("usa o mesmo papel opaco da marca na logo e em todos os títulos, sem placas brancas", async () => {
    const files = [
      path.join(root, "public/brand/email-logo.png"),
      ...fs
        .readdirSync(path.join(root, "public/brand/email-headings"))
        .map((name) => path.join(root, "public/brand/email-headings", name)),
    ];
    for (const file of files) {
      const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let darkPixels = 0;
      let minimumAlpha = 255;
      for (let offset = 0; offset < data.length; offset += info.channels) {
        minimumAlpha = Math.min(minimumAlpha, data[offset + 3]);
        if (data[offset] < 70 && data[offset + 1] < 70 && data[offset + 2] < 70) darkPixels++;
      }
      expect(minimumAlpha, file).toBe(255);
      expect(darkPixels, file).toBeGreaterThan(100);
      expect([...data.subarray(0, 3)], file).toEqual([254, 250, 243]);
    }
  });
  it("entrega todos os títulos registrados no backend como PNGs Caprasimo em 2x, sem assets órfãos", () => {
    const entries = JSON.parse(
      fs.readFileSync(path.join(root, "src/test/fixtures/emailHeadingAssets.json"), "utf8"),
    ) as Array<{ title: string; image: string; width: number; height: number }>;
    expect(entries.length).toBeGreaterThanOrEqual(34);
    const files = fs.readdirSync(path.join(root, "public/brand/email-headings")).sort();
    expect(files).toEqual(entries.map((entry) => entry.image).sort());
    for (const entry of entries) {
      const image = fs.readFileSync(path.join(root, "public/brand/email-headings", entry.image));
      expect(image.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(image.readUInt32BE(16)).toBe(entry.width * 2);
      expect(image.readUInt32BE(20)).toBeGreaterThanOrEqual((entry.height - 1) * 2);
    }
  });

  it("mantém todas as fontes do layout acessíveis em arquivos WOFF2 públicos válidos", () => {
    const layout = fs.readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
    const files = [...layout.matchAll(/public\/(fonts\/[^"']+\.woff2)/g)].map((match) => match[1]);
    expect(new Set(files).size).toBe(4);
    for (const file of files) {
      expect(
        fs
          .readFileSync(path.join(root, "public", file))
          .subarray(0, 4)
          .toString("ascii"),
      ).toBe("wOF2");
    }
  });

  it("entrega a logo em PNG de alta resolução compatível com clientes sem SVG", () => {
    const logo = fs.readFileSync(path.join(root, "public/brand/email-logo.png"));
    expect(logo.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(logo.readUInt32BE(16)).toBeGreaterThanOrEqual(177 * 3);
    expect(logo.readUInt32BE(20)).toBe(52 * 3);
  });

  it("permite carregar apenas as fontes públicas a partir de clientes de e-mail de outra origem", async () => {
    const headers = await config.headers!();
    expect(headers.find((rule) => rule.source === "/fonts/:path*")?.headers).toContainEqual({
      key: "Access-Control-Allow-Origin",
      value: "*",
    });
    expect(headers.find((rule) => rule.source === "/reset-password")?.headers).toContainEqual({
      key: "Referrer-Policy",
      value: "no-referrer",
    });
  });
});
