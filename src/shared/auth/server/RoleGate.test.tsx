import type { ReactElement, ReactNode } from "react";
import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { sessionUserFixture } from "@/test/fixtures/session";
import { renderWithProviders } from "@/test/render";
import { RoleGate, type RoleGateProps } from "./RoleGate";
import { requireRole } from "./requireRole";

vi.mock("./requireRole", () => ({ requireRole: vi.fn() }));

// RSC assíncrono é resolvido no servidor. jsdom recebe apenas o resultado, não executa RSC.
function gateParts(roles: RoleGateProps["roles"]) {
  const gate = RoleGate({ roles, children: <section aria-label="Área privada">Dados privados</section> });
  const props = gate.props as { fallback: ReactElement; children: ReactElement<RoleGateProps> };
  const confirm = props.children.type as (props: RoleGateProps) => Promise<ReactNode>;
  return { fallback: props.fallback, resolve: () => confirm(props.children.props) };
}

it("REQ-SHELL-010 só entrega conteúdo depois da confirmação e oferece loading acessível", async () => {
  let complete!: (value: typeof sessionUserFixture) => void;
  vi.mocked(requireRole).mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const gate = gateParts(["owner", "host"]);
  const content = gate.resolve();
  const { rerender } = renderWithProviders(gate.fallback, { theme: quintalTheme });
  expect(screen.getByRole("status")).toHaveTextContent("Farejando");
  expect(screen.queryByRole("region", { name: "Área privada" })).not.toBeInTheDocument();
  expect(requireRole).toHaveBeenCalledWith(["owner", "host"]);
  complete(sessionUserFixture);
  rerender(<>{await content}</>);
  expect(screen.getByRole("region", { name: "Área privada" })).toHaveTextContent("Dados privados");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
it("REQ-SHELL-010 recusa não devolve conteúdo protegido", async () => {
  vi.mocked(requireRole).mockRejectedValue(new Error("redirect:/login"));
  await expect(gateParts("admin").resolve()).rejects.toThrow("redirect:/login");
  expect(requireRole).toHaveBeenLastCalledWith("admin");
});
