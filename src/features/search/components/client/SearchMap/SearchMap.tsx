"use client";
import { Box, Typography } from "@mui/material";
import { lazy, Suspense, useSyncExternalStore } from "react";
import { mapCopy } from "../../../lib/mapCopy";
import type { GeoPoint } from "../../../lib/mapGeometry";
import type { ListingSummary } from "../../../api/contracts";
import type { SearchQuery } from "../../../types";
import type { ListingCardCompatibility } from "../ListingCard/ListingCard";
import type { SearchMapOrigin } from "./types";

/** O MapLibre só entra no cliente, quando o mapa aparece: o resto da busca não carrega esse peso. */
const SearchMapView = lazy(() => import("./SearchMapView").then((module) => ({ default: module.SearchMapView })));

export interface SearchMapProps {
  /** Cantinhos da busca; o círculo vem do `approximateLocation` do backend (nunca a casa); a lista continua sendo a fonte, o mapa é complemento. */
  listings: ListingSummary[];
  /** Origem da busca ("Você · Zona 7"). Sem ela, não há marcador nem círculos de distância. */
  origin?: SearchMapOrigin;
  /** Cantinho selecionado (cartão no rodapé do mapa); `null` fecha o cartão. */
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  /** "Buscar quando eu mexer no mapa". */
  searchOnMove: boolean;
  onSearchOnMoveChange: (value: boolean) => void;
  /** Só quando a pessoa mexe no mapa (arrasta, dá zoom) e a opção está ligada; raio em km do recorte visível. */
  onMoveEnd?: (center: GeoPoint, radiusKm: number) => void;
  /** Datas da busca: com período e `petCount`, o pino mostra o total da estadia (como o `ListingCard`). */
  query: SearchQuery;
  petCount: number;
  /** Conta e pets a conferir: o cartão mostra o `CompatibilityChip` do `ListingCard` (mesma consulta, mesmo cache). */
  compatibility?: ListingCardCompatibility;
  /** Cantinhos que combinam, só para o pino ficar verde-lima; quem monta a tela sabe pela consulta de compatibilidade. */
  compatibleIds?: ReadonlySet<string>;
  /** Destino do link do cartão (padrão `/listings/{id}`). */
  hrefFor?: (id: string) => string;
}

/**
 * Mapa da busca na estética Quintal (decisão `2026-10-22-mapa-da-busca`): MapLibre com estilo próprio sobre tiles do
 * OpenFreeMap, pinos de preço focáveis, círculo aproximado de cada cantinho, círculos de distância em volta da origem,
 * cartão do selecionado e a faixa "o pino mostra o bairro, não a casa". Preenche o espaço do contêiner (altura dada pelo
 * consumidor; em tela cheia no celular).
 *
 * @example <SearchMap listings={items} origin={{ ...zona7, label: "Zona 7" }} selectedId={id} onSelect={setId} searchOnMove={on} onSearchOnMoveChange={setOn} />
 */
export function SearchMap(props: SearchMapProps) {
  // Falso no servidor e na hidratação, verdadeiro no cliente: o MapLibre nunca roda no servidor.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const fallback = (
    <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", p: 2 }}>
      <Typography role="status">{mapCopy.loading}</Typography>
    </Box>
  );
  return (
    <Box
      role="region"
      aria-label={mapCopy.region}
      sx={(theme) => ({
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 320,
        overflow: "hidden",
        isolation: "isolate",
        bgcolor: "quintal.cartao",
        border: "2px solid",
        borderColor: "text.primary",
        borderRadius: `${theme.quintal.radius.card}px`,
      })}
    >
      {mounted ? (
        <Suspense fallback={fallback}>
          <SearchMapView {...props} />
        </Suspense>
      ) : (
        fallback
      )}
    </Box>
  );
}
