import { field, router, saveButton, createProfileSetup } from "@/test/profileEditor";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { ProfileEditor } from "./ProfileEditor";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { accountAddressFixture, ownerProfileDtoFixture as dto } from "@/test/fixtures/account";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
const setupProfile = createProfileSetup(ProfileEditor);
it("REQ-ACC-002/003/004/006 cartão público, e-mail travado e campos livres sem mudanças", async () => {
  await setupProfile();
  expect(screen.getByRole("heading", { name: dto.user.fullName, level: 2 })).toBeInTheDocument();
  expect(screen.getByText("CS")).toBeInTheDocument();
  expect(screen.getByText("Centro")).toBeInTheDocument();
  expect(screen.getByText("No PetHost desde outubro de 2026")).toBeInTheDocument();
  expect(field("E-mail")).toHaveAttribute("readonly");
  expect(field("E-mail")).toHaveAccessibleDescription(/login/);
  for (const name of ["Seu nome completo", "Celular com DDD", "Quando você nasceu", "Rua"])
    expect(field(name)).not.toHaveAttribute("readonly");
  expect(saveButton()).toBeDisabled();
  expect(screen.getByText("Nada mudou ainda.")).toBeInTheDocument();
});
it("REQ-ACC-002 foto atual aparece no cartão público", async () => {
  await setupProfile("owner", { ...dto, user: { ...dto.user, avatarUrl: "https://images.example.test/foto.png" } });
  expect(screen.getByAltText("Sua foto do perfil")).toHaveAttribute("src", "https://images.example.test/foto.png");
});
it("REQ-ACC-013 CPF fica mascarado até Mostrar e pode ser escondido de novo", async () => {
  const { user } = await setupProfile();
  expect(field("CPF")).toHaveValue("***.***.247-25");
  await user.click(screen.getByRole("button", { name: "Mostrar" }));
  expect(field("CPF")).toHaveValue("529.982.247-25");
  await user.click(screen.getByRole("button", { name: "Esconder" }));
  expect(field("CPF")).toHaveValue("***.***.247-25");
});
it.each(["CPF", "Quando você nasceu"])(
  "REQ-ACC-005 mudar %s pede senha e voltar ao original remove o pedido",
  async (label) => {
    const { user } = await setupProfile();
    if (label === "CPF") await user.click(screen.getByRole("button", { name: "Mostrar" }));
    const original = (field(label) as HTMLInputElement).value;
    await user.clear(field(label));
    await user.type(field(label), label === "CPF" ? "16899535009" : "04051990");
    expect(field("Sua senha atual")).toBeInTheDocument();
    await user.clear(field(label));
    await user.type(field(label), original.replace(/\D/g, ""));
    expect(screen.queryByLabelText(/^Sua senha atual/)).not.toBeInTheDocument();
  },
);
it("REQ-ACC-005 sem senha atual bloqueia o PATCH no campo e permite confirmar depois", async () => {
  const bodies: unknown[] = [];
  server.use(
    http.patch("*/api/owners/me", async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(apiOk({ ...dto, cpf: "16899535009" }));
    }),
  );
  const { user } = await setupProfile();
  await user.click(screen.getByRole("button", { name: "Mostrar" }));
  await user.clear(field("CPF"));
  await user.type(field("CPF"), "16899535009");
  await user.click(saveButton());
  expect(await screen.findByText("Falta sua senha atual.")).toBeInTheDocument();
  expect(field("Sua senha atual")).toHaveFocus();
  expect(bodies).toEqual([]);
  await user.type(field("Sua senha atual"), "senha-atual");
  await user.click(saveButton());
  await screen.findByText("Pronto, guardado.");
  expect(bodies).toEqual([{ cpf: "16899535009", currentPassword: "senha-atual" }]);
});
it("REQ-ACC-006/012 envia só telefone, guarda o cache e atualiza a página", async () => {
  const bodies: unknown[] = [];
  server.use(
    http.patch("*/api/owners/me", async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(apiOk({ ...dto, user: { ...dto.user, phone: "11999999999" } }));
    }),
  );
  const { user, queryClient } = await setupProfile();
  await user.clear(field("Celular com DDD"));
  await user.type(field("Celular com DDD"), "11999999999");
  await user.click(saveButton());
  await screen.findByText("Pronto, guardado.");
  expect(bodies).toEqual([{ phone: "11999999999" }]);
  expect(queryClient.getQueryData(accountQueryKey("user-1", "profile"))).toMatchObject({ phone: "11999999999" });
  expect(router.refresh).toHaveBeenCalledOnce();
  await waitFor(() => expect(saveButton()).toBeDisabled());
});
it("REQ-ACC-006 endereço vai inteiro e complemento apagado vira string vazia", async () => {
  let body: unknown;
  server.use(
    http.patch("*/api/owners/me", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(
        apiOk({ ...dto, user: { ...dto.user, address: { ...accountAddressFixture, complement: "" } } }),
      );
    }),
  );
  const { user } = await setupProfile();
  await user.clear(field("Complemento"));
  await user.click(saveButton());
  await screen.findByText("Pronto, guardado.");
  expect(body).toEqual({ address: { ...accountAddressFixture, complement: "" } });
});

it("REQ-ACC-002 carregamento sinaliza ocupado e só libera o formulário quando o perfil chega", async () => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.get("*/api/owners/me", async () => {
      await pending;
      return HttpResponse.json(apiOk(dto));
    }),
    http.get("https://viacep.com.br/ws/:cep/json/", () => HttpResponse.json({ erro: true })),
  );
  const { container } = renderWithProviders(<ProfileEditor userId="user-1" role="owner" />, { theme: quintalTheme });
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
  release();
  await screen.findByRole("heading", { name: "Seu perfil", level: 1 });
  expect(saveButton()).toBeDisabled();
});
it("REQ-ACC-006 envio pendente bloqueia repetição e sinaliza salvamento", async () => {
  let release!: () => void,
    calls = 0;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.patch("*/api/owners/me", async () => {
      calls++;
      await pending;
      return HttpResponse.json(apiOk({ ...dto, user: { ...dto.user, fullName: "Camila Teste" } }));
    }),
  );
  const { user } = await setupProfile();
  await user.clear(field("Seu nome completo"));
  await user.type(field("Seu nome completo"), "Camila Teste");
  await user.click(saveButton());
  await waitFor(() => expect(calls).toBe(1));
  const button = screen.getByRole("button", { name: "Salvando…" });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(calls).toBe(1);
  release();
  await screen.findByText("Pronto, guardado.");
});
