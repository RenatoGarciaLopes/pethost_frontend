import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountRole } from "@/shared/auth/contracts/session";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { AccountMenu } from "./AccountMenu";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
beforeEach(() => router.replace.mockReset());

const USER = { id: "11111111-1111-4111-8111-111111111111", fullName: "Camila Souza", avatarUrl: null };

function setup(role: AccountRole = "owner") {
  return renderWithProviders(<AccountMenu user={{ ...USER, role }} />, { theme: quintalTheme });
}
async function openMenu(user: ReturnType<typeof setup>["user"]) {
  await user.click(screen.getByRole("button", { name: "CS Menu da conta de Camila Souza" }));
  return screen.findByRole("menu");
}
function accounts(list: { role: "owner" | "host"; isActive: boolean; isCurrent: boolean }[]) {
  let reads = 0;
  server.use(
    http.get("*/api/users/me/accounts", () => {
      reads += 1;
      return HttpResponse.json(apiOk(list));
    }),
  );
  return () => reads;
}

describe("menu da conta", () => {
  it("REQ-SHELL-003 iniciais no botão; nome e conta no menu", async () => {
    accounts([{ role: "owner", isActive: true, isCurrent: true }]);
    const { user } = setup("owner");
    expect(screen.getByRole("button", { name: "CS Menu da conta de Camila Souza" })).toHaveTextContent("CS");
    await openMenu(user);
    expect(screen.getByText("Camila Souza")).toBeInTheDocument();
    expect(screen.getByText("Conta de tutor")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Minha conta" })).toHaveAttribute("href", "/users/profile");
  });

  it("REQ-SHELL-004 com a outra conta ativa oferece a troca; só busca as contas ao abrir", async () => {
    const reads = accounts([
      { role: "owner", isActive: true, isCurrent: true },
      { role: "host", isActive: true, isCurrent: false },
    ]);
    const { user } = setup("owner");
    expect(reads()).toBe(0);
    await openMenu(user);
    expect(await screen.findByRole("menuitem", { name: "Trocar pra conta de anfitrião" })).toHaveAttribute(
      "href",
      "/users/switch?to=host",
    );
    expect(reads()).toBe(1);
  });

  it("REQ-SHELL-004 outra conta pausada ou ausente não vira item de troca", async () => {
    accounts([
      { role: "host", isActive: true, isCurrent: true },
      { role: "owner", isActive: false, isCurrent: false },
    ]);
    const { user } = setup("host");
    await openMenu(user);
    await waitFor(() => expect(screen.queryByRole("menuitem", { name: /Trocar/ })).not.toBeInTheDocument());
    expect(screen.getByRole("menuitem", { name: "Sair" })).toBeInTheDocument();
  });

  it("REQ-SHELL-004 falha nas contas esconde só a troca; o resto do menu continua", async () => {
    server.use(
      http.get("*/api/users/me/accounts", () => HttpResponse.json(apiFail("INTERNAL_ERROR"), { status: 500 })),
    );
    const { user } = setup("owner");
    await openMenu(user);
    await waitFor(() => expect(screen.queryByRole("menuitem", { name: /Trocar/ })).not.toBeInTheDocument());
    expect(screen.getByRole("menuitem", { name: "Minha conta" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sair" })).toBeInTheDocument();
  });

  it("REQ-SHELL-003 admin: sem Minha conta, sem troca e sem buscar contas, mesmo com contas no cache", async () => {
    const reads = accounts([]);
    const { user, queryClient } = setup("admin");
    queryClient.setQueryData(
      ["account", USER.id, "linked-accounts"],
      [{ role: "owner", isActive: true, isCurrent: false }],
    );
    await openMenu(user);
    expect(screen.getByText("Conta de admin")).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Minha conta" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Trocar/ })).not.toBeInTheDocument();
    expect(reads()).toBe(0);
  });

  it("REQ-SHELL-005 Sair chama o logout do BFF, limpa o cache e vai para o login", async () => {
    accounts([{ role: "owner", isActive: true, isCurrent: true }]);
    let loggedOut = false;
    server.use(
      http.post("*/api/auth/sessions/logout", () => {
        loggedOut = true;
        return HttpResponse.json(apiOk({}));
      }),
    );
    const { user, queryClient } = setup("owner");
    queryClient.setQueryData(["account", USER.id, "profile"], { fullName: "Camila" });
    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Sair" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(loggedOut).toBe(true);
    expect(queryClient.getQueryData(["account", USER.id, "profile"])).toBeUndefined();
  });
});
