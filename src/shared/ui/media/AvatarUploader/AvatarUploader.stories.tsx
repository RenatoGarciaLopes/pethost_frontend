import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, screen, waitFor, within } from "storybook/test";
import { AvatarUploader, type AvatarUploaderProps } from "./AvatarUploader";
import { avatarUploaderCopy } from "./avatarUploaderCopy";

// PNG de um pixel, exclusivamente sintético; sem dependência de imagem remota.
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMZ8AAAAASUVORK5CYII=";
const photoUrl = `data:image/png;base64,${PNG}`;
function sampleFile() {
  return new File([Uint8Array.from(atob(PNG), (value) => value.charCodeAt(0))], "foto.png", { type: "image/png" });
}
function PendingUpload(props: AvatarUploaderProps) {
  const [busy, setBusy] = useState(false);
  return (
    <AvatarUploader
      {...props}
      busy={busy}
      onUpload={(file) => {
        props.onUpload(file);
        setBusy(true);
      }}
    />
  );
}

const meta = {
  title: "Quintal/Media/AvatarUploader",
  component: AvatarUploader,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta" } },
  args: { name: "Camila Souza", avatarUrl: null, busy: false, onUpload: fn(), onRemove: fn() },
} satisfies Meta<typeof AvatarUploader>;

// O formato CSF do Storybook exige o meta como export default.
export default meta;
type Story = StoryObj<typeof meta>;

/** REQ-ACC-014: sem foto, iniciais em texto e input nativo rotulado. */
export const SemFoto: Story = {
  name: "REQ-ACC-014 Sem foto",
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: /Foto do perfil sem imagem/ })).toHaveTextContent("CS");
    await expect(canvas.getByLabelText("Trocar foto")).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  },
};
/** REQ-ACC-014: foto atual com alt, sem requisição externa. */
export const ComFoto: Story = {
  name: "REQ-ACC-014 Com foto",
  args: { avatarUrl: photoUrl },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Sua foto do perfil" })).toHaveAttribute("src", photoUrl);
  },
};
/** REQ-ACC-015: arquivo escolhido ainda não foi enviado. */
export const Previa: Story = {
  name: "REQ-ACC-015 Prévia",
  play: async ({ canvas, userEvent }) => {
    await userEvent.upload(canvas.getByLabelText("Trocar foto"), sampleFile());
    await expect(await canvas.findByRole("img", { name: "Prévia da sua foto" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Usar esta foto" })).toBeEnabled();
  },
};
/** REQ-ACC-015: caller muda busy após confirmar o arquivo, preservando a prévia. */
export const Enviando: Story = {
  name: "REQ-ACC-015 Enviando",
  render: (args) => <PendingUpload {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.upload(canvas.getByLabelText("Trocar foto"), sampleFile());
    await userEvent.click(canvas.getByRole("button", { name: "Usar esta foto" }));
    await expect(canvas.getByRole("progressbar", { name: "Atualizando sua foto" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Usar esta foto" })).toBeDisabled();
  },
};
/** REQ-ACC-017: mensagem traduzida pelo caller associada ao input. */
export const Erro: Story = {
  name: "REQ-ACC-017 Erro",
  args: { error: avatarUploaderCopy.invalid },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Trocar foto")).toHaveAccessibleDescription(avatarUploaderCopy.invalid);
  },
};
/** REQ-ACC-016: confirmação em portal MUI, incluída na análise de acessibilidade. */
export const Confirmacao: Story = {
  name: "REQ-ACC-016 Confirmação",
  args: { avatarUrl: photoUrl },
  parameters: { a11y: { context: "body" } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Tirar foto" }));
    const dialog = await screen.findByRole("dialog", { name: "Tirar sua foto do perfil?" });
    await waitFor(async () => {
      await expect(within(dialog).getByRole("button", { name: "Tirar" })).toBeVisible();
    });
    await expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeVisible();
  },
};
