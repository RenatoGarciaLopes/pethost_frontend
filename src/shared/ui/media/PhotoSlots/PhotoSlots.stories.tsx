import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, fn, userEvent, within, waitFor } from "storybook/test";
import { useState } from "react";

import { PhotoSlots } from "./PhotoSlots";

const meta = {
  title: "Quintal/Media/PhotoSlots",
  component: PhotoSlots,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: { label: "Fotos de Pipoca", files: [null, null, null], onPick: fn(), onRemove: fn() },
} satisfies Meta<typeof PhotoSlots>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Três vagas livres; a primeira é a capa. */
export const Vazias: Story = { name: "REQ-PNEW-007 Vagas livres" };

/** Erro vindo de fora numa vaga (foto repetida). */
export const ComErro: Story = {
  name: "REQ-PNEW-007 Foto repetida",
  args: { errors: [null, "Essa foto já está na ficha.", null] },
};

/** Foto de exemplo em memória (sem rede): um quadrado de cor. */
const savedPhoto = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${color}"/></svg>`,
  )}`;

/** Fotos já salvas na ficha, com a troca oferecida em cada vaga preenchida. */
export const FotosSalvas: Story = {
  name: "REQ-PEDIT-008 Fotos salvas",
  args: { label: "Fotos de Thor", files: [savedPhoto("#F2C14E"), savedPhoto("#7FB77E"), null], onReplace: fn() },
};

/** Trocando a capa: indicador na vaga e as outras ações travadas. */
export const Trocando: Story = {
  name: "REQ-PEDIT-008 Trocando",
  args: {
    label: "Fotos de Thor",
    files: [savedPhoto("#F2C14E"), savedPhoto("#7FB77E"), null],
    uploadingIndex: 0,
    onReplace: fn(),
  },
};

/** Grade real: teclado cancela/confirma e ponteiro só entrega a ordem ao soltar. */
export const Reordenar: Story = {
  args: {
    label: "Fotos da casa",
    files: [savedPhoto("#F2C14E"), savedPhoto("#7FB77E"), savedPhoto("#A6DCEF"), null, null],
    onReplace: fn(),
    onMove: fn(),
  },
  render: function ReorderStory(args) {
    const [files, setFiles] = useState(args.files);
    return (
      <PhotoSlots
        {...args}
        files={files}
        onMove={(from, to) => {
          args.onMove?.(from, to);
          setFiles((current) => {
            const next = [...current];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
          });
        }}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const third = canvas.getByRole("button", { name: "Arrastar foto 3" });
    third.focus();
    await userEvent.keyboard("[Space][ArrowLeft][Escape]");
    await expect(args.onMove).not.toHaveBeenCalled();
    third.focus();
    await userEvent.keyboard("[Space][ArrowLeft][ArrowLeft][Space]");
    await waitFor(() => expect(args.onMove).toHaveBeenCalledWith(2, 0));
    await new Promise((resolve) => setTimeout(resolve, 400));
    const first = canvas.getByRole("button", { name: "Arrastar foto 1, capa" });
    const target = canvas.getByRole("button", { name: "Arrastar foto 3" });
    const a = first.getBoundingClientRect();
    const b = target.getBoundingClientRect();

    fireEvent.mouseDown(first, { button: 0, clientX: a.x + 30, clientY: a.y + 30 });
    fireEvent.mouseMove(document, { clientX: a.x + 42, clientY: a.y + 30 });
    await new Promise((resolve) => setTimeout(resolve, 40));
    fireEvent.mouseMove(document, { clientX: b.x + 30, clientY: b.y + 30 });
    await new Promise((resolve) => setTimeout(resolve, 40));
    await expect(args.onMove).toHaveBeenCalledTimes(1);
    fireEvent.mouseUp(document);
    await waitFor(() => expect(args.onMove).toHaveBeenLastCalledWith(0, 2));
  },
};

/** Consumidor não otimista: mantém destino enquanto salva e restaura em erro. */
export const FalhaAoSalvar: Story = {
  args: Reordenar.args,
  render: function SavingFailure(args) {
    const [busy, setBusy] = useState<number | null>(null);
    const [errors, setErrors] = useState<(string | null)[]>([]);
    return (
      <PhotoSlots
        {...args}
        uploadingIndex={busy}
        errors={errors}
        onReplace={(index) => {
          setBusy(index);
          setTimeout(() => setBusy(null), 300);
        }}
        onMove={(from, to) => {
          args.onMove?.(from, to);
          setBusy(to);
          setTimeout(() => {
            setBusy(null);
            setErrors(["Não foi possível salvar a ordem. Tente de novo."]);
          }, 700);
        }}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("button", { name: "Arrastar foto 3" }).focus();
    await userEvent.keyboard("[Space][ArrowLeft][ArrowLeft][Space]");
    await waitFor(() => expect(canvas.getByRole("img", { name: "Foto 1" })).toHaveAttribute("src", args.files[2]));
    await expect(canvas.queryByRole("button", { name: /Arrastar foto/ })).not.toBeInTheDocument();
    await waitFor(() => expect(canvas.getByRole("alert")).toHaveTextContent("Não foi possível salvar a ordem"));
    await expect(canvas.getByRole("img", { name: "Foto 1" })).toHaveAttribute("src", args.files[0]);
    await expect(args.onMove).toHaveBeenCalledTimes(1);
    await expect(args.onMove).toHaveBeenCalledWith(2, 0);
    await userEvent.upload(
      canvas.getByLabelText("Trocar foto 2"),
      new File(["photo"], "nova.jpg", { type: "image/jpeg" }),
    );
    await expect(canvas.getByRole("img", { name: "Foto 1" })).toHaveAttribute("src", args.files[0]);
    await waitFor(() => expect(canvas.getByRole("button", { name: "Arrastar foto 1, capa" })).toBeInTheDocument());
  },
};
