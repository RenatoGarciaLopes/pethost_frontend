import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { GetApiV1PetsMeResponse, GetApiV1PetsPetIdResponse } from "@/shared/api/generated/pets/pets.zod";
import { GetApiV1HostsHostIdPetsResponse } from "@/shared/api/generated/host-pets/host-pets.zod";

/** Espécies que a API aceita (`modulo-pets.md`); o resto é `exotic` com descrição. */
export const PET_SPECIES = [
  "dog",
  "cat",
  "cockatiel",
  "parrot",
  "parakeet",
  "canary",
  "rabbit",
  "hamster",
  "guinea_pig",
  "fish",
  "turtle",
  "exotic",
] as const;

/** A API aceita maiúsculas na entrada; a leitura normaliza antes de estreitar. */
const lowercaseEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((value) => (typeof value === "string" ? value.toLowerCase() : value), z.enum(values));

/** O OpenAPI descreve como texto livre; aqui só passam os valores documentados. */
export const petSpeciesSchema = lowercaseEnum([...PET_SPECIES]);
export const petSizeSchema = lowercaseEnum(["small", "medium", "large"]);
export const petSexSchema = lowercaseEnum(["male", "female", "unknown"]);

/** Um pet como a API manda, com espécie, porte e sexo estreitados. Valor desconhecido = `CONTRACT_MISMATCH`. */
export const petDtoSchema = unwrapData(GetApiV1PetsPetIdResponse).extend({
  species: petSpeciesSchema,
  size: petSizeSchema.nullish(),
  sex: petSexSchema,
});

/**
 * `GET /pets/me` (REQ-PETS-001): o dono uma vez e os pets, do mais novo para o mais antigo.
 * @example myPetsSchema.parse({ keeper, pets: [] })
 */
export const myPetsSchema = unwrapData(GetApiV1PetsMeResponse).extend({ pets: z.array(petDtoSchema) });

/** Contrato gerado da vitrine, com enums estreitados. Nunca cachear o DTO privado. @example hostPetsSchema.parse(dto) */
export const hostPetsSchema = unwrapData(GetApiV1HostsHostIdPetsResponse).extend({ pets: z.array(petDtoSchema) });
/** DTO da API, anterior ao descarte dos campos privados. @example const dto: HostPetsResponse = hostPetsSchema.parse(data); */
export type HostPetsResponse = z.output<typeof hostPetsSchema>;

export type PetDto = z.output<typeof petDtoSchema>;
export type MyPetsDto = z.output<typeof myPetsSchema>;
