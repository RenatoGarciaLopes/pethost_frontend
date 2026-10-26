import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PageContainer } from "./PageContainer";

it("REQ-UIC-004 applies the standard page width and responsive gutters", () => {
  render(<PageContainer data-testid="page">Painel</PageContainer>);
  expect(screen.getByTestId("page")).toBeInTheDocument();
  expect(document.head.textContent).toContain("max-width:1200px");
  expect(document.head.textContent).toContain("padding-left:16px");
  expect(document.head.textContent).toContain("padding-left:32px");
});

it("REQ-UIC-004 supports reading width for focused content", () => {
  render(
    <PageContainer width="reading" data-testid="reading">
      Texto
    </PageContainer>,
  );
  expect(screen.getByTestId("reading")).toBeInTheDocument();
  expect(document.head.textContent).toContain("max-width:720px");
});
