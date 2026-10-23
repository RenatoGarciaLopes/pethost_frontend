import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useSearchParams } from "@storybook/nextjs-vite/navigation.mock";
import { ReadonlyURLSearchParams } from "next/navigation";
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
