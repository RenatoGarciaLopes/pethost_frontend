import { z } from "zod";
import { bffClient } from "./bffClient";
import { withSessionRetry } from "./withSessionRetry";
import { ApiError, isApiError } from "../errors/ApiError";
import type { HttpTransport } from "../transport/HttpTransport";
import { unwrapData } from "../contracts/unwrapData";
import {
  PostApiV1UploadsResponse,
  PostApiV1UploadsUploadIdConfirmResponse,
  PostApiV1UploadsDocumentsConfirmResponse,
} from "../generated/uploads/uploads.zod";

/** Existing backend purposes; the browser never selects a bucket key or final URL. */
interface UploadTarget {
  purpose: "owner-avatar" | "host-avatar" | "pet-photo" | "listing-photo" | "chat-photo" | "host-document";
  resourceId?: string;
  photoId?: string;
  kind?: "front" | "back" | "selfie";
}

const ticketSchema = unwrapData(PostApiV1UploadsResponse).extend({
  uploadUrl: z
    .string()
    .url()
    .refine((value) => {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && !url.hash;
    }),
  method: z.literal("PUT"),
  headers: z.object({ "Content-Type": z.enum(["image/jpeg", "image/png", "image/webp"]) }).strict(),
  sizeBytes: z.number().int().positive(),
});

/**
 * Authorize through the BFF, PUT the File directly to storage, then confirm the same upload ID.
 * Only confirmation is retried after ambiguous errors; credentials/cookies never go to the bucket.
 * The result schema may transform a DTO into the consumer's model.
 * @example await uploadDirect(file, { purpose: "pet-photo", resourceId: id }, petDtoSchema);
 */
export async function stageDirectUpload(file: File, target: UploadTarget, transport: HttpTransport = bffClient) {
  const contentType =
    file.type ||
    ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as Record<string, string>)[
      file.name.split(".").at(-1)?.toLowerCase() ?? ""
    ] ||
    "application/octet-stream";
  const ticket = await withSessionRetry(
    () =>
      transport.request(
        { method: "POST", path: "/uploads", body: { ...target, contentType, sizeBytes: file.size } },
        ticketSchema,
      ),
    transport,
  );
  if (
    ticket.purpose !== target.purpose ||
    ticket.sizeBytes !== file.size ||
    ticket.headers["Content-Type"] !== contentType
  )
    throw new ApiError({
      status: 0,
      code: "CONTRACT_MISMATCH",
      message: "Upload ticket does not match the selected file",
    });

  let put: Response;
  try {
    put = await fetch(ticket.uploadUrl, {
      method: "PUT",
      headers: ticket.headers,
      body: file,
      credentials: "omit",
      redirect: "error",
    });
  } catch (cause) {
    throw new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Storage upload failed", cause });
  }
  if (!put.ok)
    throw new ApiError({ status: put.status, code: "UPLOAD_TRANSFER_FAILED", message: "Storage refused the upload" });

  return ticket;
}

/** Sends one image directly and confirms it; retries never create a second ticket or PUT. */
export async function uploadDirect<TSchema extends z.ZodTypeAny>(
  file: File,
  target: UploadTarget,
  resultSchema: TSchema,
  transport: HttpTransport = bffClient,
  caption?: string,
): Promise<z.output<TSchema>> {
  const ticket = await stageDirectUpload(file, target, transport);
  const confirmationSchema = unwrapData(PostApiV1UploadsUploadIdConfirmResponse).extend({
    uploadId: z.literal(ticket.uploadId),
    purpose: z.literal(target.purpose),
    status: z.literal("completed"),
    result: resultSchema,
  });
  const confirmed = await confirmWithRetry(
    () =>
      transport.request(
        { method: "POST", path: `/uploads/${ticket.uploadId}/confirm`, body: caption ? { body: caption } : {} },
        confirmationSchema,
      ),
    transport,
  );
  return confirmed.result;
}

/** Confirms document slots together so a rejected slot cannot leave a partially replaced set. */
export async function confirmDocumentUploads<TSchema extends z.ZodTypeAny>(
  uploadIds: string[],
  resultSchema: TSchema,
  transport: HttpTransport = bffClient,
): Promise<z.output<TSchema>> {
  const schema = unwrapData(PostApiV1UploadsDocumentsConfirmResponse).extend({
    status: z.literal("completed"),
    purpose: z.literal("host-document"),
    result: resultSchema,
  });
  const confirmed = await confirmWithRetry(
    () => transport.request({ method: "POST", path: "/uploads/documents/confirm", body: { uploadIds } }, schema),
    transport,
  );
  return confirmed.result;
}

async function confirmWithRetry<T>(send: () => Promise<T>, transport: HttpTransport): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await withSessionRetry(send, transport);
    } catch (error) {
      if (
        attempt >= 2 ||
        !isApiError(error) ||
        !(error.status === 0 || error.status >= 500 || error.code === "UPLOAD_CONFIRMATION_CONFLICT")
      )
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
}
