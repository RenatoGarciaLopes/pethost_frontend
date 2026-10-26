import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

// Exporta a prévia de links (WhatsApp, redes) e o ícone do iPhone: esses clientes não leem SVG.
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
const door = (width, stroke, knob) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" width="${width}" height="${(width * 110) / 100}" overflow="visible"><path d="${paths[0]}" fill="${color("luz")}" stroke="${color("tinta")}" stroke-width="${stroke}" stroke-linejoin="round"/><path d="${paths[1]}" fill="${color("coral")}" stroke="${color("tinta")}" stroke-width="${stroke}" stroke-linejoin="round"/><circle cx="${circle[1]}" cy="${circle[2]}" r="${knob}" fill="${color("tinta")}"/></svg>`;
// Primeiro quadro real de cada cão da turma, em resolução nativa (320×238).
const dog = async (member) =>
  `data:image/png;base64,${(
    await sharp(path.join(root, `public/brand/turma/${member}.webp`), { pages: 1 })
      .png()
      .toBuffer()
  ).toString("base64")}`;
const [corgi, golden, pastor] = await Promise.all(["corgi", "golden", "pastor"].map(dog));
const fonts = {
  caprasimo: "public/fonts/caprasimo-latin-400-normal.woff2",
  atkinson: "public/fonts/atkinson-hyperlegible-next-latin-700-normal.woff2",
};

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.route("https://brand.pethost.invalid/*", (route) =>
    route.fulfill({
      path: path.join(root, fonts[path.basename(new URL(route.request().url()).pathname, ".woff2")]),
      contentType: "font/woff2",
      headers: { "access-control-allow-origin": "*" },
    }),
  );
  await page.setContent(
    `<style>
      @font-face{font-family:Caprasimo;src:url('https://brand.pethost.invalid/caprasimo.woff2')}
      @font-face{font-family:Atkinson;font-weight:700;src:url('https://brand.pethost.invalid/atkinson.woff2')}
      body{margin:0}
      .card{position:relative;width:1200px;height:630px;overflow:hidden;background:${color("papel")};color:${color("tinta")}}
      .sun{position:absolute;right:96px;top:58px;width:92px;height:92px;border-radius:50%;background:${color("gema")};border:4px solid ${color("tinta")}}
      .brand{position:absolute;left:0;right:0;top:118px;display:flex;justify-content:center;align-items:center;gap:44px}
      .word{font:400 150px/1 Caprasimo;letter-spacing:-.01em;transform:translateY(-6px)}
      .tagline{position:absolute;left:0;right:0;top:342px;text-align:center;font:700 44px/1.2 Atkinson;color:${color("texto2")}}
      .lawn{position:absolute;left:-8px;right:-8px;bottom:-8px;height:132px;background:${color("grama")};border-top:4px solid ${color("tinta")}}
      .dog{position:absolute;bottom:126px;height:136px}
    </style>
    <div class="card">
      <div class="sun"></div>
      <div class="brand">${door(156, 6, 4)}<span class="word">pethost</span></div>
      <div class="tagline">Hospedagem de pets perto de casa.</div>
      <div class="lawn"></div>
      <img class="dog" style="left:72px" src="${corgi}" alt="">
      <img class="dog" style="right:268px" src="${golden}" alt="">
      <img class="dog" style="right:64px" src="${pastor}" alt="">
    </div>`,
  );
  await page.evaluate(async () => {
    await Promise.all([document.fonts.load("150px Caprasimo"), document.fonts.load("700 44px Atkinson")]);
    await document.fonts.ready;
  });
  if (
    !(await page.evaluate(() => document.fonts.check("150px Caprasimo") && document.fonts.check("700 44px Atkinson")))
  )
    throw new Error("As fontes da marca não carregaram.");
  const share = await page.locator(".card").screenshot();
  await sharp(share)
    .png({ palette: true, quality: 90, effort: 10 })
    .toFile(path.join(root, "src/app/opengraph-image.png"));

  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(
    `<style>body{margin:0}.icon{width:180px;height:180px;display:flex;align-items:center;justify-content:center;background:${color("papel")}}</style><div class="icon">${door(104, 8, 4.5)}</div>`,
  );
  await page.locator(".icon").screenshot({ path: path.join(root, "src/app/apple-icon.png") });
} finally {
  await browser.close();
}
for (const file of ["src/app/opengraph-image.png", "src/app/apple-icon.png"]) {
  const { width, height, size } = await sharp(path.join(root, file)).metadata();
  console.log(JSON.stringify({ file, width, height, bytes: size ?? (await fs.stat(path.join(root, file))).size }));
}
