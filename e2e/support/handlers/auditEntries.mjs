import { http } from "msw";
import { fail, ok, sessionUserOf } from "./session.mjs";

const API = "http://localhost:5099/api/v1/audit-entries";
const ownerId = "15d2c8a8-8f67-44f7-8eb3-4ecf56c65e83";
const actorId = "9f19b59c-2c65-40a4-9e72-371ae9fdcd6e";
const entries = [
  {
    id: "77b9c00c-fdc0-4422-b4c7-7e237741a4a7",
    occurredAt: "2026-10-09T12:00:00Z",
    action: "owner.suspended",
    targetType: "owner",
    targetId: ownerId,
    actorId,
    actorRole: "admin",
    reason: "Revisão sintética",
    details: { status: "suspended" },
    ipAddress: "203.0.113.17",
    traceId: "trace-e2e-033",
  },
  {
    id: "4c92ac3c-1929-4ab6-b6e9-a9f83a126050",
    occurredAt: "2026-10-08T12:00:00Z",
    action: "session.login_succeeded",
    targetType: "account",
    targetId: ownerId,
    actorId,
    actorRole: "admin",
    reason: null,
    details: {},
    ipAddress: null,
    traceId: "trace-e2e-034",
  },
];

/** Handler sintético paginado para GET /audit-entries no Playwright mockado. @example resetAuditEntries(); */
export function resetAuditEntries() {}

/** Simula apenas a listagem administrativa; nunca representa trilha de produção. @example server.use(...auditEntriesHandlers); */
export const auditEntriesHandlers = [
  http.get(API, ({ request }) => {
    const user = sessionUserOf(request);
    if (!user) return fail(401, "UNAUTHORIZED");
    if (user.role !== "admin") return fail(403, "FORBIDDEN");
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const pageSize = Math.max(1, Number(params.get("pageSize") ?? 20));
    const filtered = entries.filter((entry) =>
      ["action", "targetType", "targetId", "actorId"].every(
        (key) => !params.has(key) || String(entry[key] ?? "") === params.get(key),
      ),
    );
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);
    return ok({
      items,
      page,
      pageSize,
      totalCount: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    });
  }),
];
