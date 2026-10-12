import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifySessionExpired } from "@/shared/auth/client/sessionEvents";
import { QueryProvider } from "./QueryProvider";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

let seenClient: QueryClient | undefined;
const capture = (client: QueryClient) => {
  seenClient = client;
};

function Probe() {
  const client = useQueryClient();
  useEffect(() => capture(client), [client]);
  return <p>conteúdo</p>;
}

describe("QueryProvider", () => {
  beforeEach(() => {
    replace.mockClear();
    window.history.pushState({}, "", "/pets?tab=fotos");
  });

  it("REQ-HTTP-018 entrega um QueryClient aos filhos", () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );

    expect(screen.getByText("conteúdo")).toBeInTheDocument();
    expect(seenClient).toBeDefined();
  });

  it("REQ-HTTP-012 sessão vencida limpa o cache e leva ao login com next da página atual", () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );
    seenClient!.setQueryData(["account", "a1", "pets"], [{ id: "p1" }]);

    act(() => notifySessionExpired());

    expect(seenClient!.getQueryData(["account", "a1", "pets"])).toBeUndefined();
    expect(replace).toHaveBeenCalledWith("/login?next=%2Fpets%3Ftab%3Dfotos");
  });

  it("REQ-HTTP-012 depois de desmontar não reage mais", () => {
    const { unmount } = render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );
    unmount();

    notifySessionExpired();

    expect(replace).not.toHaveBeenCalled();
  });
});
