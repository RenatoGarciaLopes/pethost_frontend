import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { FlowLayout } from "./FlowLayout";

it("REQ-UIC-005 composes progress, step, and optional preview regions", () => {
  render(
    <FlowLayout progress={<nav aria-label="Progresso">Etapas</nav>} step={<p>Passo atual</p>} preview={<p>Ficha</p>} />,
  );
  expect(screen.getByRole("navigation", { name: "Progresso" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Etapa atual" })).toHaveTextContent("Passo atual");
  expect(screen.getByRole("complementary", { name: "Prévia do cadastro" })).toHaveTextContent("Ficha");
  expect(document.head.textContent).toContain("240px minmax(0, 1fr) 360px");
});

it("REQ-UIC-005 omits the preview rail when there is no live preview", () => {
  render(<FlowLayout progress={<div>Etapas</div>} step={<p>Formulário</p>} />);
  expect(screen.queryByRole("complementary", { name: "Prévia do cadastro" })).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Etapa atual" })).toHaveTextContent("Formulário");
});
