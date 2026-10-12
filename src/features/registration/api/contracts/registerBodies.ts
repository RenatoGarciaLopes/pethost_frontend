import type { z } from "zod";
import type { PostApiV1OwnersRegisterBody } from "@/shared/api/generated/owners/owners.zod";
import type { PostApiV1UsersRegisterBody } from "@/shared/api/generated/users/users.zod";

/** Corpo de `POST /owners/register` como o OpenAPI descreve (`modulo-owners.md` seção 3.2). */
export type OwnerRegisterBody = z.input<typeof PostApiV1OwnersRegisterBody>;

/** Corpo de `POST /users/register` (anfitrião, `modulo-auth.md` seção 2.7): sem CPF e sem papel. */
export type HostRegisterBody = z.input<typeof PostApiV1UsersRegisterBody>;

/** Corpo de qualquer cadastro de pessoa. */
export type RegisterBody = OwnerRegisterBody | HostRegisterBody;
