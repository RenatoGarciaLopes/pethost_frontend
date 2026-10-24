import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { MAX_MESSAGE_LENGTH } from "../../../lib/constants";
import { conversationsCopy } from "../../../lib/conversationsCopy";
import { MessageComposer } from "./MessageComposer";

const copy = conversationsCopy.composer;

function setup(isSending = false) {
  const onSend = vi.fn();
  const view = renderWithProviders(
    <MessageComposer recipientName="Dona Cida" onSend={onSend} isSending={isSending} />,
    {
      theme: quintalTheme,
    },
  );
  const field = screen.getByRole("textbox", { name: copy.label("Dona Cida") });
  const fileInput = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
  return { ...view, onSend, field, fileInput };
}

const image = (name: string, type: string, bytes = 10) => new File([new Uint8Array(bytes)], name, { type });

describe("MessageComposer", () => {
  it("REQ-CHAT-008 o campo tem rótulo com o nome de quem recebe e o texto de apoio", () => {
    const { field } = setup();
    expect(field).toHaveAttribute("placeholder", "Escreve pra Dona Cida…");
  });

  it("REQ-CHAT-008 envia o texto sem os espaços das pontas e limpa o campo", async () => {
    const { user, field, onSend } = setup();
    await user.type(field, "  Já jantou?  ");
    await user.click(screen.getByRole("button", { name: copy.send }));
    expect(onSend).toHaveBeenCalledWith({ body: "Já jantou?", photo: null });
    expect(field).toHaveValue("");
  });

  it("REQ-CHAT-008 Enter envia e Shift+Enter quebra a linha", async () => {
    const { user, field, onSend } = setup();
    await user.type(field, "Oi{Shift>}{Enter}{/Shift}tudo bem?");
    expect(field).toHaveValue("Oi\ntudo bem?");
    await user.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledWith({ body: "Oi\ntudo bem?", photo: null });
  });

  it("REQ-CHAT-008 só espaços não sai, nem pelo botão nem pelo Enter", async () => {
    const { user, field, onSend } = setup();
    await user.type(field, "   ");
    await user.click(screen.getByRole("button", { name: copy.send }));
    await user.keyboard("{Enter}");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("REQ-CHAT-008 passou de 2.000 caracteres: avisa e não envia", () => {
    const { field } = setup();
    fireEvent.change(field, { target: { value: "a".repeat(MAX_MESSAGE_LENGTH + 1) } });
    expect(screen.getByRole("alert")).toHaveTextContent(copy.tooLong("2.000"));
    expect(field).toHaveAttribute("aria-invalid", "true");
  });

  it("REQ-CHAT-008 passou de 2.000 caracteres: o envio não sai", async () => {
    const { user, field, onSend } = setup();
    fireEvent.change(field, { target: { value: "a".repeat(MAX_MESSAGE_LENGTH + 1) } });
    await user.click(screen.getByRole("button", { name: copy.send }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it("REQ-CHAT-009 foto válida vai com a legenda; dá pra tirar antes de enviar", async () => {
    const { user, field, fileInput, onSend } = setup();
    const photo = image("pipoca.jpg", "image/jpeg");
    await user.upload(fileInput, photo);
    expect(screen.getByText("pipoca.jpg")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.removePhoto }));
    expect(screen.queryByText("pipoca.jpg")).not.toBeInTheDocument();

    await user.upload(fileInput, photo);
    await user.type(field, "Olha ela!");
    await user.click(screen.getByRole("button", { name: copy.send }));
    expect(onSend).toHaveBeenCalledWith({ body: "Olha ela!", photo });
  });

  it("REQ-CHAT-009 foto sem legenda também sai", async () => {
    const { user, fileInput, onSend } = setup();
    const photo = image("pipoca.png", "image/png");
    await user.upload(fileInput, photo);
    await user.click(screen.getByRole("button", { name: copy.send }));
    expect(onSend).toHaveBeenCalledWith({ body: "", photo });
  });

  it("REQ-CHAT-009 GIF ou foto acima de 5 MB não entram, com o motivo", () => {
    const { fileInput } = setup();
    fireEvent.change(fileInput, { target: { files: [image("pipoca.gif", "image/gif")] } });
    expect(screen.getByRole("alert")).toHaveTextContent(copy.photoType);

    fireEvent.change(fileInput, { target: { files: [image("grande.jpg", "image/jpeg", 5 * 1024 * 1024 + 1)] } });
    expect(screen.getByRole("alert")).toHaveTextContent(copy.photoSize);
    expect(screen.queryByText("grande.jpg")).not.toBeInTheDocument();
  });

  it("REQ-CHAT-008 enviando: o botão espera e avisa", () => {
    setup(true);
    expect(screen.getByRole("button", { name: copy.sending })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.photo })).toBeDisabled();
  });
});
