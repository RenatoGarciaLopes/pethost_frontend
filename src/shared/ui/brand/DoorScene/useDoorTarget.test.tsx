import { fireEvent, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DOOR_TARGET_ATTR, DOOR_WARM_ATTR, useDoorTarget } from "./useDoorTarget";

function Probe({ enabled = true }: { enabled?: boolean }) {
  const { engaged, warm } = useDoorTarget(enabled);
  return (
    <>
      <output>{`${engaged}/${warm}`}</output>
      <form {...{ [DOOR_TARGET_ATTR]: "" }}>
        <input aria-label="Email" />
        <button type="button" {...{ [DOOR_WARM_ATTR]: "" }}>
          <span>Entrar</span>
        </button>
      </form>
      <button>Fora</button>
    </>
  );
}
it("REQ-AUTH-016 combina hover e foco, inclusive descendentes do botão", async () => {
  const { user } = renderWithProviders(<Probe />);
  const output = screen.getByRole("status");
  expect(output).toHaveTextContent("false/false");
  fireEvent.pointerOver(screen.getByLabelText("Email"));
  expect(output).toHaveTextContent("true/false");
  fireEvent.pointerOver(screen.getByText("Entrar"));
  expect(output).toHaveTextContent("true/true");
  fireEvent.pointerOver(screen.getByText("Entrar"));
  expect(output).toHaveTextContent("true/true");
  await user.click(screen.getByLabelText("Email"));
  fireEvent.pointerOut(screen.getByText("Entrar"), { relatedTarget: null });
  expect(output).toHaveTextContent("true/false");
  await user.tab();
  expect(output).toHaveTextContent("true/true");
  await user.tab();
  expect(output).toHaveTextContent("false/false");
});
it("REQ-AUTH-016 saída interna mantém hover até pointerover do destino", () => {
  renderWithProviders(<Probe />);
  fireEvent.pointerOver(screen.getByText("Entrar"));
  fireEvent.pointerOut(screen.getByText("Entrar"), { relatedTarget: screen.getByLabelText("Email") });
  expect(screen.getByRole("status")).toHaveTextContent("true/true");
  fireEvent.pointerOver(screen.getByRole("button", { name: "Fora" }));
  expect(screen.getByRole("status")).toHaveTextContent("false/false");
  fireEvent(document, new Event("pointerover", { bubbles: true }));
  expect(screen.getByRole("status")).toHaveTextContent("false/false");
});
it("REQ-AUTH-016 desliga listeners para cenas de estado fixo", () => {
  const { rerender, unmount } = renderWithProviders(<Probe enabled={false} />);
  fireEvent.pointerOver(screen.getByText("Entrar"));
  fireEvent.focusIn(screen.getByLabelText("Email"));
  expect(screen.getByRole("status")).toHaveTextContent("false/false");
  rerender(<Probe />);
  fireEvent.focusIn(screen.getByText("Entrar"));
  expect(screen.getByRole("status")).toHaveTextContent("true/true");
  fireEvent.focusOut(screen.getByText("Entrar"), { relatedTarget: null });
  expect(screen.getByRole("status")).toHaveTextContent("false/false");
  unmount();
  fireEvent(document, new Event("pointerover"));
});
