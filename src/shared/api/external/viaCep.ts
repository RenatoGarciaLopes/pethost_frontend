import { z } from "zod";

/** Endereço sugerido pelo ViaCEP para um CEP. */
export interface CepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** Tempo máximo de espera pelo ViaCEP antes de deixar a pessoa preencher (REQ-OREG-005). */
const DEFAULT_TIMEOUT_MS = 4000;

const viaCepResponseSchema = z.union([
  z.object({ erro: z.union([z.literal(true), z.literal("true")]) }),
  z.object({
    logradouro: z.string(),
    bairro: z.string(),
    localidade: z.string(),
    uf: z.string(),
  }),
]);

interface FetchAddressByCepOptions {
  /** Cancela a consulta (o TanStack Query passa o dele). */
  signal?: AbortSignal;
  /** Tempo limite em ms (padrão 4000). */
  timeoutMs?: number;
  /** Injeção para testes. Padrão: `fetch` global, lido a cada chamada. */
  fetch?: typeof fetch;
}

/**
 * Consulta o ViaCEP para sugerir o endereço de um CEP. Envia só o CEP, nada da pessoa.
 * A API da PetHost não confere se o CEP existe; isto é só ajuda de preenchimento.
 *
 * @returns o endereço, ou `null` se o ViaCEP disser que o CEP não existe.
 * @throws em falha de rede, tempo esgotado ou resposta fora do formato.
 * @example const address = await fetchAddressByCep("87020000");
 */
export async function fetchAddressByCep(
  cep: string,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS, fetch: fetchFn }: FetchAddressByCepOptions = {},
): Promise<CepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (!/^\d{8}$/.test(digits)) throw new Error("CEP precisa de 8 dígitos");

  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, timeoutMs);
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await (fetchFn ?? globalThis.fetch)(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`ViaCEP respondeu ${response.status}`);
    const body = viaCepResponseSchema.parse(await response.json());
    if ("erro" in body) return null;
    return { street: body.logradouro, neighborhood: body.bairro, city: body.localidade, state: body.uf };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
