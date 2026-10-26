"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchAddressByCep, type CepAddress } from "../api/external/viaCep";

/** Estado da busca do CEP. `notFound` cobre CEP inexistente, falha e tempo esgotado. */
export type CepLookup =
  { status: "idle" } | { status: "loading" } | { status: "found"; address: CepAddress } | { status: "notFound" };

/**
 * Busca o endereço do CEP no ViaCEP quando ele tem 8 dígitos (REQ-OREG-005).
 * Cada CEP é consultado uma vez por sessão do navegador (`staleTime` infinito, sem retry nem refetch
 * no foco): voltar ao passo ou redigitar o mesmo CEP não faz outra requisição.
 *
 * @example const lookup = useCepLookup(zipCode); if (lookup.status === "found") fill(lookup.address);
 */
export function useCepLookup(cep: string): CepLookup {
  const enabled = /^\d{8}$/.test(cep);
  const query = useQuery({
    queryKey: ["cep", cep],
    queryFn: ({ signal }) => fetchAddressByCep(cep, { signal }),
    enabled,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (!enabled) return { status: "idle" };
  if (query.isPending) return { status: "loading" };
  if (query.isError || !query.data) return { status: "notFound" };
  return { status: "found", address: query.data };
}
