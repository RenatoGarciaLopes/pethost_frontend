import NextLink from "next/link";
import { createRef } from "react";
import { screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { Notice } from "./Notice";
import { StatusPill } from "./StatusPill";
import { Sticker } from "./Sticker";
import { Hint } from "./Hint";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

it.each(["erro", "atencao", "info", "ok"] as const)(
  "REQ-DS-013 Notice anuncia tom %s com texto, ícone e ação",
  async (tone) => {
    const ref = createRef<HTMLDivElement>();
    const action = vi.fn();
    const { user } = renderWithProviders(
      <Notice
        tone={tone}
        title="Atenção à conta"
        ref={ref}
        id="notice"
        action={<button onClick={action}>Resolver</button>}
      >
        Orientação útil
      </Notice>,
      { theme: quintalTheme },
    );
    const notice = screen.getByRole(tone === "erro" ? "alert" : "status");
    expect(notice).toHaveAttribute("data-tone", tone);
    expect(notice).toHaveTextContent("Atenção à conta");
    expect(notice).toHaveTextContent("Orientação útil");
    expect(notice.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    ref.current?.focus();
    expect(notice).toHaveFocus();
    await user.click(within(notice).getByRole("button", { name: "Resolver" }));
    expect(action).toHaveBeenCalledOnce();
  },
);
it("REQ-DS-013 Notice aceita somente detalhe ou somente título sem ação", () => {
  const { rerender } = renderWithProviders(<Notice tone="info">Detalhe</Notice>, { theme: quintalTheme });
  expect(screen.getByRole("status")).toHaveTextContent("Detalhe");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  rerender(<Notice tone="info" title="Título" />);
  expect(screen.getByRole("status")).toHaveTextContent("Título");
  expect(screen.queryByText("Detalhe")).not.toBeInTheDocument();
});
it.each(["neutro", "info", "ok", "erro", "atencao"] as const)(
  "REQ-DS-014 StatusPill comunica %s sem virar controle",
  (tone) => {
    const { rerender } = renderWithProviders(<StatusPill label="Em análise" tone={tone} />, { theme: quintalTheme });
    const pill = screen.getByText("Em análise");
    expect(pill).toHaveAttribute("data-tone", tone);
    expect(Boolean(pill.querySelector("svg"))).toBe(tone !== "neutro");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(pill).toHaveStyle({ padding: "4px 12px" });
    rerender(<StatusPill label="Em análise" tone={tone} size="sm" />);
    expect(screen.getByText("Em análise")).toHaveStyle({ padding: "2px 10px" });
  },
);
it("REQ-DS-014 StatusPill padrão é neutro e Sticker preserva rótulo e inclinação", () => {
  const { rerender } = renderWithProviders(
    <>
      <StatusPill label="Pendente" />
      <Sticker label="Vizinho" />
    </>,
    { theme: quintalTheme },
  );
  expect(screen.getByText("Pendente")).toHaveAttribute("data-tone", "neutro");
  expect(screen.getByText("Vizinho")).toHaveStyle({ transform: "rotate(4deg)" });
  rerender(<Sticker label="Novo" color="grama" tilt={-3} playful={false} />);
  expect(screen.getByText("Novo")).toHaveStyle({ transform: "rotate(-3deg)" });
});
it("REQ-DS-014 Hint liga orientação ao campo sem anunciar erro", () => {
  const { container, rerender } = renderWithProviders(
    <>
      <input aria-label="CEP" aria-describedby="hint" />
      <Hint id="hint" title="Onde mora">
        Digite só números
      </Hint>
    </>,
    { theme: quintalTheme },
  );
  expect(screen.getByRole("textbox")).toHaveAccessibleDescription("Onde mora Digite só números");
  expect(container.querySelector("#hint svg")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  rerender(<Hint icon={false}>Outra dica</Hint>);
  expect(container.querySelector("svg")).not.toBeInTheDocument();
  expect(screen.getByText("Outra dica")).toBeVisible();
});
it("REQ-DS-014 EmptyState oferece próximo passo e ilustração decorativa", async () => {
  const action = vi.fn();
  const { user, container, rerender } = renderWithProviders(
    <EmptyState
      title="Ainda sem pets"
      description="Apresente seu pet"
      action={<button onClick={action}>Cadastrar</button>}
    />,
    { theme: quintalTheme },
  );
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Ainda sem pets");
  expect(screen.getByText("Apresente seu pet")).toBeVisible();
  expect(container.querySelectorAll("svg")).toHaveLength(4);
  await user.click(screen.getByRole("button", { name: "Cadastrar" }));
  expect(action).toHaveBeenCalledOnce();
  rerender(<EmptyState title="Outro vazio" headingComponent="h3" illustration={<span>Desenho próprio</span>} />);
  expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Outro vazio");
  expect(screen.getByText("Desenho próprio").closest('[aria-hidden="true"]')).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("REQ-DS-014 ErrorState oferece retry, código e ação secundária", async () => {
  const retry = vi.fn();
  const { user, rerender } = renderWithProviders(
    <ErrorState onRetry={retry} traceId="trace-teste" secondaryAction={<NextLink href="/">Início</NextLink>} />,
    { theme: quintalTheme },
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Deu um problema do nosso lado.");
  expect(screen.getByText("trace-teste")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(retry).toHaveBeenCalledOnce();
  expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
  rerender(<ErrorState title="Outra falha" description="Aguarde" headingComponent="h3" />);
  expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Outra falha");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByText("trace-teste")).not.toBeInTheDocument();
  rerender(<ErrorState secondaryAction={<a href="/help">Ajuda</a>} />);
  expect(screen.getByRole("link", { name: "Ajuda" })).toHaveAttribute("href", "/help");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("REQ-DS-014 REQ-UIC-007 StatusPill é selo do tamanho do texto: grama cheio no ok, céu na espera, sem sombra", () => {
  renderWithProviders(
    <div style={{ display: "flex", flexDirection: "column" }}>
      <StatusPill tone="ok" label="Confirmada" />
      <StatusPill tone="info" label="Esperando resposta" />
    </div>,
    { theme: quintalTheme },
  );
  const ok = screen.getByText("Confirmada");
  expect(ok).toHaveStyle({ width: "fit-content", alignSelf: "flex-start", backgroundColor: "rgb(197, 219, 79)" });
  expect(screen.getByText("Esperando resposta")).toHaveStyle({ backgroundColor: "rgb(127, 196, 224)" });
});
