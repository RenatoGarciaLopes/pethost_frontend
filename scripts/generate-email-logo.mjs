import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// Exporta a marca existente para clientes de e-mail que não renderizam SVG/webfonts.
const root = fileURLToPath(new URL("../", import.meta.url));
const source = await fs.readFile(path.join(root, "src/shared/ui/brand/DoorMark/DoorMark.tsx"), "utf8");
const colors = await fs.readFile(path.join(root, "src/shared/theme/tokens/colors.ts"), "utf8");
const paths = [...source.matchAll(/d="(M[^"]+)"/g)].map((match) => match[1]);
const circle = source.match(/<circle cx="([^"]+)" cy="([^"]+)"/);
if (paths.length !== 2 || !circle) throw new Error("DoorMark mudou: revisar exportação da marca.");
const color = (name) => {
  const match = colors.match(new RegExp(`${name}: "(#[A-Fa-f0-9]+)"`));
  if (!match) throw new Error(`Token de cor não encontrado: ${name}`);
  return match[1];
};
const font = "https://brand.pethost.invalid/caprasimo.woff2";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 3 });
  await page.route(font, (route) =>
    route.fulfill({
      path: path.join(root, "public/fonts/caprasimo-latin-400-normal.woff2"),
      contentType: "font/woff2",
      headers: { "access-control-allow-origin": "*" },
    }),
  );
  await page.setContent(
    `<style>@font-face{font-family:Caprasimo;src:url('${font}')}body{margin:0;background:${color("papel")}}.brand{display:inline-flex;align-items:center;gap:11px;padding:4px;background:${color("papel")};font-family:Caprasimo;font-size:31px;line-height:1;letter-spacing:-.01em;color:${color("tinta")}}</style><div class="brand"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" width="40" height="44"><path d="${paths[0]}" fill="${color("luz")}" stroke="${color("tinta")}" stroke-width="8" stroke-linejoin="round"/><path d="${paths[1]}" fill="${color("coral")}" stroke="${color("tinta")}" stroke-width="8" stroke-linejoin="round"/><circle cx="${circle[1]}" cy="${circle[2]}" r="4.5" fill="${color("tinta")}"/></svg><span>pethost</span></div>`,
  );
  await page.evaluate(async () => {
    await document.fonts.load("31px Caprasimo");
    await document.fonts.ready;
  });
  if (!(await page.evaluate(() => document.fonts.check("31px Caprasimo"))))
    throw new Error("A fonte da marca não carregou.");
  const logo = page.locator(".brand");
  const output = path.join(root, "public/brand/email-logo.png");
  // Bake the light surface into the pixels: email dark-mode CSS cannot protect transparent ink.
  await logo.screenshot({ path: output, omitBackground: false });
  console.log(JSON.stringify({ output, size: await logo.boundingBox() }));
} finally {
  await browser.close();
}
