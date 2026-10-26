import { GetApiV1PetsPetIdParams } from "@/shared/api/generated/pets/pets.zod";

/**
 * O segmento da URL é um id de pet possível (UUID)? Id inválido vai direto para o 404, sem chamar a API.
 * @example isPetId("thor") // false
 */
export const isPetId = (value: string): boolean => GetApiV1PetsPetIdParams.safeParse({ petId: value }).success;
