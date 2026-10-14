import type { z } from "zod";
import { bffClient } from "@/shared/api/client/bffClient";
import { withSessionRetry } from "@/shared/api/client/withSessionRetry";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { PostApiV1PetsBody } from "@/shared/api/generated/pets/pets.zod";
import { petDtoSchema, type PetDto } from "../contracts";
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
