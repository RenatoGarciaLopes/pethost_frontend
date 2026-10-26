import type { z } from "zod";
import { bffClient } from "@/shared/api/client/bffClient";
import { withSessionRetry } from "@/shared/api/client/withSessionRetry";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { PostApiV1PetsBody } from "@/shared/api/generated/pets/pets.zod";
import { petDtoSchema, type PetDto } from "../contracts";
import type { toUpdatePetRequest } from "../toUpdatePetRequest";
/** Cria ficha sem fotos; não repete criação automaticamente. @example await createPet(toCreatePetRequest(values)); */
export function createPet(
  body: z.input<typeof PostApiV1PetsBody>,
  transport: HttpTransport = bffClient,
): Promise<PetDto> {
  return transport.request({ method: "POST", path: "/pets", body: PostApiV1PetsBody.parse(body) }, petDtoSchema);
}
/** Envia uma foto na parte file, renovando sessão uma vez se necessário. @example await uploadPetPhoto(pet.id, file); */
export function uploadPetPhoto(petId: string, file: File, transport: HttpTransport = bffClient): Promise<PetDto> {
  return withSessionRetry(() => {
    const body = new FormData();
    body.append("file", file);
    return transport.request({ method: "POST", path: `/pets/${encodeURIComponent(petId)}/photos`, body }, petDtoSchema);
  }, transport);
}

/** Atualiza campos alterados da ficha. @example await updatePet(id, body); */
export function updatePet(
  petId: string,
  body: ReturnType<typeof toUpdatePetRequest>,
  transport: HttpTransport = bffClient,
): Promise<PetDto> {
  return transport.request({ method: "PATCH", path: `/pets/${encodeURIComponent(petId)}`, body }, petDtoSchema);
}
/** Retira da lista preservando histórico. @example await deactivatePet(id); */
export function deactivatePet(petId: string, transport: HttpTransport = bffClient): Promise<PetDto> {
  return transport.request({ method: "POST", path: `/pets/${encodeURIComponent(petId)}/deactivation` }, petDtoSchema);
}
/** Devolve à lista. @example await reactivatePet(id); */
export function reactivatePet(petId: string, transport: HttpTransport = bffClient): Promise<PetDto> {
  return transport.request({ method: "DELETE", path: `/pets/${encodeURIComponent(petId)}/deactivation` }, petDtoSchema);
}
/** Substitui foto na mesma vaga com renovação única. @example await replacePetPhoto(id, photoId, file); */
export function replacePetPhoto(
  petId: string,
  photoId: string,
  file: File,
  transport: HttpTransport = bffClient,
): Promise<PetDto> {
  return withSessionRetry(() => {
    const body = new FormData();
    body.append("file", file);
    return transport.request(
      { method: "PATCH", path: `/pets/${encodeURIComponent(petId)}/photos/${encodeURIComponent(photoId)}`, body },
      petDtoSchema,
    );
  }, transport);
}
/** Remove foto. @example await removePetPhoto(id, photoId); */
export function removePetPhoto(petId: string, photoId: string, transport: HttpTransport = bffClient): Promise<PetDto> {
  return transport.request(
    { method: "DELETE", path: `/pets/${encodeURIComponent(petId)}/photos/${encodeURIComponent(photoId)}` },
    petDtoSchema,
  );
}
