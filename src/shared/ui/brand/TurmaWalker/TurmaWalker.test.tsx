import { act, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TurmaWalker } from "./TurmaWalker";
import { TurmaDog } from "./TurmaDog";
import { turmaPosters } from "../turmaPosters";

beforeEach(() =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  ),
);
afterEach(() => vi.unstubAllGlobals());

it.each(["loop", "once"] as const)(
  "decorative parade %s preserves size and starts at the expected position",
  (repeat) => {
    const { container } = renderWithProviders(
      <TurmaWalker members={["corgi", "golden"]} dogHeight={40} crossingMs={1000} intervalMs={2000} repeat={repeat} />,
    );
    expect(container.firstChild).toHaveStyle({ height: "40px", pointerEvents: "none" });
    const dogs = container.querySelectorAll("img");
    expect(dogs).toHaveLength(2);
    expect(dogs[0]).toHaveAttribute("height", "40");
    expect(dogs[0]).toHaveAttribute("src", turmaPosters.corgi);
    expect(getComputedStyle(dogs[0].parentElement!).animation).toContain(
      repeat === "loop" ? "-400ms infinite" : "0ms 1 both",
    );
  },
);

it("reduced motion shows embedded dogs immediately without downloading animations", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  const download = vi.fn();
  vi.stubGlobal("Image", download);
  const { container } = renderWithProviders(<TurmaWalker />);
  const dogs = container.querySelectorAll("img");
  expect(dogs).toHaveLength(3);
  expect(dogs[0]).toHaveAttribute("src", turmaPosters.corgi);
  expect(dogs[0].parentElement).not.toHaveStyle({ visibility: "hidden" });
  expect(download).not.toHaveBeenCalled();
});

it("keeps the first frame until decode completes and restores it after an image failure", async () => {
  let loaded: (() => Promise<void>) | null = null;
  let finish!: () => void;
  const decoded = new Promise<void>((resolve) => {
    finish = resolve;
  });
  vi.stubGlobal(
    "Image",
    class {
      onload: (() => Promise<void>) | null = null;
      decode = () => decoded;
      set src(_value: string) {
        loaded = this.onload;
      }
    },
  );
  const { container } = renderWithProviders(<TurmaDog member="corgi" height={66} still={false} />);
  const dog = container.querySelector("img")!;
  expect(dog).toHaveAttribute("src", turmaPosters.corgi);
  const pending = loaded!();
  expect(dog).toHaveAttribute("src", turmaPosters.corgi);
  await act(async () => {
    finish();
    await pending;
  });
  await waitFor(() => expect(dog).toHaveAttribute("src", "/brand/turma/corgi.webp"));
  fireEvent.error(dog);
  expect(dog).toHaveAttribute("src", turmaPosters.corgi);
});

it("decode rejection preserves the embedded frame and unmount cancels late completion", async () => {
  const images: { onload: (() => Promise<void>) | null; decode: () => Promise<void> }[] = [];
  vi.stubGlobal(
    "Image",
    class {
      onload: (() => Promise<void>) | null = null;
      src = "";
      decode = vi.fn().mockRejectedValue(new Error("invalid image"));
      constructor() {
        images.push(this);
      }
    },
  );
  const { container, unmount } = renderWithProviders(<TurmaDog member="golden" height={50} still={false} />);
  await act(async () => {
    await images[0].onload!();
  });
  expect(container.querySelector("img")).toHaveAttribute("src", turmaPosters.golden);
  unmount();
  expect(images[0].onload).toBeNull();
});

it("explicit still overrides the motion preference", () => {
  const { container, rerender } = renderWithProviders(<TurmaDog member="pastor" height={50} still />);
  expect(container.querySelector("img")).toHaveAttribute("src", turmaPosters.pastor);
  rerender(<TurmaDog member="corgi" height={50} still />);
  expect(container.querySelector("img")).toHaveAttribute("src", turmaPosters.corgi);
});
