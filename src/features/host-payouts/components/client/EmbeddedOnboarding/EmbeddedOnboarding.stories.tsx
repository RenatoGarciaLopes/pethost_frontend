import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { Notice } from "@/shared/ui/feedback/Notice";
import { ApiError } from "@/shared/api/errors/ApiError";
import { translateError } from "@/shared/api/errors/translateError";
import type { OnboardingSessionDto } from "../../../api/contracts";
import { EmbeddedOnboarding } from "./EmbeddedOnboarding";
const pendingSession = () =>
  new Promise<OnboardingSessionDto>(() => {
    /* API em espera; nenhum SDK externo é carregado na story. */
  });
const refusedSession = async (): Promise<OnboardingSessionDto> => {
  throw new ApiError({ code: "HOST_STRIPE_UNAVAILABLE", status: 503, message: "synthetic" });
};
function Frame({ failure = false }: { failure?: boolean }) {
  const [error, setError] = useState<unknown>(null);
  return error ? (
    <Notice tone="atencao" title={translateError(error)} />
  ) : (
    <EmbeddedOnboarding
      createSession={failure ? refusedSession : pendingSession}
      onExit={fn()}
      onRequestError={setError}
      onUnavailable={fn()}
    />
  );
}
const meta = {
  title: "Features/HostPayouts/EmbeddedOnboarding",
  component: Frame,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Verificacao", section: "Cadastro de recebimento" } },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Carregando: Story = {};
export const ApiIndisponivel: Story = { args: { failure: true } };
