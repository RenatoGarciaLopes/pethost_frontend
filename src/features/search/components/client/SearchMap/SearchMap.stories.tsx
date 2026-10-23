import { Box, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { searchQueryFixture } from "@/test/fixtures/search";
import { searchQueries } from "../../../api/queries";
import { searchMapListingFixture, searchMapListingsFixture, searchMapOrigin } from "@/test/fixtures/searchMap";
import { SearchMap, type SearchMapProps } from "./SearchMap";

const [cida, antonio] = searchMapListingsFixture;
const PET = { id: "0199d2a0-0000-7000-8000-0000000000e1", name: "Pipoca" };
const ACCOUNT = "owner-1";
const STAY = { checkIn: "2026-12-20", checkOut: "2026-12-25" };
const query = searchQueryFixture({ from: STAY.checkIn, to: STAY.checkOut });
const compatibleIds = new Set([cida.id, antonio.id]);

/** Compatibilidade já no cache (como nas stories do ListingCard), para a story não depender da API. */
function seededClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  for (const listing of searchMapListingsFixture) {
    client.setQueryData(searchQueries.compatibility(ACCOUNT, listing.id, PET.id, STAY).queryKey, {
      listingId: listing.id,
      petId: PET.id,
      petName: PET.name,
      matches: compatibleIds.has(listing.id),
      warnings: compatibleIds.has(listing.id) ? [] : [{ code: "home_has_cats" }],
    });
  }
  return client;
}

/** Estado do consumidor (a tela da busca decide quando o mapa aparece); o componente em si é controlado. */
function Frame(props: Partial<SearchMapProps> & { height?: number | string }) {
  const { height = 560, ...rest } = props;
  const [selectedId, setSelectedId] = useState<string | null>(rest.selectedId ?? null);
  const [searchOnMove, setSearchOnMove] = useState(rest.searchOnMove ?? true);
  const [client] = useState(seededClient);
  return (
    <Box sx={{ height, width: "100%" }}>
      <QueryClientProvider client={client}>
        <SearchMap
          listings={searchMapListingsFixture}
          origin={searchMapOrigin}
          query={query}
          petCount={1}
          compatibility={{ accountId: ACCOUNT, pets: [PET] }}
          compatibleIds={compatibleIds}
          {...rest}
          selectedId={selectedId}
          onSelect={setSelectedId}
          searchOnMove={searchOnMove}
          onSearchOnMoveChange={setSearchOnMove}
        />
      </QueryClientProvider>
    </Box>
  );
}

const meta = {
  title: "Search/SearchMap",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Busca-Mapa" } },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Vários cantinhos com origem, círculos de distância e as faixas do board. */
export const Varios: Story = {
  name: "REQ-SRCH-013 Vários cantinhos",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // O MapLibre carrega sob demanda (import dinâmico): na primeira vez, o pino demora mais que 1 s.
    const pin = await canvas.findByRole("button", { name: /Casa da Dona Cida, R\$\s300/ }, { timeout: 10_000 });
    await expect(pin).toBeVisible();
    await expect(canvas.getByText(/O pino mostra o bairro, não a casa/)).toBeVisible();
  },
};

/** Sem cantinhos: só o mapa, a origem e a faixa de privacidade. */
export const Vazio: Story = { name: "REQ-SRCH-013 Vazio", args: { listings: [] } };

/** Um cantinho só. */
export const UmCantinho: Story = { name: "REQ-SRCH-013 Um cantinho", args: { listings: [cida] } };

/** Cantinho selecionado: pino escuro e cartão no rodapé do mapa. */
export const Selecionado: Story = {
  name: "REQ-SRCH-013 Selecionado",
  args: { selectedId: cida.id },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("link", { name: "Casa da Dona Cida" })).toBeVisible();
    await expect(canvas.getByText("✓ Combina com a Pipoca")).toBeVisible();
  },
};

/** Sem pet escolhido: nada combina, preço é a diária e não há chip. */
export const SemCompatibilidade: Story = {
  name: "REQ-SRCH-013 Sem compatibilidade",
  args: {
    compatibleIds: new Set<string>(),
    compatibility: undefined,
    query: searchQueryFixture(),
    petCount: 0,
    selectedId: antonio.id,
  },
};

/** Sem origem: sem marcador nem círculos de distância. */
export const SemOrigem: Story = { name: "REQ-SRCH-013 Sem origem", args: { origin: undefined } };

/** Cantinho sem foto nem nota. */
export const SemFotoNemNota: Story = {
  name: "REQ-SRCH-013 Sem foto nem nota",
  args: {
    listings: [searchMapListingFixture({ rating: null, coverPhotoUrl: null, distanceKm: null })],
    selectedId: cida.id,
  },
};

/** Celular (390 px): o mapa ocupa a tela toda; a 079 decide o botão "Ver mapa". */
export const Celular: Story = {
  name: "REQ-SRCH-013 Celular (390 px)",
  globals: { viewport: { value: "celular", isRotated: false } },
  args: { height: "calc(100dvh - 32px)", selectedId: cida.id },
};

/** Com `prefers-reduced-motion`, a seleção e o zoom não animam (sem voo). */
export const MovimentoReduzido: Story = {
  name: "REQ-SRCH-013 Movimento reduzido",
  args: { selectedId: cida.id },
  beforeEach: () => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes("reduce"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList;
    return () => {
      window.matchMedia = original;
    };
  },
};

/** Demo de layout (a composição real é da tela de resultados, tarefa 079): lista de um lado, mapa do outro. */
export const ListaEMapa: Story = {
  name: "REQ-SRCH-013 Demo lista + mapa",
  parameters: { layout: "fullscreen" },
  render: () => (
    <Box
      sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 2, p: 2 }}
    >
      <Box>
        <Typography component="h2" variant="h5" sx={{ mb: 1 }}>
          5 casas com vaga perto da Zona 7
        </Typography>
        <Typography>A lista continua sendo a fonte; o mapa é complemento.</Typography>
      </Box>
      <Frame height={640} />
    </Box>
  ),
};
