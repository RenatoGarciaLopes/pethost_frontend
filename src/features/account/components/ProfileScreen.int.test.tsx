import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { ownerProfileDtoFixture, hostProfileDtoFixture } from "@/test/fixtures/account";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { AccountSettingsLayout } from "./AccountSettingsLayout";
import { ProfileScreen } from "./ProfileScreen";
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "pethost_at" ? { value: "access-sintetico" } : undefined) }),
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }), usePathname: () => "/users/profile" }));
it.each(["owner", "host"] as const)(
  "REQ-ACC-002/009/027 prefetch %s hidrata a tela sem segundo GET e conserva o conteúdo na navegação",
  async (role) => {
    let backendCalls = 0;
    const dto = role === "owner" ? ownerProfileDtoFixture : hostProfileDtoFixture;
    server.use(
      http.get("http://api.test/api/v1/" + role + "s/me", () => {
        backendCalls++;
        return HttpResponse.json(apiOk(dto));
      }),
      http.get("https://viacep.com.br/ws/:cep/json/", () => HttpResponse.json({ erro: true })),
    );
    const userId = "user-" + role;
    const content = await ProfileScreen({ userId, role });
    const { queryClient } = renderWithProviders(<AccountSettingsLayout>{content}</AccountSettingsLayout>, {
      theme: quintalTheme,
    });
    expect(await screen.findByRole("heading", { level: 1, name: "Seu perfil" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "conteudo");
    expect(screen.getByRole("navigation", { name: "Minha conta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: dto.user.fullName })).toBeInTheDocument();
    expect(queryClient.getQueryData(accountQueryKey(userId, "profile"))).toMatchObject({
      role,
      fullName: dto.user.fullName,
    });
    expect(backendCalls).toBe(1);
  },
);
