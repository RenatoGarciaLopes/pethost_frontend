import type { ReactElement, ReactNode } from "react";
import { expect, it, vi } from "vitest";
import type { SearchParams } from "@/shared/lib/url/searchParams";
import SearchPage from "./page";

vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  connection: async () => {},
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}));

it("REQ-SRCH-001 visitante vai ao login com filtros preservados antes de buscar pets/listings", async () => {
  const page = SearchPage({ searchParams: Promise.resolve({ where: "Maringá", hasKids: "false" }) });
  const child = page.props.children as ReactElement<{ searchParams: Promise<SearchParams> }>;
  const resolve = child.type as (props: typeof child.props) => Promise<ReactNode>;
  await expect(resolve(child.props)).rejects.toMatchObject({
    digest: expect.stringContaining("/login?next=%2Fsearch%3F"),
  });
});
