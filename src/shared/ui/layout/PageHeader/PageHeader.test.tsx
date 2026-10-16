import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

it("REQ-UIC-007 renders a page h1, optional subtitle and action", () => {
  render(<PageHeader title="Painel" subtitle="Resumo da sua casa" actions={<button>Ver pedidos</button>} />);
  expect(screen.getByRole("heading", { level: 1, name: "Painel" })).toBeInTheDocument();
  expect(screen.getByText("Resumo da sua casa")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Ver pedidos" })).toBeInTheDocument();
});

it("REQ-UIC-007 renders without optional subtitle or actions", () => {
  render(<PageHeader title="Estadias" />);
  expect(screen.getByRole("heading", { level: 1, name: "Estadias" })).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
