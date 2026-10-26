import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { expect, fn } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { waitForEntrance } from "@/test/waitForEntrance";
import { listingDraftKey } from "../../lib/listingDraft";
import type { ListingStepId } from "../../lib/listingSteps";
import { emptyListingValues, type ListingFormValues } from "../../schemas/listingSchema";
import type { HostListingProfile } from "../../types";
import { ListingDraft } from "./ListingDraft";

const ACCOUNT = "storybook-host";
const profile: HostListingProfile = {
  kind: "person",
  firstName: "Aparecida",
  address: null,
  payoutsEnabled: true,
  stripeStatus: "enabled",
};
/** Passos respondidos, menos o endereço (sem CEP: nenhuma busca de rede na story). */
const answered: ListingFormValues = {
  ...emptyListingValues,
  homeType: "house",
  hasYard: true,
  title: "Casa da Aparecida",
  description: "Casa térrea com quintal gramado.",
  hasDogs: true,
  hasCats: false,
  hasKids: false,
  acceptedSpecies: ["dog", "rabbit"],
  acceptsSmall: true,
  capacity: 3,
  availableWeekdays: ["monday", "friday", "saturday"],
  nightlyRate: "60,00",
};

interface FrameProps {
  kind: HostListingProfile["kind"];
  draft: { values: ListingFormValues; step?: ListingStepId } | null;
}

function Frame({ kind }: FrameProps) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <main>
        <ListingDraft accountId={ACCOUNT} profile={{ ...profile, kind }} />
      </main>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/HostListings/ListingDraft",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Cantinho" } },
  args: { kind: "person", draft: null },
  play: waitForEntrance,
  beforeEach: ({ args }) => {
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), refresh: fn(), bfcacheId: "story" });
    sessionStorage.removeItem(listingDraftKey(ACCOUNT));
    if (args.draft) sessionStorage.setItem(listingDraftKey(ACCOUNT), JSON.stringify(args.draft));
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Rascunho novo: passo 1 de 9, "Sua casa", com o card ao vivo ao lado no computador. */
export const Novo: Story = {
  name: "104 Passo 1 · Sua casa",
  play: async (context) => {
    await waitForEntrance(context);
    const { canvas, userEvent } = context;
    await userEvent.click(await canvas.findByRole("button", { name: "Continuar: nome" }));
    await expect(await canvas.findByText("Escolhe se é casa ou apartamento.")).toBeVisible();
  },
};

/** Voltou outro dia: abre no passo salvo com "Continuando de onde você parou.". */
export const Restaurado: Story = {
  name: "REQ-LIST-004 Rascunho restaurado no passo salvo",
  args: { draft: { values: answered, step: "guests" } },
};

/** A diária em número grande e a simulação líquida em destaque. */
export const Diaria: Story = {
  name: "REQ-LIST-009 Diária e simulação",
  args: { draft: { values: answered, step: "rate" } },
};

/** Confere e abre: a ficha em blocos com "Editar" e o botão coral (sem CEP, o endereço aparece vazio). */
export const Revisao: Story = {
  name: "104 Confere e abre",
  args: { draft: { values: answered, step: "review" } },
};

/** Empresa: sem tipo da casa e capacidade até 200. */
export const Empresa: Story = {
  name: "REQ-LIST-005 Empresa",
  args: { kind: "company", draft: { values: answered, step: "guests" } },
};

/** Celular (390 px). */
export const Celular: Story = {
  name: "104 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
