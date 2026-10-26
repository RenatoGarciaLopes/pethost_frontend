import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { messageDto } from "@/test/fixtures/conversations";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { toMessage } from "../../../api/mappers";
import { messageDtoSchema } from "../../../api/contracts";
import { MessagePhoto } from "./MessagePhoto";

const message = (expired = false) =>
  toMessage(
    messageDtoSchema.parse(
      messageDto({
        imageUrl: "https://bucket.test/old",
        imageUrlExpiresAt: Math.floor(Date.now() / 1000) + (expired ? -60 : 300),
      }),
    ),
  );

describe("MessagePhoto", () => {
  it("does not reload an unchanged photo when polling rotates its signed URL", () => {
    const photo = message();
    const { rerender } = renderWithProviders(<MessagePhoto message={photo} mine={false} otherName="Cida" />);
    rerender(
      <MessagePhoto
        message={{
          ...photo,
          imageUrl: "https://bucket.test/rotated",
          imageUrlExpiresAt: photo.imageUrlExpiresAt! + 30,
        }}
        mine={false}
        otherName="Cida"
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", photo.imageUrl);
  });
  it("renews an expired private link before rendering the image", async () => {
    const photo = message(true);
    server.use(
      http.get(`*/api/conversations/${photo.conversationId}/messages/${photo.id}/photo`, () =>
        HttpResponse.json(
          apiOk({
            messageId: photo.id,
            url: "https://bucket.test/new",
            expiresAt: Math.floor(Date.now() / 1000) + 300,
          }),
        ),
      ),
    );
    renderWithProviders(<MessagePhoto message={photo} mine={false} otherName="Cida" />);
    await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("src", "https://bucket.test/new"));
  });

  it("attempts one automatic recovery after an image error and offers an explicit retry if it still fails", async () => {
    const photo = message();
    let renewals = 0;
    server.use(
      http.get(`*/api/conversations/${photo.conversationId}/messages/${photo.id}/photo`, () => {
        renewals++;
        return HttpResponse.json(
          apiOk({
            messageId: photo.id,
            url: `https://bucket.test/new-${renewals}`,
            expiresAt: Math.floor(Date.now() / 1000) + 300,
          }),
        );
      }),
    );
    const { user } = renderWithProviders(<MessagePhoto message={photo} mine={false} otherName="Cida" />);
    fireEvent.error(screen.getByRole("img"));
    await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("src", "https://bucket.test/new-1"));
    fireEvent.error(screen.getByRole("img"));
    await user.click(screen.getByRole("button", { name: "Tentar carregar a foto" }));
    await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("src", "https://bucket.test/new-2"));
    expect(renewals).toBe(2);
  });

  it("renews after returning to the tab when its private link has expired", async () => {
    const photo = message(true);
    let calls = 0;
    server.use(
      http.get(`*/api/conversations/${photo.conversationId}/messages/${photo.id}/photo`, () => {
        calls++;
        return calls === 1
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json(
              apiOk({
                messageId: photo.id,
                url: "https://bucket.test/focused",
                expiresAt: Math.floor(Date.now() / 1000) + 300,
              }),
            );
      }),
    );
    renderWithProviders(<MessagePhoto message={photo} mine otherName="Cida" />);
    await screen.findByRole("button", { name: "Tentar carregar a foto" });
    fireEvent.focus(window);
    await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("src", "https://bucket.test/focused"));
  });
});
