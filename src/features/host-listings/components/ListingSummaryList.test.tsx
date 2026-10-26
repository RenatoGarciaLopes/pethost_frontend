import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { listingDto, myListingsDto } from "@/test/fixtures/listings";
import { renderWithProviders } from "@/test/render";
import { myListingsSchema } from "../api/contracts";
import { toMyListings } from "../api/mappers";
import { listingCopy as copy } from "../lib/listingCopy";
import { ListingSummaryList } from "./ListingSummaryList";

const photo = { id: "0199e0a0-0000-7000-8000-0000000000f1", url: "https://cdn.test/capa.jpg", position: 1 };

const mine = (listings: unknown[], isCompany = false) =>
  toMyListings(myListingsSchema.parse(myListingsDto(listings, { isCompany })));

describe("ListingSummaryList", () => {
  it("REQ-LIST-001 cada cantinho com capa, situação, diária e 'Ver e editar'", () => {
    renderWithProviders(
      <ListingSummaryList
        mine={mine([
          listingDto({ photos: [photo] }),
          listingDto({ id: "0199e0a0-0000-7000-8000-0000000000c2", title: "Filial Centro", isActive: false }),
        ])}
      />,
      { theme: quintalTheme },
    );
    const cards = screen.getAllByRole("article");
    expect(within(cards[0]!).getByRole("img", { name: "Capa de Casa da Cida" })).toHaveAttribute(
      "src",
      "https://cdn.test/capa.jpg",
    );
    expect(cards[0]).toHaveTextContent("Aberto");
    expect(cards[0]!.textContent).toMatch(/R\$\s60,00 por noite, por pet/);
    expect(within(cards[0]!).getByRole("link", { name: "Ver e editar Casa da Cida" })).toHaveAttribute(
      "href",
      `/host/listings/${listingDto().id}`,
    );
    expect(cards[1]).toHaveTextContent("Pausado");
    expect(cards[1]).toHaveTextContent(copy.summary.noCover);
  });

  it("REQ-LIST-001 empresa pode abrir outro cantinho; pessoa física não", () => {
    const { unmount } = renderWithProviders(<ListingSummaryList mine={mine([listingDto()], true)} />, {
      theme: quintalTheme,
    });
    expect(screen.getByRole("link", { name: copy.summary.another })).toHaveAttribute("href", "/host/listings/new");
    unmount();
    renderWithProviders(<ListingSummaryList mine={mine([listingDto()])} />, { theme: quintalTheme });
    expect(screen.queryByRole("link", { name: copy.summary.another })).not.toBeInTheDocument();
  });

  it("REQ-LIST-001 sem cantinho, nada", () => {
    const { container } = renderWithProviders(<ListingSummaryList mine={mine([])} />, { theme: quintalTheme });
    expect(container).toBeEmptyDOMElement();
  });
});
