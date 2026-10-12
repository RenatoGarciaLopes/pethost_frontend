import { createTheme, useTheme } from "@mui/material/styles";
import { useQueryClient } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createTestQueryClient, renderWithProviders } from "./render";

function ThemeProbe() {
  const theme = useTheme();
  return <p>cor principal: {theme.palette.primary.main}</p>;
}

function QueryProbe({ onClient }: { onClient: (client: unknown) => void }) {
  onClient(useQueryClient());
  return null;
}

describe("renderWithProviders", () => {
  it("REQ-TOOL-003 entrega o tema recebido aos componentes", () => {
    renderWithProviders(<ThemeProbe />, { theme: createTheme({ palette: { primary: { main: "#F26B3A" } } }) });

    expect(screen.getByText("cor principal: #F26B3A")).toBeInTheDocument();
  });

  it("REQ-TOOL-003 cria um QueryClient novo a cada render, sem compartilhar cache", () => {
    const clients: unknown[] = [];

    renderWithProviders(<QueryProbe onClient={(client) => clients.push(client)} />);
    renderWithProviders(<QueryProbe onClient={(client) => clients.push(client)} />);

    expect(clients[0]).toBeDefined();
    expect(clients[0]).not.toBe(clients[1]);
  });

  it("REQ-TOOL-003 devolve o QueryClient usado e um user-event pronto", () => {
    const { queryClient, user } = renderWithProviders(<p>oi</p>);

    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
    expect(typeof user.click).toBe("function");
  });

  it("REQ-TOOL-003 aceita um QueryClient de fora, para o teste semear o cache", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["semente"], 42);

    const result = renderWithProviders(<p>oi</p>, { queryClient });

    expect(result.queryClient.getQueryData(["semente"])).toBe(42);
  });
});
