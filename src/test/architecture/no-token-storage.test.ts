import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Proteção estática do REQ-HTTP-019: token, documento ou URL assinada nunca vão para
 * `localStorage`, `sessionStorage`, store Zustand ou log. Varre `src/` (sem testes e sem código gerado).
 */
const SRC = path.resolve(__dirname, "../..");
const SKIP_DIRS = new Set(["test", "generated"]);
const isSource = (file: string) => /\.(ts|tsx)$/.test(file) && !/\.(test|int\.test|stories)\.tsx?$/.test(file);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return SKIP_DIRS.has(name) ? [] : sourceFiles(full);
    return isSource(name) ? [full] : [];
  });
}

const files = sourceFiles(SRC).map((file) => ({
  file: path.relative(SRC, file).replaceAll("\\", "/"),
  code: readFileSync(file, "utf8"),
}));

const SENSITIVE = /(token|refresh|authorization|bearer|signed.?url|document|cpf|password|senha)/i;

describe("REQ-HTTP-019 dados sensíveis fora do navegador e dos logs", () => {
  it("varre arquivos de verdade", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("nenhum localStorage/sessionStorage guarda dado sensível", () => {
    const offenders = files.flatMap(({ file, code }) =>
      [...code.matchAll(/(localStorage|sessionStorage)\.setItem\(([^)]*)\)/g)]
        .filter((match) => SENSITIVE.test(match[2]!))
        .map((match) => `${file}: ${match[0]}`),
    );

    expect(offenders).toEqual([]);
  });

  it("nenhum log com dado sensível", () => {
    const offenders = files.flatMap(({ file, code }) =>
      [...code.matchAll(/console\.(log|info|warn|error|debug)\(([^;]*)\)/g)]
        .filter((match) => SENSITIVE.test(match[2]!))
        .map((match) => `${file}: ${match[0]}`),
    );

    expect(offenders).toEqual([]);
  });

  it("nenhum store Zustand com campo de token", () => {
    const offenders = files
      .filter(({ code }) => /from "zustand/.test(code))
      .filter(({ code }) => /(accessToken|refreshToken|signedUrl)\s*[:?]/.test(code))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  it("REQ-OREG-014 senha e CPF nunca vão para URL nem query key", () => {
    const PERSONAL = /(cpf|password|senha)/i;
    const offenders = files.flatMap(({ file, code }) =>
      [
        ...code.matchAll(/queryKey:\s*(\[[^\]]*\])/g),
        ...code.matchAll(/(?:searchParams|URLSearchParams\([^)]*\))\.(?:set|append)\(([^)]*)\)/g),
        ...code.matchAll(/router\.(?:push|replace)\(([^;]*)\)/g),
      ]
        .filter((match) => PERSONAL.test(match[1]!))
        .map((match) => `${file}: ${match[0]}`),
    );

    expect(offenders).toEqual([]);
  });

  it("REQ-OREG-014 formulários com senha ou CPF não guardam rascunho fora da memória", () => {
    const offenders = files
      .filter(({ code }) => /(cpf|password)/i.test(code))
      .filter(({ code }) => /\bpersist\(|createJSONStorage|indexedDB/.test(code))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  it("cookies de sessão só são lidos no servidor", () => {
    const offenders = files
      .filter(({ code }) => /pethost_(at|rt)|ACCESS_COOKIE|REFRESH_COOKIE/.test(code))
      .filter(({ file }) => !file.startsWith("shared/auth/server/"))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });
});
