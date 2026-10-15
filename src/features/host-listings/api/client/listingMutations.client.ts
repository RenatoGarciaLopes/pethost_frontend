import { bffClient } from "@/shared/api/client/bffClient";
import { withSessionRetry } from "@/shared/api/client/withSessionRetry";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { listingDtoSchema, type ListingDto } from "../contracts";
import type { CreateListingRequest, UpdateListingRequest } from "../mappers";

const listingPath = (listingId: string) => `/listings/${encodeURIComponent(listingId)}`;
const photoPath = (listingId: string, photoId: string) =>
  `${listingPath(listingId)}/photos/${encodeURIComponent(photoId)}`;

/** Monta o multipart na hora (no 401, o reenvio monta de novo a partir do `File` da memória). */
function sendPhoto(path: string, method: "POST" | "PATCH", file: File, transport: HttpTransport) {
  return withSessionRetry(() => {
    const body = new FormData();
    body.append("file", file);
    return transport.request({ method, path, body }, listingDtoSchema);
  }, transport);
}

/**
 * Cadastra o cantinho, já ativo, num pedido só (REQ-LIST-011). Não repete sozinho.
 * @example await createListing(toCreateListingRequest(values));
 */
export function createListing(body: CreateListingRequest, transport: HttpTransport = bffClient): Promise<ListingDto> {
  return transport.request({ method: "POST", path: "/listings", body }, listingDtoSchema);
}

/**
 * Salva só o que mudou (REQ-LIST-013).
 * @example await updateListing(id, toUpdateListingRequest(original, edited));
 */
export function updateListing(
  listingId: string,
  body: UpdateListingRequest,
  transport: HttpTransport = bffClient,
): Promise<ListingDto> {
  return transport.request({ method: "PATCH", path: listingPath(listingId), body }, listingDtoSchema);
}

/**
 * Pausa o cantinho: sai da busca até reabrir (REQ-LIST-015). Idempotente.
 * @example await deactivateListing(id);
 */
export function deactivateListing(listingId: string, transport: HttpTransport = bffClient): Promise<ListingDto> {
  return transport.request({ method: "POST", path: `${listingPath(listingId)}/deactivation` }, listingDtoSchema);
}

/**
 * Reabre o cantinho pausado. Idempotente.
 * @example await reactivateListing(id);
 */
export function reactivateListing(listingId: string, transport: HttpTransport = bffClient): Promise<ListingDto> {
  return transport.request({ method: "DELETE", path: `${listingPath(listingId)}/deactivation` }, listingDtoSchema);
}

/**
 * Põe uma foto no fim (REQ-LIST-014).
 * @example await addListingPhoto(id, file);
 */
export function addListingPhoto(listingId: string, file: File, transport: HttpTransport = bffClient) {
  return sendPhoto(`${listingPath(listingId)}/photos`, "POST", file, transport);
}

/**
 * Troca a foto na mesma posição.
 * @example await replaceListingPhoto(id, photoId, file);
 */
export function replaceListingPhoto(
  listingId: string,
  photoId: string,
  file: File,
  transport: HttpTransport = bffClient,
) {
  return sendPhoto(photoPath(listingId, photoId), "PATCH", file, transport);
}

/**
 * Tira a foto; as de trás sobem uma posição.
 * @example await removeListingPhoto(id, photoId);
 */
export function removeListingPhoto(listingId: string, photoId: string, transport: HttpTransport = bffClient) {
  return transport.request({ method: "DELETE", path: photoPath(listingId, photoId) }, listingDtoSchema);
}

/**
 * Nova ordem das fotos (todas, cada uma uma vez); a primeira vira a capa.
 * @example await reorderListingPhotos(id, [capaId, outraId]);
 */
export function reorderListingPhotos(
  listingId: string,
  photoIds: readonly string[],
  transport: HttpTransport = bffClient,
): Promise<ListingDto> {
  return transport.request(
    { method: "PUT", path: `${listingPath(listingId)}/photos/order`, body: { photoIds } },
    listingDtoSchema,
  );
}
