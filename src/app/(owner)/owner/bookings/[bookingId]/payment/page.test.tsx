import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PaymentPage, { metadata } from "./page";

const { requireRole, getBookingDetail, getListingPageDetail } = vi.hoisted(() => ({
  requireRole: vi.fn(),
  getBookingDetail: vi.fn(),
  getListingPageDetail: vi.fn(),
}));
vi.mock("@/shared/auth/server/requireRole", () => ({ requireRole }));
vi.mock("@/features/bookings/index.server", () => ({
  getBookingDetail,
  BookingPaymentScreen: ({ coverUrl }: { coverUrl?: string }) => <p>{coverUrl ?? "Capa indisponível"}</p>,
}));
vi.mock("@/features/listing-page/index.server", () => ({ getListingPageDetail }));
vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("rota do pagamento", () => {
  it("REQ-PAY-001/002 metadata privada e capa pública reaproveitada na composição", async () => {
    expect(metadata).toEqual({ title: "Pagamento da estadia", robots: { index: false, follow: false } });
    requireRole.mockResolvedValue({ id: "owner" });
    getBookingDetail.mockResolvedValue({ listing: { id: "listing" } });
    getListingPageDetail.mockResolvedValue({ photos: [{ url: "https://images.example.test/yard.webp" }] });
    const element = PaymentPage({ params: Promise.resolve({ bookingId: "0199f0a0-0000-7000-8000-0000000000d1" }) });
    // Executa a fronteira async RSC sem simular o SDK no teste da rota.
    const content = element.props.children;
    render(await content.type(content.props));
    expect(screen.getByText("https://images.example.test/yard.webp")).toBeInTheDocument();
    expect(requireRole).toHaveBeenCalledWith("owner", expect.stringContaining("/payment"));
  });
  it("REQ-PAY-002 falha da capa não bloqueia reserva existente", async () => {
    requireRole.mockResolvedValue({ id: "owner" });
    getBookingDetail.mockResolvedValue({ listing: { id: "listing" } });
    getListingPageDetail.mockRejectedValue(new Error("LISTING_NOT_FOUND"));
    const element = PaymentPage({ params: Promise.resolve({ bookingId: "0199f0a0-0000-7000-8000-0000000000d1" }) });
    render(await element.props.children.type(element.props.children.props));
    expect(screen.getByText("Capa indisponível")).toBeInTheDocument();
  });
  it("REQ-PAY-001 UUID inválido vira 404 antes de autenticar", async () => {
    requireRole.mockClear();
    const element = PaymentPage({ params: Promise.resolve({ bookingId: "invalid" }) });
    await expect(element.props.children.type(element.props.children.props)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(requireRole).not.toHaveBeenCalled();
  });
});
