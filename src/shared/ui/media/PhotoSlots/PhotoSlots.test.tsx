import { fireEvent, screen, within } from "@testing-library/react";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { PhotoSlots } from "./PhotoSlots";

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => "blob:previa");
  URL.revokeObjectURL = vi.fn();
});

const photo = (name = "pipoca.jpg", type = "image/jpeg", size = 1024) =>
  new File([new Uint8Array(size)], name, { type });

function Harness({ errors }: { errors?: (string | null)[] }) {
  const [files, setFiles] = useState<(File | null)[]>([null, null, null]);
  return (
    <PhotoSlots
      label="Fotos de Pipoca"
      files={files}
      errors={errors}
      onPick={(index, file) => setFiles((current) => current.map((item, slot) => (slot === index ? file : item)))}
      onRemove={(index) => setFiles((current) => current.map((item, slot) => (slot === index ? null : item)))}
    />
  );
}

describe("vagas de foto", () => {
  it("REQ-PNEW-007 três vagas, a primeira marcada como capa", () => {
    renderWithProviders(<Harness />, { theme: quintalTheme });
    const group = screen.getByRole("group", { name: "Fotos de Pipoca" });
    expect(within(group).getByLabelText("Adicionar foto 1")).toHaveAttribute("type", "file");
    expect(within(group).getByLabelText("Adicionar foto 3")).toBeInTheDocument();
    expect(within(group).getByText("capa")).toBeInTheDocument();
  });

  it("REQ-PNEW-007 foto válida vira prévia; 'Tirar foto' libera a vaga", async () => {
    const { user } = renderWithProviders(<Harness />, { theme: quintalTheme });
    await user.upload(screen.getByLabelText("Adicionar foto 2"), photo());
    expect(screen.getByRole("img", { name: "Prévia da foto 2" })).toHaveAttribute("src", "blob:previa");

    await user.click(screen.getByRole("button", { name: "Tirar foto 2" }));

    expect(screen.getByLabelText("Adicionar foto 2")).toBeInTheDocument();
  });

  it.each([
    ["tipo", photo("doc.pdf", "application/pdf")],
    ["tamanho", photo("grande.jpg", "image/jpeg", 5 * 1024 * 1024 + 1)],
  ])("REQ-PNEW-007 recusa na própria vaga por %s, sem entregar o arquivo", async (_, file) => {
    const onPick = vi.fn();
    renderWithProviders(<PhotoSlots label="Fotos" files={[null, null, null]} onPick={onPick} onRemove={vi.fn()} />, {
      theme: quintalTheme,
    });
    const input = screen.getByLabelText("Adicionar foto 1");
    // O `accept` do input é só uma sugestão ao navegador: a vaga confere de novo.
    fireEvent.change(input, { target: { files: [file] } });
    expect(onPick).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.");
  });

  it("REQ-PNEW-018 erro vindo de fora aparece na vaga certa", () => {
    renderWithProviders(<Harness errors={[null, "Essa foto já está na ficha.", null]} />, { theme: quintalTheme });
    expect(screen.getByLabelText("Adicionar foto 2")).toHaveAccessibleDescription("Essa foto já está na ficha.");
    expect(screen.getByLabelText("Adicionar foto 1")).not.toHaveAttribute("aria-invalid");
  });

  it("REQ-PEDIT-008 foto já salva (URL) aparece direto, sem object URL", () => {
    vi.mocked(URL.createObjectURL).mockClear();
    renderWithProviders(
      <PhotoSlots
        label="Fotos"
        files={["https://fotos.test/thor-1.jpg", null, null]}
        onPick={vi.fn()}
        onRemove={vi.fn()}
      />,
      { theme: quintalTheme },
    );
    expect(screen.getByRole("img", { name: "Foto 1" })).toHaveAttribute("src", "https://fotos.test/thor-1.jpg");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Tirar foto 1" })).toBeInTheDocument();
    expect(screen.getByLabelText("Adicionar foto 2")).toBeInTheDocument();
  });

  it("REQ-PEDIT-008 sem onReplace, vaga preenchida não oferece troca", () => {
    renderWithProviders(
      <PhotoSlots
        label="Fotos"
        files={["https://fotos.test/thor-1.jpg", null, null]}
        onPick={vi.fn()}
        onRemove={vi.fn()}
      />,
      { theme: quintalTheme },
    );
    expect(screen.queryByLabelText("Trocar foto 1")).not.toBeInTheDocument();
  });

  it("REQ-PEDIT-008 'Trocar foto' entrega o arquivo conferido para a mesma vaga", async () => {
    const onPick = vi.fn();
    const onReplace = vi.fn();
    const { user } = renderWithProviders(
      <PhotoSlots
        label="Fotos"
        files={["https://fotos.test/thor-1.jpg", "https://fotos.test/thor-2.jpg", null]}
        onPick={onPick}
        onReplace={onReplace}
        onRemove={vi.fn()}
      />,
      { theme: quintalTheme },
    );
    const input = screen.getByLabelText("Trocar foto 2");
    expect(input).toHaveAttribute("type", "file");
    expect(screen.queryByLabelText("Trocar foto 3")).not.toBeInTheDocument();

    const file = photo("thor-nova.jpg");
    await user.upload(input, file);

    expect(onReplace).toHaveBeenCalledWith(1, file);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("REQ-PEDIT-010 troca com arquivo inválido é recusada na própria vaga", () => {
    const onReplace = vi.fn();
    renderWithProviders(
      <PhotoSlots
        label="Fotos"
        files={["https://fotos.test/thor-1.jpg", null, null]}
        onPick={vi.fn()}
        onReplace={onReplace}
        onRemove={vi.fn()}
      />,
      { theme: quintalTheme },
    );
    const input = screen.getByLabelText("Trocar foto 1");
    fireEvent.change(input, { target: { files: [photo("doc.pdf", "application/pdf")] } });
    expect(onReplace).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.");
  });

  it("REQ-PEDIT-008 vaga trocando mostra o indicador e trava as outras ações", () => {
    renderWithProviders(
      <PhotoSlots
        label="Fotos"
        files={[photo(), "https://fotos.test/thor-2.jpg", null]}
        uploadingIndex={0}
        onPick={vi.fn()}
        onReplace={vi.fn()}
        onRemove={vi.fn()}
      />,
      { theme: quintalTheme },
    );
    expect(screen.getByRole("progressbar", { name: "Enviando…" })).toBeInTheDocument();
    expect(screen.getByLabelText("Trocar foto 1")).toBeDisabled();
    expect(screen.getByLabelText("Trocar foto 2")).toBeDisabled();
    expect(screen.getByLabelText("Adicionar foto 3")).toBeDisabled();
  });

  it("REQ-PNEW-016 vaga enviando trava as outras e mostra o indicador", () => {
    renderWithProviders(
      <PhotoSlots label="Fotos" files={[photo(), null, null]} uploadingIndex={0} onPick={vi.fn()} onRemove={vi.fn()} />,
      { theme: quintalTheme },
    );
    expect(screen.getByRole("progressbar", { name: "Enviando…" })).toBeInTheDocument();
    expect(screen.getByLabelText("Adicionar foto 2")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tirar foto 1" })).toBeDisabled();
  });
});

describe("vagas de foto com reordenação", () => {
  const saved = (n: number) => `https://fotos.test/casa-${n}.jpg`;

  it("106 r1 troca e remoção ficam no menu sem disputar a linha da foto", async () => {
    const onReplace = vi.fn();
    const onRemove = vi.fn();
    const { user } = renderWithProviders(
      <PhotoSlots
        label="Fotos"
        files={[saved(1), saved(2), null]}
        onPick={vi.fn()}
        onReplace={onReplace}
        onRemove={onRemove}
        onMove={vi.fn()}
      />,
      { theme: quintalTheme },
    );
    expect(screen.queryByRole("button", { name: "Tirar foto 2" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Opções da foto 2" }));
    await user.click(screen.getByRole("menuitem", { name: "Trocar foto 2" }));
    const file = photo("nova.jpg");
    await user.upload(screen.getByLabelText("Trocar foto 2"), file);
    expect(onReplace).toHaveBeenCalledWith(1, file);
    await user.click(screen.getByRole("button", { name: "Opções da foto 2" }));
    await user.click(screen.getByRole("menuitem", { name: "Tirar foto 2" }));
    expect(onRemove).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("REQ-LIST-014 com onMove, cada foto ganha capa e mover por botão (nunca só arrastar)", async () => {
    const onMove = vi.fn();
    const { user } = renderWithProviders(
      <PhotoSlots
        label="Fotos da casa"
        files={[saved(1), saved(2), saved(3), null, null]}
        onPick={vi.fn()}
        onRemove={vi.fn()}
        onMove={onMove}
      />,
      { theme: quintalTheme },
    );
    await user.click(screen.getByRole("button", { name: "Opções da foto 3" }));
    expect(screen.queryByRole("menuitem", { name: "Mover para depois" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Usar como capa" }));
    expect(onMove).toHaveBeenLastCalledWith(2, 0);
    await user.click(screen.getByRole("button", { name: "Opções da foto 1" }));
    expect(screen.queryByRole("menuitem", { name: "Usar como capa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Mover para antes" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Mover para depois" }));
    expect(onMove).toHaveBeenLastCalledWith(0, 1);
  });

  it("REQ-LIST-014 cinco vagas; sem onMove não há reordenação", () => {
    renderWithProviders(
      <PhotoSlots label="Fotos" files={[saved(1), saved(2), null, null, null]} onPick={vi.fn()} onRemove={vi.fn()} />,
      { theme: quintalTheme },
    );
    expect(screen.getByLabelText("Adicionar foto 5")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /como capa|Mover a foto/ })).not.toBeInTheDocument();
  });
  it.each([true, false])("envio ou disabled bloqueia sensores (%s)", (uploading) => {
    renderWithProviders(
      <PhotoSlots
        label="Fotos"
        files={[saved(1), null]}
        uploadingIndex={uploading ? 0 : null}
        disabled={!uploading}
        onPick={vi.fn()}
        onRemove={vi.fn()}
        onMove={vi.fn()}
      />,
      { theme: quintalTheme },
    );
    expect(screen.queryByRole("button", { name: /Arrastar/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Adicionar foto 2")).toBeDisabled();
  });
  it("vagas vazias não são alvos; Escape cancela sem chamar onMove", async () => {
    const onMove = vi.fn();
    const { user } = renderWithProviders(
      <PhotoSlots
        label="Fotos"
        files={[saved(1), saved(2), null]}
        onPick={vi.fn()}
        onRemove={vi.fn()}
        onMove={onMove}
      />,
      { theme: quintalTheme },
    );
    expect(screen.getAllByRole("button", { name: /Arrastar foto/ })).toHaveLength(2);
    screen.getByRole("button", { name: "Arrastar foto 2" }).focus();
    await user.keyboard("[Space][Escape]");
    expect(onMove).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Arraste cancelado");
  });
});
