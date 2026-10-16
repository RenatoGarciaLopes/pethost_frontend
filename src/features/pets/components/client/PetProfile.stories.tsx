import { PageContainer } from "@/shared/ui/layout/PageContainer";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { expect, fn, within } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { FlashMessageProvider } from "@/shared/hooks/useFlashMessage";
import { petDto } from "@/test/fixtures/pets";
import { petDtoSchema } from "../../api/contracts";
import { petQueries } from "../../api/queries";
import { toPetDetail } from "../../api/toPetDetail";
import { PetProfile } from "./PetProfile";

const ACCOUNT = "storybook-pet";
const PET_ID = petDto().id;

/** Foto de exemplo em memória (sem rede): um quadrado de cor. */
const storyPhoto = (id: string, color: string) => ({
  id,
  url: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${color}"/></svg>`,
  )}`,
});

/** Ficha com saúde, rotina e convivência preenchidas. */
const fullPet = {
  medicationNotes: "Vermífugo a cada 3 meses",
  allergies: "Frango",
  vetContact: "Dra. Ana 11 99999-0000",
  feedingNotes: "Ração 2× ao dia, 150 g",
  notes: "Adora bolinha e tem medo de trovão",
  photos: [storyPhoto("0199d2a0-0000-7000-8000-0000000000f1", "#F2C14E")],
};

interface FrameProps {
  overrides: Record<string, unknown>;
}

/** Cache semeado com o pet (staleTime infinito: nenhuma story chama a API) e providers reais. */
function Frame({ overrides }: FrameProps) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(
      petQueries.detail(ACCOUNT, PET_ID).queryKey,
      toPetDetail(petDtoSchema.parse(petDto(overrides))),
    );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <FlashMessageProvider>
        <main><PageContainer width="page">
          <PetProfile accountId={ACCOUNT} petId={PET_ID} />
        </PageContainer></main>
      </FlashMessageProvider>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Pets/PetProfile",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Pet" } },
  args: { overrides: fullPet },
  beforeEach: () => {
    // Mock/decorator do framework: appDirectory ainda usa contexto anterior ao Next 16.4.
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), refresh: fn(), bfcacheId: "story" });
  },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("article", { name: "Carteirinha de Thor" })).toBeVisible();
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Pet na lista, ficha completa, "Editar ficha" e o discreto "Tirar da lista". */
export const Ativo: Story = { name: "REQ-PEDIT-001 Ativo" };

/** Fora da lista: selo neutro e "Voltar pra lista"; a edição continua. */
export const Inativo: Story = {
  name: "REQ-PEDIT-003 Inativo",
  args: { overrides: { ...fullPet, isActive: false, deactivatedAt: "2026-10-14T12:00:00Z" } },
};

/** Sem foto: a carteirinha usa o lugar da capa vazio. */
export const SemFoto: Story = { name: "REQ-PEDIT-001 Sem foto", args: { overrides: { ...fullPet, photos: [] } } };

/** Celular (390 px). */
export const Celular: Story = {
  name: "REQ-PEDIT-001 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
