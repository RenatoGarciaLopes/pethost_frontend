"use client";
import { useMutation } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import { PostApiV1UsersMePasswordBody } from "@/shared/api/generated/users/users.zod";
import { sessionResultSchema } from "@/shared/auth/contracts/session";
import type { PasswordChangeValues } from "../schemas/passwordChangeSchema";
/** Recebe sessão do BFF após trocar senha; mantém queries e navegação intactas. @example useChangePasswordMutation().mutate({ currentPassword: "antiga", newPassword: "Abcdef1!" }); */
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (values: PasswordChangeValues) =>
      bffClient.request(
        { method: "POST", path: "/users/me/password", body: PostApiV1UsersMePasswordBody.parse(values) },
        sessionResultSchema,
      ),
  });
}
