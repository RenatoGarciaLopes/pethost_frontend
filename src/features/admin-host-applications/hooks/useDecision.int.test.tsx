import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { expect, it } from "vitest";
import { createTestQueryClient } from "@/test/render";
import { adminApplicationFixture } from "@/test/fixtures/adminApplications";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { adminApplicationQueries } from "../api/queries";
import { useDecision } from "./useDecision";

it.each([409, 422])(
  "REQ-AQUEUE-012/013 decisão invalida fila e conflito %s recarrega detalhe sem retry",
  async (status) => {
    const app = adminApplicationFixture();
    let decided = false;
    let conflict = false;
    let posts = 0;
    server.use(
      http.get("*/api/host-applications/:id", () =>
        HttpResponse.json(apiOk({ ...app, status: decided ? "approved" : "submitted" })),
      ),
      http.post("*/api/host-applications/:id/approval", () => {
        posts++;
        decided = true;
        return conflict
          ? HttpResponse.json(
              apiFail(status === 409 ? "HOST_APPLICATION_CONFLICT" : "HOST_APPLICATION_NOT_UNDER_REVIEW"),
              { status },
            )
          : HttpResponse.json(apiOk({ ...app, status: "approved" }));
      }),
    );
    const client = createTestQueryClient();
    const queueKey = adminApplicationQueries.queue("admin", "submitted").queryKey;
    client.setQueryData(queueKey, [app]);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => ({
        detail: useQuery(adminApplicationQueries.detail("admin", app.id)),
        decision: useDecision("admin", app.id),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.detail.isSuccess).toBe(true));
    await act(async () => {
      await result.current.decision.mutateAsync({ reason: "Conferido" });
    });
    expect(client.getQueryState(queueKey)?.isInvalidated).toBe(true);
    await waitFor(() => expect(result.current.detail.data?.status).toBe("approved"));
    conflict = true;
    await act(async () => {
      await expect(result.current.decision.mutateAsync({ reason: "Conferido" })).rejects.toMatchObject({ status });
    });
    await waitFor(() => expect(result.current.decision.isError).toBe(true));
    expect(result.current.detail.data?.status).toBe("approved");
    expect(posts).toBe(2);
    client.clear();
  },
);
