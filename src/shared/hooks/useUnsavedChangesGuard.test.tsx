import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

const router = vi.hoisted(() => ({ push: vi.fn() }));
const linkClick = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => router }));

/** Seção de edição fake com links de todo tipo. */
function Section({ dirty }: { dirty: boolean }) {
  const { dialog } = useUnsavedChangesGuard(dirty);
  return (
    <>
      {/* `onClick` faz o papel do `Link` do Next, que navega num handler do React; `<a>` puro de propósito. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/pets/pet-1?aba=fotos" onClick={linkClick}>
        Ver ficha
      </a>
      <a href="https://exemplo.test/ajuda">Ajuda externa</a>
      <a href="/pets" target="_blank">
        Nova aba
      </a>
      <a href="/pets/pet-1/foto.jpg" download>
        Baixar
      </a>
      <a href="#saude">Ir para saúde</a>
      {dialog}
    </>
  );
}

function setup(dirty = true) {
  return renderWithProviders(<Section dirty={dirty} />, { theme: quintalTheme });
}

/** Clique "cru": devolve se o navegador seguiria o link. */
function clickLink(name: string, init: MouseEventInit = {}) {
  return fireEvent.click(screen.getByRole("link", { name }), init);
}

function fireBeforeUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  router.push.mockClear();
  linkClick.mockClear();
});

describe("useUnsavedChangesGuard", () => {
  it("REQ-PEDIT-017 com alteração, link interno pergunta antes de sair", async () => {
    setup();
    expect(clickLink("Ver ficha")).toBe(false);
    const dialog = await screen.findByRole("dialog", { name: "Sair sem salvar?" });
    expect(dialog).toHaveAccessibleDescription("O que você mudou aqui ainda não foi salvo.");
    expect(router.push).not.toHaveBeenCalled();
    expect(linkClick).not.toHaveBeenCalled();
  });

  it("REQ-PEDIT-017 'Sair sem salvar' segue para o destino", async () => {
    const { user } = setup();
    clickLink("Ver ficha");
    await user.click(await screen.findByRole("button", { name: "Sair sem salvar" }));
    expect(router.push).toHaveBeenCalledWith("/pets/pet-1?aba=fotos");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("REQ-PEDIT-017 'Continuar editando' fica na seção", async () => {
    const { user } = setup();
    clickLink("Ver ficha");
    await user.click(await screen.findByRole("button", { name: "Continuar editando" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(router.push).not.toHaveBeenCalled();
  });

  it.each([
    ["externo", "Ajuda externa", {}],
    ["nova aba", "Nova aba", {}],
    ["download", "Baixar", {}],
    ["âncora na mesma página", "Ir para saúde", {}],
    ["com Ctrl", "Ver ficha", { ctrlKey: true }],
    ["com Cmd", "Ver ficha", { metaKey: true }],
    ["com Shift", "Ver ficha", { shiftKey: true }],
    ["botão do meio", "Ver ficha", { button: 1 }],
  ])("REQ-PEDIT-017 link %s não é interceptado", (_, name, init) => {
    setup();
    expect(clickLink(name, init)).toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("REQ-PEDIT-017 sem alteração, nada é interceptado", () => {
    setup(false);
    expect(clickLink("Ver ficha")).toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it("REQ-PEDIT-017 com alteração, fechar a aba ou recarregar pede o aviso nativo", () => {
    setup();
    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it("REQ-PEDIT-017 ao salvar (dirty volta a false) e ao desmontar, para de vigiar", () => {
    const { rerender, unmount } = setup();
    rerender(<Section dirty={false} />);
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
    expect(clickLink("Ver ficha")).toBe(true);

    rerender(<Section dirty />);
    unmount();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });
});
