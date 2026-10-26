import type { Metadata } from "next";
import { Suspense } from "react";
import { passwordCopy } from "@/features/auth";
import { ForgotPasswordFlow } from "@/features/auth/index.client";
import { PasswordScreen } from "@/features/auth/index.server";
import type { AccountRole } from "@/shared/auth/contracts/session";
import { firstParam, type SearchParams } from "@/shared/lib/url/searchParams";
import { AuthPageFallback } from "../AuthPageFallback";

export const metadata: Metadata = { title: passwordCopy.forgot.pageTitle };

interface ForgotPasswordPageProps {
  searchParams: Promise<SearchParams>;
}

const ROLES: readonly AccountRole[] = ["owner", "host", "admin"];

/** `?as=` marca a conta; valor desconhecido vira tutor (REQ-PWD-001). */
function roleFrom(value: string | undefined): AccountRole {
  return ROLES.find((role) => role === value) ?? "owner";
}

/** `/forgot-password` (spec 013). Não lê sessão: funciona com ou sem conta aberta (REQ-PWD-014). */
export default function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <ForgotPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ForgotPasswordContent({ searchParams }: ForgotPasswordPageProps) {
  const role = roleFrom(firstParam((await searchParams).as));
  return (
    <PasswordScreen>
      <ForgotPasswordFlow initialRole={role} />
    </PasswordScreen>
  );
}
