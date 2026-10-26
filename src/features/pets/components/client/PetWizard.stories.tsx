import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { expect, fn, within } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AnnouncerProvider } from "@/shared/ui/feedback/Announcer";
import { petProfileValuesFixture } from "@/test/fixtures/pets";
import { waitForEntrance } from "@/test/waitForEntrance";
import { petDraftKey } from "../../lib/petDraft";
import type { PetSpecies } from "../../types";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { PetWizardScreen } from "../PetWizardScreen";

interface FrameProps {
  role?: PersonalRole;
  step: number;
  species: PetSpecies;
}
/** Providers reais, cache isolado e rascunho sem arquivos/identificadores; não chama API nas stories. */
function Frame({ species, role = "owner" }: FrameProps) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <AnnouncerProvider>
        <main>
          <PetWizardScreen accountId="storybook-pet" initialSpecies={species} role={role} />
        </main>
      </AnnouncerProvider>
    </QueryClientProvider>
  );
}
const meta = {
  title: "Features/Pets/PetWizard",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { step: 1, species: "dog" },
  beforeEach: ({ args }) => {
    // Mock/decorator do framework: appDirectory ainda usa contexto anterior ao Next 16.4.
    useRouter.mockReturnValue({ ...getRouter(), refresh: fn(), bfcacheId: "story" });
    sessionStorage.setItem(
      petDraftKey("storybook-pet"),
      JSON.stringify({
        step: args.step,
        values: {
          ...petProfileValuesFixture,
          species: args.species,
          size: args.species === "dog" ? "small" : undefined,
          speciesDescription: args.species === "exotic" ? "Iguana verde" : undefined,
        },
      }),
    );
  },
  play: async ({ canvasElement, args }) => {
    await within(canvasElement).findByRole("heading", { level: 1 });
    await waitForEntrance({ canvasElement });
    const titles = [
      args.role === "host" ? "Quem mora com você?" : "Que bicho é o seu?",
      "Como seu pet se chama?",
      "Sobre o corpo de Mel",
      "Saúde",
      "Rotina e manias",
      "Com quem Mel se dá bem?",
      "Confere a ficha",
    ];
    await expect(
      await within(canvasElement).findByRole("heading", { level: 1, name: titles[args.step - 1] }),
    ).toBeVisible();
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Bicho: Story = { name: "REQ-PNEW-002 Passo 1: cachorro" };
export const Anfitriao: Story = { name: "REQ-HPETS-004 Quem mora com você", args: { role: "host" } };
export const NomeEFotos: Story = { name: "REQ-PNEW-006/007 Passo 2: nome e fotos", args: { step: 2 } };
export const Corpo: Story = { name: "REQ-PNEW-004/009 Passo 3: corpo", args: { step: 3 } };
export const Saude: Story = { name: "REQ-PNEW-010 Passo 4: saúde", args: { step: 4 } };
export const Rotina: Story = { name: "REQ-PNEW-011 Passo 5: rotina", args: { step: 5 } };
export const Convivencia: Story = { name: "REQ-PNEW-012 Passo 6: convivência", args: { step: 6 } };
export const Revisao: Story = { name: "REQ-PNEW-015 Passo 7: revisão", args: { step: 7 } };
export const Gato: Story = { name: "REQ-PNEW-004 Gato sem porte", args: { step: 3, species: "cat" } };
export const Coelho: Story = { name: "REQ-PNEW-004 Coelho sem porte", args: { step: 3, species: "rabbit" } };
export const Exotico: Story = { name: "REQ-PNEW-003 Exótico", args: { step: 1, species: "exotic" } };
export const Celular: Story = {
  name: "REQ-PNEW-013 Celular",
  args: { step: 2 },
  globals: { viewport: { value: "celular", isRotated: false } },
};
