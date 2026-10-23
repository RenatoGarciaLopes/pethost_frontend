import { expect, test } from "@playwright/test";

test("campos focados mantêm a borda sem o contorno azul externo", async ({ page }) => {
  await page.goto("/login");
  for (const name of ["E-mail", "Senha"]) {
    const input = page.getByLabel(new RegExp(`^${name}`));
    const field = input.locator("..");
    await input.click();
    await expect(input).toBeFocused();
    await expect(field).toHaveCSS("outline-style", "none");
    await input.fill(name === "Senha" ? "senha-de-teste" : "teste@example.com");
    await expect(input).toHaveValue(name === "Senha" ? "senha-de-teste" : "teste@example.com");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(input).toBeFocused();
    await expect(field).toHaveCSS("outline-style", "none");
  }
});

test("REQ-DS-003 fontes locais e título Caprasimo sem Google Fonts", async ({ page }) => {
  const remoteFonts: string[] = [];
  page.on("request", (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) remoteFonts.push(request.url());
  });
  await page.goto("/login");
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.locator("h1").evaluate((heading) => ({
    actual: getComputedStyle(heading).fontFamily,
    display: getComputedStyle(document.body).getPropertyValue("--font-display"),
    body: getComputedStyle(document.body).fontFamily,
    bodyVariable: getComputedStyle(document.body).getPropertyValue("--font-body"),
    size: getComputedStyle(document.body).fontSize,
  }));
  expect(fonts.display).toBeTruthy();
  expect(fonts.actual.replace(/["']/g, "")).toContain(fonts.display.trim().replace(/["']/g, ""));
  expect(fonts.actual).toMatch(/caprasimo/i);
  expect(fonts.body.replace(/["']/g, "")).toContain(fonts.bodyVariable.trim().replace(/["']/g, ""));
  expect(fonts.body).toMatch(/atkinsonHyperlegibleNext/i);
  expect(fonts.size).toBe("17px");
  expect(remoteFonts).toEqual([]);
});

test("REQ-DS-004 REQ-DS-005 REQ-DS-006 REQ-DS-007 botão afunda e mostra foco", async ({ page }) => {
  await page.goto("/login");
  const button = page.getByRole("button", { name: "Entrar", exact: true });
  await expect(button).toHaveCSS("border-top-width", "2px");
  await expect(button).toHaveCSS("border-top-color", "rgb(31, 26, 23)");
  await expect(button).toHaveCSS("min-height", "56px");
  await expect(button).toHaveCSS("background-color", "rgb(242, 107, 58)");
  await expect(button).toHaveCSS("color", "rgb(31, 26, 23)");
  // O link logo antes do botão: um Tab leva o foco ao "Entrar".
  await page.getByRole("link", { name: "Esqueci a senha" }).focus();
  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS("outline-width", "3px");
  await expect(button).toHaveCSS("outline-color", "rgb(31, 26, 23)");
  await expect(button).toHaveCSS("outline-offset", "3px");
  if (!test.info().project.use.isMobile) {
    await button.hover();
    await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -1)");
  }
  const bounds = await button.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 3, 3)");
  await expect(button).toHaveCSS("box-shadow", /0px 0px 0px/);
  await page.mouse.up();
});

test("REQ-DS-008 preferência reduzida remove transições e deslocamentos", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  const button = page.getByRole("button", { name: "Entrar", exact: true });
  await button.hover();
  await expect(button).toHaveCSS("transition-duration", "0s");
  await expect(button).toHaveCSS("transform", "none");
});
