import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { FlashMessageProvider, useFlashMessage, useFlashMessageOnce } from "./useFlashMessage";

/** Tela A: grava o aviso e "navega" (ou só navega). */
function Ficha({ onLeave }: { onLeave: () => void }) {
  const flash = useFlashMessage();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          flash.show("A ficha de Thor saiu da lista.");
          onLeave();
        }}
      >
        Tirar da lista
      </button>
      <button type="button" onClick={onLeave}>
        Voltar pra lista
      </button>
    </>
  );
}

/** Tela B: mostra o aviso uma vez. */
function Lista({ onOpen }: { onOpen: () => void }) {
  const message = useFlashMessageOnce();
  return (
    <>
      {message && <p role="status">{message}</p>}
      <button type="button" onClick={onOpen}>
        Abrir ficha
      </button>
    </>
  );
}

/** Troca de tela como o App Router: desmonta uma e monta a outra; o provider fica. */
function App() {
  const [current, setCurrent] = useState<"ficha" | "lista">("ficha");
  return (
    <FlashMessageProvider>
      {current === "ficha" ? (
        <Ficha onLeave={() => setCurrent("lista")} />
      ) : (
        <Lista onOpen={() => setCurrent("ficha")} />
      )}
    </FlashMessageProvider>
  );
}

async function showThenVisitAgain(wrapper?: (props: { children: ReactNode }) => ReactNode) {
  const user = userEvent.setup();
  render(<App />, { wrapper });
  await user.click(screen.getByRole("button", { name: "Tirar da lista" }));
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status")).toHaveTextContent("A ficha de Thor saiu da lista.");

  // Visita seguinte sem aviso novo: nada aparece.
  await user.click(screen.getByRole("button", { name: "Abrir ficha" }));
  await user.click(screen.getByRole("button", { name: "Voltar pra lista" }));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
}

describe("useFlashMessage", () => {
  it("REQ-PEDIT-012 aviso gravado na tela A aparece uma vez na tela B e some na visita seguinte", async () => {
    await showThenVisitAgain();
  });

  it("REQ-PEDIT-012 StrictMode (montagem dupla) não perde nem repete o aviso", async () => {
    await showThenVisitAgain(StrictMode);
  });

  it("REQ-PEDIT-012 sem aviso gravado devolve null", () => {
    const { result } = renderHook(() => useFlashMessageOnce(), { wrapper: FlashMessageProvider });
    expect(result.current).toBeNull();
  });

  it("REQ-PEDIT-012 fora do provider avisa o erro de montagem", () => {
    expect(() => renderHook(() => useFlashMessage())).toThrow("useFlashMessage precisa do FlashMessageProvider");
  });
});
