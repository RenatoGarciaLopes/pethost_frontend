"use client";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import type { SearchPet } from "../../../types";
import { useSearchUrl } from "../../../hooks/useSearchUrl";
import { queryToSearchParams } from "../../../lib/searchParams";
import { FilterChips } from "../FilterChips";

/** Pets do tutor, para o chip "Combina com {pet}". */
export interface SearchFilterBarProps {
  pets: SearchPet[];
}

/**
 * Faixa de chips colada ao cabeçalho (acima da linha de borda), como na prancha de resultados: aparece só com busca
 * na URL de `/`, numa linha que rola no celular. Ativar um chip escreve o filtro na URL.
 * @example <SearchFilterBar pets={pets} />
 */
export function SearchFilterBar({ pets }: SearchFilterBarProps) {
  const { query, update } = useSearchUrl();
  if (queryToSearchParams(query).size === 0) return null;
  return (
    <PageContainer width="page" sx={{ pb: { xs: 1.5, md: 1.5 }, pt: { xs: 0, md: 0 } }}>
      <FilterChips query={query} pets={pets} onChange={update} />
    </PageContainer>
  );
}
