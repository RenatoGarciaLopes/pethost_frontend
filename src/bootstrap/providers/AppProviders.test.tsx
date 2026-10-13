import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAnnounce } from "@/shared/ui/feedback/Announcer";
import { AppProviders } from "./AppProviders";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

function Probe() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  useAnnounce();
  return <p>{`${theme.palette.primary.main} ${queryClient ? "query" : ""}`}</p>;
}

describe("AppProviders", () => {
  it("REQ-HTTP-017 REQ-SWITCH-006 entrega o tema Quintal, o QueryClient e a região viva aos filhos", () => {
    render(
      <AppProviders>
        <Probe />
      </AppProviders>,
    );

    expect(screen.getByText(/query$/)).toBeInTheDocument();
    expect(screen.getByText(/#F26B3A/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
