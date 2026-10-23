import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useSearchParams } from "@storybook/nextjs-vite/navigation.mock";
import { ReadonlyURLSearchParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { searchQueries } from "@/features/search/api/queries";
import { listingFixture } from "@/test/fixtures/search";
import { withQueryClient } from "@/test/storybook/withQueryClient";
import { HomeScreen } from "./HomeScreen";

const meta = {
  title: "Home/Início",
  component: HomeScreen,
  tags: ["autodocs"],
  parameters: { design: { board: "Quintal-Visitante / Quintal-Casas" }, layout: "fullscreen" },
  args: { pets: [], petsUnavailable: false },
  decorators: [withQueryClient],
  beforeEach: () => {
    useSearchParams.mockReturnValue(new ReadonlyURLSearchParams());
  },
} satisfies Meta<typeof HomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Entrada sem sessão: a busca roda na própria home, sem login. */
export const Visitante: Story = { name: "REQ-HOME-002 Visitante", args: { viewer: "visitor" } };

/** Tutor que ainda não cadastrou um pet pode escolher espécie. */
export const TutorSemPet: Story = { name: "REQ-HOME-002 Tutor sem pet", args: { viewer: "owner" } };

/** Tutor com pets ativos: o mais recente começa selecionado e personaliza a chamada. */
export const TutorComPets: Story = {
  name: "REQ-HOME-003 Tutor com pets",
  args: {
    viewer: "owner",
    pets: [
      { id: "pet-mel", name: "Mel", species: "dog", size: "small" },
      { id: "pet-nino", name: "Nino", species: "cat", size: null },
    ],
  },
};

/** Anfitrião escolhe a quantidade de pets; a home não consulta a lista da casa. */
export const Anfitriao: Story = { name: "REQ-HOME-004 Anfitrião", args: { viewer: "host" } };

/** Se a consulta da lista falhar, a busca por espécie continua disponível. */
export const PetsIndisponiveis: Story = {
  name: "REQ-HOME-009 Pets indisponíveis",
  args: { viewer: "owner", petsUnavailable: true },
};

/** Em 390 px a busca começa como pílula e abre os campos ao toque. */
export const Celular: Story = {
  name: "REQ-HOME-006 Celular",
  args: { viewer: "visitor" },
  globals: { viewport: { value: "celular", isRotated: false } },
};

const searched = { pets: [], species: [], sizes: [], where: "Maringá" };
/** Com filtros na URL a vitrine dá lugar aos resultados, com título, chips rápidos e cards. */
export const ComBusca: Story = {
  name: "REQ-HOME-011 Com busca na URL",
  args: { viewer: "visitor", initialQuery: searched },
  beforeEach: () => {
    useSearchParams.mockReturnValue(new ReadonlyURLSearchParams("where=Maring%C3%A1"));
  },
  decorators: [
    (Story) => {
      const client = new QueryClient({
        defaultOptions: { queries: { staleTime: Infinity, enabled: false, retry: false } },
      });
      client.setQueryData(searchQueries.infinite("visitor", searched, []).queryKey, {
        pages: [
          {
            items: [
              listingFixture(),
              listingFixture({ id: "0199d2a0-0000-7000-8000-000000000043", title: "Varanda da Bia", badges: [] }),
            ],
            page: 1,
            pageSize: 12,
            totalCount: 2,
          },
        ],
        pageParams: [1],
      });
      return (
        <QueryClientProvider client={client}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
};
