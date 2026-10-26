import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createBffClient } from "./bffClient";
import { confirmDocumentUploads, stageDirectUpload, uploadDirect } from "./uploadDirect";

const id = "0199f0a0-0000-7000-8000-000000000011";
const transport = createBffClient({ baseUrl: "http://localhost/api" });
const file = () => new File(["image bytes"], "pet.png", { type: "image/png" });
const schema = z.object({ name: z.string() });
const target = { purpose: "pet-photo", resourceId: id } as const;
const ticket = () => ({
  uploadId: id,
  purpose: target.purpose,
  uploadUrl: "https://bucket.test/pending/file?signature=test",
  method: "PUT",
  headers: { "Content-Type": "image/png" },
  sizeBytes: file().size,
  expiresAt: Math.floor(Date.now() / 1000) + 600,
  confirmBy: Math.floor(Date.now() / 1000) + 1800,
});
const confirmed = () => ({ uploadId: id, purpose: target.purpose, status: "completed", result: { name: "Pipoca" } });

describe("uploadDirect", () => {
  it("sends only metadata through the BFF and bytes directly to storage without session headers", async () => {
    const seen: string[] = [];
    server.use(
      http.post("*/api/uploads", async ({ request }) => {
        seen.push("request");
        expect(await request.json()).toEqual({ ...target, contentType: "image/png", sizeBytes: file().size });
        expect(request.headers.get("x-pethost-request")).toBe("1");
        return HttpResponse.json(apiOk(ticket()), { status: 201 });
      }),
      http.put("https://bucket.test/pending/file", async ({ request }) => {
        seen.push("put");
        expect(await request.text()).toBe("image bytes");
        expect(request.credentials).toBe("omit");
        expect(request.headers.get("authorization")).toBeNull();
        expect(request.headers.get("x-pethost-request")).toBeNull();
        expect(request.headers.get("cookie")).toBeNull();
        expect(request.headers.get("content-type")).toBe("image/png");
        return new HttpResponse(null);
      }),
      http.post(`*/api/uploads/${id}/confirm`, async ({ request }) => {
        seen.push("confirm");
        expect(await request.json()).toEqual({ body: "Olha ela!" });
        return HttpResponse.json(apiOk(confirmed()));
      }),
    );
    expect(await uploadDirect(file(), target, schema, transport, "Olha ela!")).toEqual({ name: "Pipoca" });
    expect(seen).toEqual(["request", "put", "confirm"]);
  });

  it("retries an ambiguous confirmation with the same ID without requesting or sending the image again", async () => {
    let requests = 0;
    let puts = 0;
    let confirms = 0;
    server.use(
      http.post("*/api/uploads", () => {
        requests++;
        return HttpResponse.json(apiOk(ticket()));
      }),
      http.put("https://bucket.test/pending/file", () => {
        puts++;
        return new HttpResponse(null);
      }),
      http.post(`*/api/uploads/${id}/confirm`, () => {
        confirms++;
        return confirms === 1
          ? HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 500 })
          : HttpResponse.json(apiOk(confirmed()));
      }),
    );
    await uploadDirect(file(), target, schema, transport);
    expect({ requests, puts, confirms }).toEqual({ requests: 1, puts: 1, confirms: 2 });
  });

  it("does not send bytes when authorization is refused", async () => {
    server.use(
      http.post("*/api/uploads", () => HttpResponse.json(apiFail("UPLOAD_PURPOSE_FORBIDDEN"), { status: 403 })),
    );
    await expect(uploadDirect(file(), target, schema, transport)).rejects.toMatchObject({
      status: 403,
      code: "UPLOAD_PURPOSE_FORBIDDEN",
    });
  });

  it("does not confirm a storage transfer that failed", async () => {
    server.use(
      http.post("*/api/uploads", () => HttpResponse.json(apiOk(ticket()))),
      http.put("https://bucket.test/pending/file", () => new HttpResponse(null, { status: 403 })),
    );
    await expect(uploadDirect(file(), target, schema, transport)).rejects.toMatchObject({
      code: "UPLOAD_TRANSFER_FAILED",
    });
  });

  it("rejects a mismatched ticket before contacting storage", async () => {
    server.use(http.post("*/api/uploads", () => HttpResponse.json(apiOk({ ...ticket(), purpose: "owner-avatar" }))));
    await expect(uploadDirect(file(), target, schema, transport)).rejects.toMatchObject({ code: "CONTRACT_MISMATCH" });
  });

  it("does not retry a permanent confirmation refusal", async () => {
    let confirms = 0;
    server.use(
      http.post("*/api/uploads", () => HttpResponse.json(apiOk(ticket()))),
      http.put("https://bucket.test/pending/file", () => new HttpResponse(null)),
      http.post(`*/api/uploads/${id}/confirm`, () => {
        confirms++;
        return HttpResponse.json(apiFail("UPLOAD_ALREADY_REJECTED"), { status: 422 });
      }),
    );
    await expect(uploadDirect(file(), target, schema, transport)).rejects.toMatchObject({
      code: "UPLOAD_ALREADY_REJECTED",
    });
    expect(confirms).toBe(1);
  });

  it("stages documents without applying them and confirms their identifiers together", async () => {
    let puts = 0;
    server.use(
      http.post("*/api/uploads", () => HttpResponse.json(apiOk({ ...ticket(), purpose: "host-document" }))),
      http.put("https://bucket.test/pending/file", () => {
        puts++;
        return new HttpResponse(null);
      }),
      http.post("*/api/uploads/documents/confirm", async ({ request }) => {
        expect(puts).toBe(1);
        expect(await request.json()).toEqual({ uploadIds: [id] });
        return HttpResponse.json(apiOk({ ...confirmed(), purpose: "host-document" }));
      }),
    );
    const staged = await stageDirectUpload(file(), { purpose: "host-document", kind: "front" }, transport);
    expect(await confirmDocumentUploads([staged.uploadId], schema, transport)).toEqual({ name: "Pipoca" });
  });
});
