import { afterEach, describe, expect, it, vi } from "vitest";
import { parseServerEnv } from "./env.server";

const validEnv = {
  BACKEND_URL: "http://localhost:5038",
  BACKEND_API_PREFIX: "/api/v1",
  NODE_ENV: "test",
};

describe("parseServerEnv", () => {
  it("REQ-TOOL-015 devolve o ambiente tipado quando tudo é válido", () => {
    const env = parseServerEnv(validEnv);

    expect(env.backendUrl).toBe("http://localhost:5038");
    expect(env.backendApiPrefix).toBe("/api/v1");
    expect(env.backendApiBaseUrl).toBe("http://localhost:5038/api/v1");
    expect(env.requestTimeoutMs).toBe(15000);
    expect(env.isProduction).toBe(false);
  });

  it("REQ-TOOL-015 aceita a barra final na URL sem duplicar no endereço base", () => {
    const env = parseServerEnv({ ...validEnv, BACKEND_URL: "http://localhost:5038/" });

    expect(env.backendApiBaseUrl).toBe("http://localhost:5038/api/v1");
  });

  it("REQ-TOOL-015 lê o tempo limite configurado", () => {
    expect(parseServerEnv({ ...validEnv, BACKEND_TIMEOUT_MS: "8000" }).requestTimeoutMs).toBe(8000);
  });

  it("REQ-TOOL-015 nomeia a variável ausente", () => {
    expect(() => parseServerEnv({ NODE_ENV: "test" })).toThrow(/BACKEND_URL/);
  });

  it("REQ-TOOL-015 recusa URL inválida citando a variável", () => {
    expect(() => parseServerEnv({ ...validEnv, BACKEND_URL: "localhost:5038" })).toThrow(/BACKEND_URL/);
  });

  it("REQ-TOOL-015 recusa prefixo que não começa com barra", () => {
    expect(() => parseServerEnv({ ...validEnv, BACKEND_API_PREFIX: "api/v1" })).toThrow(/BACKEND_API_PREFIX/);
  });

  it("REQ-TOOL-015 recusa tempo limite que não é inteiro positivo", () => {
    expect(() => parseServerEnv({ ...validEnv, BACKEND_TIMEOUT_MS: "0" })).toThrow(/BACKEND_TIMEOUT_MS/);
  });

  it("REQ-HTTP-013 lê as origens públicas do app (lista separada por vírgula)", () => {
    expect(parseServerEnv(validEnv).appOrigins).toEqual([]);
    expect(
      parseServerEnv({ ...validEnv, APP_ORIGINS: "https://pethost.app, https://www.pethost.app/" }).appOrigins,
    ).toEqual(["https://pethost.app", "https://www.pethost.app"]);
  });

  it("REQ-HTTP-013 recusa origem inválida citando a variável", () => {
    expect(() => parseServerEnv({ ...validEnv, APP_ORIGINS: "pethost.app" })).toThrow(/APP_ORIGINS/);
  });

  it("REQ-TOOL-015 identifica produção", () => {
    expect(parseServerEnv({ ...validEnv, NODE_ENV: "production" }).isProduction).toBe(true);
  });
});

describe("getServerEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("REQ-TOOL-015 lê process.env uma vez e reaproveita o resultado", async () => {
    vi.stubEnv("BACKEND_URL", "http://api.test");
    vi.stubEnv("BACKEND_API_PREFIX", "/api/v1");
    const { getServerEnv } = await import("./env.server");

    const first = getServerEnv();
    vi.stubEnv("BACKEND_URL", "http://outro.test");

    expect(first.backendApiBaseUrl).toBe("http://api.test/api/v1");
    expect(getServerEnv()).toBe(first);
  });

  it("REQ-TOOL-015 falha na primeira leitura quando o ambiente está incompleto", async () => {
    vi.stubEnv("BACKEND_URL", "");
    const { getServerEnv } = await import("./env.server");

    expect(() => getServerEnv()).toThrow(/BACKEND_URL/);
  });
});
