import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { fn, userEvent, within } from "storybook/test";
import { waitForEntrance } from "@/test/waitForEntrance";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { RegistrationScreen } from "./RegistrationScreen";

const meta = {
  title: "Registration/RegistrationScreen",
  component: RegistrationScreen,
  parameters: { design: { board: "Fluxo-Conta" } },
  args: { role: "owner", next: null },
  play: waitForEntrance,
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), refresh: fn(), back: fn(), bfcacheId: "registration" });
  },
  decorators: [
    (Story) => {
      const [client] = useState(() => new QueryClient());
      return (
        <QueryClientProvider client={client}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof RegistrationScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Composição também cobre os estados de RegistrationWizard e PersonStep, sem fixtures duplicadas. */
export const Tutor: Story = {};
export const Anfitriao: Story = { args: { role: "host" } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
export const ErrosDoPasso: Story = {
  play: async ({ canvasElement }) => {
    await waitForEntrance({ canvasElement });
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Continuar: endereço" }));
  },
};
