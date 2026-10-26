import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import config from "../next.config";

const root = path.resolve(import.meta.dirname, "..");

describe("assets públicos da marca usados pelo site e e-mails", () => {
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
