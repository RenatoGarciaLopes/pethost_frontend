import type { z } from "zod";
import type { PostApiV1OwnersRegisterBody } from "@/shared/api/generated/owners/owners.zod";

/** Corpo de `POST /owners/register` como o OpenAPI descreve (`modulo-owners.md` seção 3.2). */
export type OwnerRegisterBody = z.input<typeof PostApiV1OwnersRegisterBody>;
