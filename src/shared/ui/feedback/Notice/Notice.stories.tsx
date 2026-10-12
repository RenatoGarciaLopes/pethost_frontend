import { Button, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Notice } from "./Notice";

const meta = {
  title: "Quintal/Feedback/Notice",
  component: Notice,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta" } },
  args: { tone: "info", title: "Se existir uma conta com esse e-mail, o link chega em instantes." },
} satisfies Meta<typeof Notice>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Informação neutra (`role="status"`). */
export const Info: Story = { name: "REQ-DS-013 Info" };

/** Algo deu certo. */
export const Ok: Story = {
  name: "REQ-DS-013 Ok",
  args: { tone: "ok", title: "Senha trocada. Agora é só entrar." },
};

/** Atenção, com ação: borda tracejada, nunca vermelho. */
export const Atencao: Story = {
  name: "REQ-DS-013 Atenção com ação",
  args: {
    tone: "atencao",
    title: "Essa conta está pausada. Quer reativar? É só confirmar a senha.",
    action: <Button variant="contained">Reativar conta</Button>,
  },
};

/** Erro real: `role="alert"`, foco programático no login. */
export const Erro: Story = {
  name: "REQ-DS-013 Erro",
  args: {
    tone: "erro",
    title: "E-mail ou senha não batem com essa conta.",
    children: "Confere se você é tutor ou anfitrião aqui em cima.",
  },
};

/** Os quatro tons lado a lado. */
export const Tons: Story = {
  name: "REQ-DS-013 Todos os tons",
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 480 }}>
      <Notice tone="info" title="Informação" />
      <Notice tone="ok" title="Deu certo" />
      <Notice tone="atencao" title="Atenção" />
      <Notice tone="erro" title="Erro" />
    </Stack>
  ),
};
