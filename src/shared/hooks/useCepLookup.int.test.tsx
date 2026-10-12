import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { useCepLookup } from "./useCepLookup";

const url = "https://viacep.com.br/ws/:cep/json/";

function Probe({ cep }: { cep: string }) {
  const lookup = useCepLookup(cep);
  return <output>{lookup.status === "found" ? `found ${lookup.address.city}` : lookup.status}</output>;
}

describe("useCepLookup (MSW)", () => {
  it("REQ-OREG-005 CEP incompleto fica parado, sem requisição", () => {
    renderWithProviders(<Probe cep="8702000" />);
    expect(screen.getByRole("status")).toHaveTextContent("idle");
  });

  it("REQ-OREG-005 CEP válido busca e acha; o mesmo CEP de novo não pede outra vez", async () => {
    let calls = 0;
    server.use(
      http.get(url, () => {
        calls++;
        return HttpResponse.json({ logradouro: "Av. Brasil", bairro: "Zona 01", localidade: "Maringá", uf: "PR" });
      }),
    );
    const { rerender } = renderWithProviders(<Probe cep="87020000" />);
    expect(screen.getByRole("status")).toHaveTextContent("loading");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("found Maringá"));

    rerender(<Probe cep="8702000" />);
    expect(screen.getByRole("status")).toHaveTextContent("idle");
    rerender(<Probe cep="87020000" />);
    expect(screen.getByRole("status")).toHaveTextContent("found Maringá");
    expect(calls).toBe(1);
  });

  it("REQ-OREG-005 CEP inexistente e falha viram notFound, sem nova tentativa", async () => {
    let calls = 0;
    server.use(
      http.get(url, ({ params }) => {
        calls++;
        return params.cep === "99999999" ? HttpResponse.json({ erro: true }) : HttpResponse.error();
      }),
    );
    // QueryClient com os padrões do app (retry ligado): quem desliga o retry é o hook.
    const { rerender } = renderWithProviders(<Probe cep="99999999" />, { queryClient: new QueryClient() });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("notFound"));
    rerender(<Probe cep="11111111" />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("notFound"));
    expect(calls).toBe(2);
  });
});
