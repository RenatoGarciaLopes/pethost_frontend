import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { DocumentSlot, type DocumentSlotProps } from "./DocumentSlot";

const photo = (name = "frente.jpg") => new File(["imagem"], name, { type: "image/jpeg" });

let urls = 0;
beforeEach(() => {
  urls = 0;
  URL.createObjectURL = vi.fn(() => `blob:previa-${++urls}`);
  URL.revokeObjectURL = vi.fn();
});

function renderSlot(props: Partial<DocumentSlotProps> = {}) {
  const onPick = vi.fn();
  const view = renderWithProviders(
    <DocumentSlot
      label="Foto da frente do documento"
      hint="O documento inteiro, com a foto aparecendo."
      illustration={<svg data-testid="desenho" />}
      camera="environment"
      file={null}
      onPick={onPick}
      {...props}
    />,
    { theme: quintalTheme },
  );
  return { ...view, onPick };
}

describe("DocumentSlot", () => {
  it("REQ-HVER-018 vaga vazia é um botão com o nome igual ao texto visível, descrito pela dica, com o desenho do que se espera", () => {
    renderSlot();
    const slot = screen.getByRole("button", { name: "Foto da frente do documento Tirar foto" });
    expect(slot).toHaveAccessibleDescription("O documento inteiro, com a foto aparecendo.");
    expect(screen.getByTestId("desenho").closest("[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByText("Tirar foto")).toBeInTheDocument();
  });

  it("REQ-HVER-006 a vaga abre a câmera certa; a galeria também vale", async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
    const { user } = renderSlot();
    const camera = screen.getByLabelText("Foto da frente do documento: câmera");
    const gallery = screen.getByLabelText("Foto da frente do documento: galeria");
    expect(camera).toHaveAttribute("capture", "environment");
    expect(gallery).not.toHaveAttribute("capture");
    expect(camera).toHaveAttribute("accept", "image/*");

    await user.click(screen.getByRole("button", { name: "Foto da frente do documento Tirar foto" }));
    expect(click.mock.contexts.at(-1)).toBe(camera);
    await user.click(screen.getByRole("button", { name: "Escolher da galeria" }));
    expect(click.mock.contexts.at(-1)).toBe(gallery);
  });

  it("REQ-HVER-006 selfie usa a câmera da frente", () => {
    renderSlot({ label: "Selfie segurando o documento", camera: "user" });
    expect(screen.getByLabelText("Selfie segurando o documento: câmera")).toHaveAttribute("capture", "user");
  });

  it("REQ-HVER-006 foto escolhida vai para quem usa, e a vaga mostra a miniatura e 'Tirar de novo'", async () => {
    const { user, onPick, rerender } = renderSlot();
    const file = photo();
    await user.upload(screen.getByLabelText("Foto da frente do documento: galeria"), file);
    expect(onPick).toHaveBeenCalledWith(file);

    rerender(
      <DocumentSlot
        label="Foto da frente do documento"
        hint="O documento inteiro, com a foto aparecendo."
        illustration={<svg />}
        camera="environment"
        file={file}
        onPick={onPick}
      />,
    );
    expect(screen.getByRole("button", { name: "Foto da frente do documento Tirar de novo" })).toBeInTheDocument();
    // A miniatura é decorativa dentro do botão: o nome continua sendo o texto visível.
    expect(document.querySelector("img[alt='']")).toHaveAttribute("src", "blob:previa-1");
    expect(screen.getByText("Tirar de novo")).toBeInTheDocument();
  });

  it("REQ-HVER-009 trocar a foto revoga a miniatura anterior", () => {
    const { rerender } = renderSlot({ file: photo("a.jpg") });
    const props = {
      label: "Foto da frente do documento",
      hint: "Dica",
      illustration: <svg />,
      camera: "environment" as const,
      onPick: vi.fn(),
    };
    rerender(<DocumentSlot {...props} file={photo("b.jpg")} />);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:previa-1");
    rerender(<DocumentSlot {...props} file={null} />);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:previa-2");
  });

  it("REQ-HVER-010 foto já enviada (sem imagem de volta) aparece como enviada", () => {
    renderSlot({ uploaded: true });
    expect(screen.getByRole("button", { name: "Foto da frente do documento Enviada ✓" })).toBeInTheDocument();
    expect(screen.getByText("Enviada ✓")).toBeInTheDocument();
  });

  it("REQ-HVER-008 erro aparece na própria vaga e descreve o botão", () => {
    renderSlot({ error: "Essa foto não deu certo. Tira outra, de dia e sem flash." });
    const slot = screen.getByRole("button", { name: "Foto da frente do documento Tirar foto" });
    expect(screen.getByRole("alert")).toHaveTextContent("Essa foto não deu certo.");
    expect(slot).toHaveAccessibleDescription(
      "O documento inteiro, com a foto aparecendo. Essa foto não deu certo. Tira outra, de dia e sem flash.",
    );
  });

  it("REQ-HVER-007 preparando a foto: botões travados e aviso", () => {
    renderSlot({ busy: true });
    const slot = screen.getByRole("button", { name: "Foto da frente do documento Preparando a foto…" });
    expect(slot).toBeDisabled();
    expect(slot).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Escolher da galeria" })).toBeDisabled();
    expect(screen.getByText("Preparando a foto…")).toBeInTheDocument();
  });

  it("REQ-HVER-006 arquivo escolhido em vaga travada é ignorado", () => {
    const { onPick } = renderSlot({ disabled: true });
    fireEvent.change(screen.getByLabelText("Foto da frente do documento: câmera"), { target: { files: [photo()] } });
    expect(onPick).not.toHaveBeenCalled();
  });
});
