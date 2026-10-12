import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { fetchAddressByCep } from "./viaCep";

const url = "https://viacep.com.br/ws/:cep/json/";
const found = { cep: "87020-000", logradouro: "Avenida Brasil", bairro: "Zona 01", localidade: "Maringá", uf: "PR" };

describe("fetchAddressByCep (MSW)", () => {
  it("REQ-OREG-005 devolve o endereço e envia só os dígitos do CEP", async () => {
    let requested = "";
    server.use(
      http.get(url, ({ request, params }) => {
        requested = `${params.cep} ${new URL(request.url).search}`;
        return HttpResponse.json(found);
      }),
    );

    await expect(fetchAddressByCep("87020-000")).resolves.toEqual({
      street: "Avenida Brasil",
      neighborhood: "Zona 01",
      city: "Maringá",
      state: "PR",
    });
    expect(requested).toBe("87020000 ");
  });

  it.each([true, "true"])("REQ-OREG-005 CEP inexistente (erro: %s) vira null", async (erro) => {
    server.use(http.get(url, () => HttpResponse.json({ erro })));
    await expect(fetchAddressByCep("99999999")).resolves.toBeNull();
  });

  it("REQ-OREG-005 tempo esgotado lança erro", async () => {
    server.use(
      http.get(url, async () => {
        await delay("infinite");
        return HttpResponse.json(found);
      }),
    );
    await expect(fetchAddressByCep("87020000", { timeoutMs: 30 })).rejects.toThrow();
  });

  it("REQ-OREG-005 falha HTTP, rede ou formato inesperado lança erro", async () => {
    server.use(http.get(url, () => new HttpResponse(null, { status: 500 })));
    await expect(fetchAddressByCep("87020000")).rejects.toThrow("500");

    server.use(http.get(url, () => HttpResponse.error()));
    await expect(fetchAddressByCep("87020000")).rejects.toThrow();

    server.use(http.get(url, () => HttpResponse.json({ logradouro: 1 })));
    await expect(fetchAddressByCep("87020000")).rejects.toThrow();
  });

  it("REQ-OREG-005 CEP incompleto nem chega à rede", async () => {
    await expect(fetchAddressByCep("8702")).rejects.toThrow("8 dígitos");
  });
});
