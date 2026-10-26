import { http, HttpResponse } from "msw";

const sessions = new Map();
/** Test-only state; never stores real credentials or sends to a real bucket. */
export function resetDirectUploads() {
  sessions.clear();
}
const ok = (data, status = 200) => HttpResponse.json({ success: true, data }, { status });
const missing = () =>
  HttpResponse.json(
    { success: false, error: { code: "UPLOAD_NOT_FOUND", message: "Missing mock upload" } },
    { status: 404 },
  );

function target(session) {
  const { purpose, resourceId, photoId } = session.target;
  const suffix = photoId ? `/${encodeURIComponent(photoId)}` : "";
  switch (purpose) {
    case "owner-avatar":
      return ["PUT", "/owners/me/avatar"];
    case "host-avatar":
      return ["PUT", "/hosts/me/avatar"];
    case "pet-photo":
      return [photoId ? "PATCH" : "POST", `/pets/${encodeURIComponent(resourceId)}/photos${suffix}`];
    case "listing-photo":
      return [photoId ? "PATCH" : "POST", `/listings/${encodeURIComponent(resourceId)}/photos${suffix}`];
    case "chat-photo":
      return ["POST", `/conversations/${encodeURIComponent(resourceId)}/messages/photo`];
    case "host-document":
      return ["PUT", "/hosts/me/application/documents"];
    default:
      throw new Error("Unknown mock upload purpose");
  }
}

async function confirm(records, body, batch = false) {
  if (records.some((record) => !record?.file)) return missing();
  if (!batch && records[0].result) return ok(records[0].result);
  const first = records[0];
  const [method, path] = target(first);
  const form = new FormData();
  for (const record of records) {
    const extension = record.target.contentType.split("/")[1].replace("jpeg", "jpg");
    form.append(
      record.target.purpose === "host-document" ? record.target.kind : "file",
      record.file,
      `upload.${extension}`,
    );
  }
  if (body?.body) form.append("body", body.body);
  // Reuse the existing synthetic resource handlers; only this test adapter speaks their multipart interface.
  const headers = new Headers(first.headers);
  headers.delete("content-type");
  headers.delete("content-length");
  headers.delete("host");
  const response = await fetch(`${first.base}${path}`, { method, headers, body: form });
  const envelope = await response.json();
  if (!response.ok) return HttpResponse.json(envelope, { status: response.status });
  for (const record of records)
    record.result = { uploadId: record.id, purpose: record.target.purpose, status: "completed", result: envelope.data };
  return ok(records.at(-1).result);
}

/** Shared Vitest/E2E protocol adapter. It models transport, not .NET authorization or bucket validation. */
export const directUploadHandlers = [
  http.post("*/api/uploads", requestUpload),
  http.post("*/api/v1/uploads", requestUpload),
  http.put("*/__mock/uploads/:id", async ({ request, params }) => {
    const session = sessions.get(String(params.id));
    if (!session) return missing();
    session.file = await request.blob();
    return new HttpResponse(null, { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
  }),
  http.options(
    "*/__mock/uploads/:id",
    () =>
      new HttpResponse(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT",
          "Access-Control-Allow-Headers": "content-type",
        },
      }),
  ),
  http.post("*/api/uploads/documents/confirm", confirmDocuments),
  http.post("*/api/v1/uploads/documents/confirm", confirmDocuments),
  http.post("*/api/uploads/:id/confirm", confirmOne),
  http.post("*/api/v1/uploads/:id/confirm", confirmOne),
];

async function requestUpload({ request }) {
  const data = await request.json();
  const id = crypto.randomUUID();
  const base = request.url.replace(/\/uploads$/, "");
  sessions.set(id, { id, base, headers: [...request.headers], target: data });
  return ok(
    {
      uploadId: id,
      purpose: data.purpose,
      uploadUrl: `${new URL(request.url).origin}/__mock/uploads/${id}`,
      method: "PUT",
      headers: { "Content-Type": data.contentType },
      sizeBytes: data.sizeBytes,
      expiresAt: Math.floor(Date.now() / 1000) + 600,
      confirmBy: Math.floor(Date.now() / 1000) + 1800,
    },
    201,
  );
}
async function confirmOne({ request, params }) {
  return confirm([sessions.get(String(params.id))], await request.json());
}
async function confirmDocuments({ request }) {
  const body = await request.json();
  return confirm(
    body.uploadIds.map((id) => sessions.get(id)),
    body,
    true,
  );
}
