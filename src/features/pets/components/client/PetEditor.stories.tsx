import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { expect, fn, within, waitFor, userEvent } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { petDto } from "@/test/fixtures/pets";
import { waitForEntrance } from "@/test/waitForEntrance";
import { petDtoSchema } from "../../api/contracts";
import { petQueries } from "../../api/queries";
import { toPetDetail } from "../../api/toPetDetail";
import { PetEditor } from "./PetEditor";

const ACCOUNT = "storybook-pet";
const PET_ID = petDto().id;

/** Foto de exemplo em memória (sem rede): um quadrado de cor. */
const storyPhoto = (index: number, color: string) => ({
  id: `0199d2a0-0000-7000-8000-0000000000f${index}`,
  url: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${color}"/></svg>`,
  )}`,
});

const threePhotos = [storyPhoto(1, "#F2C14E"), storyPhoto(2, "#7FB77E"), storyPhoto(3, "#8EC5E8")];

interface FrameProps {
  overrides: Record<string, unknown>;
  section: string;
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
      <main>
        <PetEditor accountId={ACCOUNT} petId={PET_ID} />
      </main>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Pets/PetEditor",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Pet" } },
  args: { overrides: { photos: threePhotos }, section: "fotos" },
  beforeEach: ({ args }) => {
    const url = new URL(window.location.href);
    url.searchParams.set("secao", args.section);
    window.history.replaceState(window.history.state, "", url);
    // Mock/decorator do framework: appDirectory ainda usa contexto anterior ao Next 16.4.
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), refresh: fn(), bfcacheId: "story" });
  },
  play: async ({ canvasElement }) => {
    await waitForEntrance({ canvasElement });
    await waitFor(() => expect(within(canvasElement).getByRole("heading", { level: 1 })).toBeVisible());
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Três fotos salvas (todas as vagas cheias) e as seis seções. */
export const Padrao: Story = { name: "REQ-PEDIT-004/008 Três fotos" };

/** Sem foto: três vagas livres. */
export const SemFoto: Story = { name: "REQ-PEDIT-008 Sem foto", args: { overrides: { photos: [] } } };

/** Exótico: a seção do bicho pede a descrição, sem porte. */
export const Exotico: Story = {
  name: "REQ-PEDIT-007 Exótico",
  args: {
    section: "bicho",
    overrides: { species: "exotic", speciesDescription: "Iguana verde", size: null, photos: threePhotos },
  },
};

/** Celular (390 px): a carteirinha vem antes das seções. */
export const Celular: Story = {
  name: "REQ-PEDIT-004 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
  args: { section: "saude" },
};

export const Saude: Story = { args: { section: "saude" } };
export const Bicho: Story = { args: { section: "bicho" } };
export const ConvivenciaNoCelular: Story = {
  args: { section: "convivencia" },
  globals: { viewport: { value: "celular", isRotated: false } },
  play: async ({ canvasElement }) => {
    await waitForEntrance({ canvasElement });
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

export const TrocaComAlteracao: Story = {
  args: { section: "saude" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await waitForEntrance({ canvasElement });
    const field = canvas.getByLabelText("Veterinário (nome e telefone)");
    await userEvent.type(field, "Rascunho");
    await userEvent.click(canvas.getByRole("button", { name: /^Nome e sexo/ }));
    const dialog = await body.findByRole("dialog", { name: "Salvar Saúde antes de ir?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Ficar" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(field).toHaveValue("Rascunho");
    await userEvent.click(canvas.getByRole("button", { name: /^Nome e sexo/ }));
    await userEvent.click(body.getByRole("button", { name: "Descartar" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitForEntrance({ canvasElement });
    await expect(canvas.getByRole("heading", { level: 1, name: "Nome e sexo" })).toHaveFocus();
  },
};
