import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import type { AuditPageDto } from "../contracts";
import { auditQueries } from "../queries";
import { server } from "@/test/msw/server";
import { createBffClient } from "@/shared/api/client/bffClient";
import { prefetchAuditEntries } from "./audit.server";

const adminId = "9f19b59c-2c65-40a4-9e72-371ae9fdcd6e";
const query = { page: 1, pageSize: 20 };
it("REQ-AUDIT-001 integra a borda MSW com os parâmetros reais da API", async () => {
  const response: AuditPageDto = { items: [], page: 1, pageSize: 20, totalCount: 0 };
  server.use(
    http.get("http://audit.test/api/audit-entries", () =>
      HttpResponse.json({ success: true, data: response, timestamp: new Date().toISOString() }),
    ),
  );
  const actualTransport = createBffClient({ baseUrl: "http://audit.test/api" });
  const client = new QueryClient();
  await prefetchAuditEntries(client, adminId, query, actualTransport);

  expect(client.getQueryData(auditQueries.page(adminId, query).queryKey)).toEqual(response);
  expect(client.getQueryData(auditQueries.page("outro-admin", query).queryKey)).toBeUndefined();
});
