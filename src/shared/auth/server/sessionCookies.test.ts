import { describe, expect, it } from "vitest";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  buildSessionCookies,
  clearSessionCookies,
  isSecureOrigin,
  readAccessTokenExpiry,
  readSessionTokens,
  setSessionCookies,
  type CookieWrite,
} from "./sessionCookies";

const now = Date.parse("2026-10-11T12:00:00Z");
const tokens = { accessToken: "a.b.c", refreshToken: "r", expiresAt: now / 1000 + 900 };

function fakeStore(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const writes: CookieWrite[] = [];
  return {
    writes,
    get: (name: string) => (values.has(name) ? { name, value: values.get(name)! } : undefined),
    set: (cookie: CookieWrite) => {
      writes.push(cookie);
      values.set(cookie.name, cookie.value);
    },
  };
}

function jwtWithExp(exp: number) {
  const payload = Buffer.from(JSON.stringify({ sub: "1", exp })).toString("base64url");
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`;
}

describe("buildSessionCookies", () => {
  it("REQ-HTTP-007 cookies HttpOnly, SameSite=Lax e Secure fora de localhost", () => {
    const [access, refresh] = buildSessionCookies(tokens, { secure: true, now });

    for (const cookie of [access, refresh]) {
      expect(cookie).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true });
    }
    expect(buildSessionCookies(tokens, { secure: false, now })[0]!.secure).toBe(false);
  });

  it("REQ-HTTP-008 access expira em expiresAt; refresh em 30 dias e só nas rotas do BFF", () => {
    const [access, refresh] = buildSessionCookies(tokens, { secure: true, now });

    expect(access).toMatchObject({ name: ACCESS_COOKIE, value: "a.b.c", path: "/", maxAge: 900 });
    expect(refresh).toMatchObject({ name: REFRESH_COOKIE, value: "r", path: "/api", maxAge: 30 * 24 * 60 * 60 });
  });

  it("REQ-HTTP-008 duração do refresh configurável e expiresAt no passado vira 0", () => {
    const [access, refresh] = buildSessionCookies(
      { ...tokens, expiresAt: now / 1000 - 10 },
      { secure: true, now, refreshMaxAgeSeconds: 60 },
    );

    expect(access!.maxAge).toBe(0);
    expect(refresh!.maxAge).toBe(60);
  });
});

describe("set, clear e read", () => {
  it("REQ-HTTP-007 grava e lê os dois tokens", () => {
    const store = fakeStore();
    setSessionCookies(store, tokens, { secure: false, now });

    expect(readSessionTokens(store)).toEqual({ accessToken: "a.b.c", refreshToken: "r" });
  });

  it("REQ-HTTP-012 clear apaga com o mesmo Path de cada cookie", () => {
    const store = fakeStore({ [ACCESS_COOKIE]: "a", [REFRESH_COOKIE]: "r" });
    clearSessionCookies(store, { secure: true });

    expect(store.writes).toEqual([
      expect.objectContaining({ name: ACCESS_COOKIE, value: "", path: "/", maxAge: 0 }),
      expect.objectContaining({ name: REFRESH_COOKIE, value: "", path: "/api", maxAge: 0 }),
    ]);
  });

  it("REQ-HTTP-015 sem cookies devolve vazio", () => {
    expect(readSessionTokens(fakeStore())).toEqual({ accessToken: undefined, refreshToken: undefined });
  });
});

describe("readAccessTokenExpiry", () => {
  it("REQ-HTTP-011 lê o exp do JWT só para agendar o refresh", () => {
    expect(readAccessTokenExpiry(jwtWithExp(1_791_461_700))).toBe(1_791_461_700);
  });

  it("REQ-HTTP-011 token ilegível devolve undefined (trata como vencido)", () => {
    expect(readAccessTokenExpiry("nope")).toBeUndefined();
    expect(readAccessTokenExpiry("a.###.c")).toBeUndefined();
    expect(readAccessTokenExpiry(`a.${Buffer.from('{"exp":"x"}').toString("base64url")}.c`)).toBeUndefined();
  });
});

describe("isSecureOrigin", () => {
  it("REQ-HTTP-007 https é seguro; http só fora de localhost exige Secure", () => {
    expect(isSecureOrigin("https://pethost.app/x")).toBe(true);
    expect(isSecureOrigin("http://localhost:3000/x")).toBe(false);
    expect(isSecureOrigin("http://127.0.0.1:3000/x")).toBe(false);
    expect(isSecureOrigin("http://pethost.app/x")).toBe(true);
  });
});
