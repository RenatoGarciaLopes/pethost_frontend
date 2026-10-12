import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { AddressFields } from "./AddressFields";

const empty = { zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" };
const addresses: Record<string, object> = {
  "87020000": { logradouro: "Avenida Brasil", bairro: "Zona 01", localidade: "Maringá", uf: "PR" },
  "01310100": { logradouro: "Avenida Paulista", bairro: "Bela Vista", localidade: "São Paulo", uf: "SP" },
};

function useViaCep() {
  const requested = vi.fn();
  server.use(
    http.get("https://viacep.com.br/ws/:cep/json/", ({ params }) => {
      requested(params.cep);
      return HttpResponse.json(addresses[String(params.cep)] ?? { erro: true });
    }),
  );
  return requested;
}

function Harness({ address = empty, children }: { address?: typeof empty; children?: ReactNode }) {
  const form = useForm({ defaultValues: { address } });
  return (
    <FormProvider {...form}>
      <AddressFields />
      {children}
    </FormProvider>
  );
}

const field = (name: string) => screen.getByRole("textbox", { name });

describe("AddressFields", () => {
  it("REQ-OREG-016 campos certos, com autocomplete e teclado numérico no CEP", () => {
    renderWithProviders(<Harness />);
    expect(field("CEP")).toHaveAttribute("autocomplete", "postal-code");
    expect(field("CEP")).toHaveAttribute("inputmode", "numeric");
    expect(field("Rua")).toHaveAttribute("autocomplete", "address-line1");
    expect(field("Complemento (opcional)")).toHaveAttribute("autocomplete", "address-line2");
    expect(field("Cidade")).toHaveAttribute("autocomplete", "address-level2");
    expect(screen.getByRole("combobox", { name: "UF" })).toHaveAttribute("autocomplete", "address-level1");
    expect(screen.getByText("Sem número? Escreve S/N.")).toBeVisible();
    expect(screen.getAllByRole("option")).toHaveLength(28);
  });

  it("REQ-OREG-005 endereço fica travado até o CEP ser buscado; CEP achado preenche rua, bairro, cidade e UF", async () => {
    const requested = useViaCep();
    const { user } = renderWithProviders(<Harness />);
    expect(field("Rua")).toBeDisabled();

    await user.type(field("CEP"), "87020000");
    await waitFor(() => expect(field("Rua")).toHaveValue("Avenida Brasil"));
    expect(field("CEP")).toHaveValue("87020-000");
    expect(field("Bairro")).toHaveValue("Zona 01");
    expect(field("Cidade")).toHaveValue("Maringá");
    expect(screen.getByRole("combobox", { name: "UF" })).toHaveValue("PR");
    expect(field("Rua")).toBeEnabled();
    expect(field("Número")).toBeEnabled();
    expect(requested).toHaveBeenCalledTimes(1);
    expect(requested).toHaveBeenCalledWith("87020000");
  });

  it("REQ-OREG-005 CEP não achado avisa e libera os campos vazios", async () => {
    useViaCep();
    const { user } = renderWithProviders(<Harness />);
    await user.type(field("CEP"), "99999999");
    expect(await screen.findByText("Não achamos esse CEP. Preenche o endereço que a gente segue.")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Não achamos esse CEP");
    expect(field("Rua")).toBeEnabled();
    expect(field("Rua")).toHaveValue("");
  });

  // Digita tecla a tecla e espera duas buscas: com a suíte inteira em paralelo passa dos 5 s padrão.
  it("REQ-OREG-005 trocar o CEP não sobrescreve o que a pessoa editou", async () => {
    useViaCep();
    const { user } = renderWithProviders(<Harness />);
    await user.type(field("CEP"), "87020000");
    await waitFor(() => expect(field("Rua")).toHaveValue("Avenida Brasil"));

    await user.clear(field("Rua"));
    await user.type(field("Rua"), "Rua que eu escrevi");
    await user.clear(field("CEP"));
    await user.type(field("CEP"), "01310100");

    await waitFor(() => expect(field("Cidade")).toHaveValue("São Paulo"));
    expect(field("Bairro")).toHaveValue("Bela Vista");
    expect(field("Rua")).toHaveValue("Rua que eu escrevi");
  }, 15_000);

  it("REQ-OREG-007 voltando com endereço preenchido, os campos já vêm liberados (sem buscar CEP incompleto)", () => {
    renderWithProviders(<Harness address={{ ...empty, zipCode: "8702", street: "Rua A", city: "Maringá" }} />);
    expect(field("Rua")).toBeEnabled();
    expect(field("Rua")).toHaveValue("Rua A");
  });

  it("mostra a mensagem de erro do schema no campo", async () => {
    function WithError() {
      const form = useForm({ defaultValues: { address: empty } });
      return (
        <FormProvider {...form}>
          <AddressFields />
          <button type="button" onClick={() => form.setError("address.zipCode", { message: "O CEP tem 8 números." })}>
            erro
          </button>
        </FormProvider>
      );
    }
    const { user } = renderWithProviders(<WithError />);
    await user.click(screen.getByRole("button", { name: "erro" }));
    expect(field("CEP")).toHaveAccessibleDescription("O CEP tem 8 números.");
    expect(field("CEP")).toHaveAttribute("aria-invalid", "true");
  });

  it("REQ-OREG-009 erro da API num campo de endereço leva o foco ao <input> dele", async () => {
    function FocusHarness() {
      const form = useForm({ defaultValues: { address: { ...empty, street: "Rua A", city: "Maringá" } } });
      return (
        <FormProvider {...form}>
          <AddressFields />
          <button
            type="button"
            onClick={() =>
              form.setError("address.city", { type: "server", message: "Cidade inválida." }, { shouldFocus: true })
            }
          >
            erro
          </button>
        </FormProvider>
      );
    }
    const { user } = renderWithProviders(<FocusHarness />);
    await user.click(screen.getByRole("button", { name: "erro" }));
    expect(field("Cidade")).toHaveFocus();
    expect(screen.getByText("Cidade inválida.")).toBeVisible();
  });
});
