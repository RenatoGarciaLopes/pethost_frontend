import { describe, expect, it } from "vitest";
import openApi from "../../../../openapi/pethost.v1.json";
import { apiOnlyRoutes, bffRoutes, matchBffRoute, sessionOnlyRoutes } from "./bffRoutes";

const API_PREFIX = "/api/v1";
const operations = Object.entries(openApi.paths as Record<string, Record<string, unknown>>).flatMap(([path, methods]) =>
  Object.keys(methods).map((method) => `${method.toUpperCase()} ${path.slice(API_PREFIX.length)}`),
);
const key = (route: { method: string; pattern: string }) => `${route.method} ${route.pattern}`;

describe("matchBffRoute", () => {
  it("REQ-HTTP-009 casa padrões com parâmetros", () => {
    expect(matchBffRoute("GET", "/pets/me")).toMatchObject({ pattern: "/pets/me" });
    expect(
      matchBffRoute("PATCH", "/pets/0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c/photos/0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d"),
    ).toMatchObject({ pattern: "/pets/{petId}/photos/{photoId}" });
    expect(matchBffRoute("get", "/users/me")).toBeDefined();
  });

  it("REQ-HTTP-009 nega método ou caminho fora da lista", () => {
    expect(matchBffRoute("DELETE", "/pets/me")).toBeUndefined();
    expect(matchBffRoute("GET", "/internal/metrics")).toBeUndefined();
    expect(matchBffRoute("GET", "/pets/me/extra")).toBeUndefined();
  });

  it("REQ-HTTP-009 parâmetro não aceita travessia nem barra codificada", () => {
    expect(matchBffRoute("GET", "/pets/..")).toBeUndefined();
    expect(matchBffRoute("GET", "/pets/a%2F..%2Fusers")).toBeUndefined();
    expect(matchBffRoute("GET", "/pets/a b")).toBeUndefined();
  });

  it("REQ-HTTP-007 rotas que devolvem tokens nunca passam pelo proxy", () => {
    for (const route of sessionOnlyRoutes) {
      expect(matchBffRoute(route.method, route.pattern)).toBeUndefined();
    }
  });
});

describe("lista permitida × OpenAPI (teste de contrato)", () => {
  it("REQ-HTTP-009 toda rota da lista existe na API", () => {
    const missing = bffRoutes.map(key).filter((route) => !operations.includes(route));

    expect(missing).toEqual([]);
  });

  it("REQ-HTTP-009 toda operação da API é proxy ou handler de sessão (nada esquecido)", () => {
    const covered = new Set([...bffRoutes, ...sessionOnlyRoutes, ...apiOnlyRoutes].map(key));

    expect(operations.filter((operation) => !covered.has(operation))).toEqual([]);
  });

  it("REQ-HTTP-009 o webhook do Stripe nunca passa pelo proxy do navegador", () => {
    expect(apiOnlyRoutes.map(key)).toEqual(["POST /stripe/webhooks"]);
    expect(matchBffRoute("POST", "/stripe/webhooks")).toBeUndefined();
  });

  it("REQ-HTTP-009 sem duplicatas", () => {
    expect(new Set(bffRoutes.map(key)).size).toBe(bffRoutes.length);
  });
});
