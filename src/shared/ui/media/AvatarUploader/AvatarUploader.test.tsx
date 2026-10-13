import { screen, waitFor, within } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { AvatarUploader, type AvatarUploaderProps } from "./AvatarUploader";

const invalidPhoto = "Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.";
const photo = (name = "foto.png") => new File(["foto sintética"], name, { type: "image/png" });
const createObjectURL = vi.fn();
const revokeObjectURL = vi.fn();
beforeEach(() => {
  let count = 0;
  createObjectURL.mockReset().mockImplementation(() => `blob:foto-${++count}`);
  revokeObjectURL.mockReset();
  const BrowserURL = URL;
  vi.stubGlobal(
    "URL",
    class extends BrowserURL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    },
  );
});
afterEach(() => vi.unstubAllGlobals());
function setup(overrides: Partial<AvatarUploaderProps> = {}) {
  const props: AvatarUploaderProps = {
    name: "Camila Souza",
    avatarUrl: null,
    busy: false,
    onUpload: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  };
  const rendered = renderWithProviders(<AvatarUploader {...props} />, { theme: quintalTheme });
  return {
    ...rendered,
    props,
    update: (patch: Partial<AvatarUploaderProps>) => rendered.rerender(<AvatarUploader {...props} {...patch} />),
  };
}
const picker = () => screen.getByLabelText("Trocar foto");
it.each([
  ["  Ana Maria Lima  ", "AL"],
  ["Ágata", "Á"],
  ["", "?"],
])("REQ-ACC-014 sem foto apresenta iniciais legíveis para %s", (name, initials) => {
  setup({ name });
  expect(screen.getByRole("img", { name: /Foto do perfil sem imagem/ })).toHaveTextContent(initials!);
  expect(screen.queryByRole("button", { name: "Tirar foto" })).not.toBeInTheDocument();
});
it("REQ-ACC-014 foto atual tem alt e formato redondo", () => {
  setup({ avatarUrl: "https://images.example.test/atual.png" });
  const image = screen.getByRole("img", { name: "Sua foto do perfil" });
  expect(image).toHaveAttribute("src", "https://images.example.test/atual.png");
  expect(getComputedStyle(image.parentElement!).borderRadius).toBe("50%");
});
it("REQ-ACC-014 escolha nativa é alcançável pelo teclado e declara os tipos", async () => {
  const { user } = setup();
  expect(picker()).toHaveAttribute("type", "file");
  expect(picker()).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  await user.tab();
  expect(picker()).toHaveFocus();
});
it.each([
  ["tipo", () => new File(["texto"], "foto.txt", { type: "text/plain" })],
  ["tamanho", () => new File([new Uint8Array(5 * 1024 * 1024 + 1)], "foto.png", { type: "image/png" })],
  ["vazio", () => new File([], "foto.png", { type: "image/png" })],
] as const)("REQ-ACC-014 arquivo inválido por %s não envia nem cria prévia", async (_reason, file) => {
  const { props } = setup();
  await userEvent.setup({ applyAccept: false }).upload(picker(), file());
  expect(screen.getByRole("alert")).toHaveTextContent(invalidPhoto);
  expect(picker()).toHaveAccessibleDescription(invalidPhoto);
  expect(picker()).toHaveAttribute("aria-invalid", "true");
  expect(props.onUpload).not.toHaveBeenCalled();
  expect(createObjectURL).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Usar esta foto" })).not.toBeInTheDocument();
});
it("REQ-ACC-015 arquivo válido fica em prévia até confirmar o envio", async () => {
  const { props, user } = setup();
  const file = photo();
  await user.upload(picker(), file);
  const preview = await screen.findByRole("img", { name: "Prévia da sua foto" });
  expect(preview).toHaveAttribute("src", "blob:foto-1");
  expect(getComputedStyle(preview.parentElement!).borderRadius).toBe("50%");
  expect(props.onUpload).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Usar esta foto" }));
  expect(props.onUpload).toHaveBeenCalledExactlyOnceWith(file);
});
it("REQ-ACC-014/026 troca, cancela e permite escolher o mesmo arquivo novamente", async () => {
  const { user, props } = setup();
  const first = photo();
  const second = photo("outra.png");
  await user.upload(picker(), first);
  await user.upload(picker(), second);
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:foto-1");
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:foto-2");
  expect(screen.queryByRole("img", { name: "Prévia da sua foto" })).not.toBeInTheDocument();
  expect(picker()).toHaveFocus();
  await user.upload(picker(), second);
  expect(createObjectURL).toHaveBeenCalledTimes(3);
  expect(props.onUpload).not.toHaveBeenCalled();
});
it("REQ-ACC-026 desmontar revoga a URL da prévia", async () => {
  const { user, unmount } = setup();
  await user.upload(picker(), photo());
  unmount();
  expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:foto-1");
});
it("REQ-ACC-015 busy mantém prévia, anuncia progresso indeterminado e trava controles", async () => {
  const { user, update, props } = setup({ avatarUrl: "https://images.example.test/atual.png" });
  await user.upload(picker(), photo());
  update({ busy: true });
  expect(screen.getByRole("group", { name: "Foto do perfil" })).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("progressbar", { name: "Atualizando sua foto" })).not.toHaveAttribute("aria-valuenow");
  expect(picker()).toBeDisabled();
  for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  await userEvent
    .setup({ pointerEventsCheck: PointerEventsCheckLevel.Never })
    .click(screen.getByRole("button", { name: "Usar esta foto" }));
  expect(props.onUpload).not.toHaveBeenCalled();
});
it("REQ-ACC-014 disabled preserva apresentação e bloqueia escolha e remoção", async () => {
  const { props } = setup({ avatarUrl: "https://images.example.test/atual.png", disabled: true });
  expect(screen.getByRole("img", { name: "Sua foto do perfil" })).toBeInTheDocument();
  expect(picker()).toBeDisabled();
  const remove = screen.getByRole("button", { name: "Tirar foto" });
  expect(remove).toBeDisabled();
  await userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never }).click(remove);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(props.onRemove).not.toHaveBeenCalled();
});
it("REQ-ACC-017 erro controlado fica associado ao controle e some quando a tela limpa", () => {
  const { update } = setup({ error: invalidPhoto });
  expect(screen.getByRole("alert")).toHaveTextContent(invalidPhoto);
  expect(picker()).toHaveAccessibleDescription(invalidPhoto);
  update({ error: null });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(picker()).not.toHaveAttribute("aria-describedby");
});
it("REQ-ACC-016 cancelar ou escapar da confirmação mantém a foto e devolve foco", async () => {
  const { user, props } = setup({ avatarUrl: "https://images.example.test/atual.png" });
  const remove = screen.getByRole("button", { name: "Tirar foto" });
  await user.click(remove);
  const dialog = await screen.findByRole("dialog", { name: "Tirar sua foto do perfil?" });
  await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(remove).toHaveFocus();
  await user.click(remove);
  await screen.findByRole("dialog");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(props.onRemove).not.toHaveBeenCalled();
});
it("REQ-ACC-016 confirmação chama remoção uma vez, sem window.confirm", async () => {
  const browserConfirm = vi.spyOn(window, "confirm");
  const { user, props } = setup({ avatarUrl: "https://images.example.test/atual.png" });
  await user.click(screen.getByRole("button", { name: "Tirar foto" }));
  const dialog = await screen.findByRole("dialog", { name: "Tirar sua foto do perfil?" });
  await user.click(within(dialog).getByRole("button", { name: "Tirar" }));
  expect(props.onRemove).toHaveBeenCalledOnce();
  expect(browserConfirm).not.toHaveBeenCalled();
});
it("REQ-ACC-015/016 busy durante confirmação impede remover e fechar", async () => {
  const { user, props, update } = setup({ avatarUrl: "https://images.example.test/atual.png" });
  await user.click(screen.getByRole("button", { name: "Tirar foto" }));
  const dialog = await screen.findByRole("dialog");
  update({ busy: true });
  for (const button of within(dialog).getAllByRole("button")) expect(button).toBeDisabled();
  await user.keyboard("{Escape}");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(props.onRemove).not.toHaveBeenCalled();
});
it("REQ-ACC-015/017 falha preserva arquivo para tentar de novo e avatarUrl novo encerra prévia", async () => {
  const { user, update } = setup();
  await user.upload(picker(), photo());
  update({ busy: true });
  update({ busy: false, error: invalidPhoto });
  expect(screen.getByRole("img", { name: "Prévia da sua foto" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Usar esta foto" })).toBeEnabled();
  update({ avatarUrl: "https://images.example.test/nova.png", error: null });
  expect(screen.getByRole("img", { name: "Sua foto do perfil" })).toHaveAttribute(
    "src",
    "https://images.example.test/nova.png",
  );
  expect(screen.queryByRole("button", { name: "Usar esta foto" })).not.toBeInTheDocument();
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:foto-1");
});
