import { lazy, Suspense } from "react";
import { act, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { TURMA_MEMBERS, turmaSrc } from "@/shared/ui/brand/turma";
import AppLoading from "../../loading";
import ListingLoading from "./loading";

afterEach(() => vi.unstubAllGlobals());

it("shows the full application loader while listing content waits and replaces it when ready", async () => {
  expect(ListingLoading).toBe(AppLoading);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  let finish!: (value: { default: () => React.JSX.Element }) => void;
  const content = new Promise<{ default: () => React.JSX.Element }>((resolve) => {
    finish = resolve;
  });
  const PendingContent = lazy(() => content);
  const { container } = renderWithProviders(
    <Suspense fallback={<ListingLoading />}>
      <PendingContent />
    </Suspense>,
    { theme: quintalTheme },
  );
  expect(screen.getByRole("status")).toHaveTextContent("Farejando");
  const images = Array.from(container.querySelectorAll("img"));
  expect(images.map((image) => image.getAttribute("src"))).toEqual(TURMA_MEMBERS.map(turmaSrc));
  for (const image of images) {
    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
  }
  await act(async () => {
    finish({ default: () => <h1>Cantinho carregado</h1> });
    await content;
  });
  expect(screen.getByRole("heading", { name: "Cantinho carregado" })).toBeVisible();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
