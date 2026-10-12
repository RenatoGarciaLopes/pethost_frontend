import { Suspense } from "react";
import { RegistrationScreen } from "@/features/registration/index.server";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { redirectIfSignedIn } from "@/shared/auth/server/redirectIfSignedIn";
import { firstParam, type SearchParams } from "@/shared/lib/url/searchParams";
import { AuthPageFallback } from "../AuthPageFallback";

interface RegistrationPageProps {
  role: PersonalRole;
  searchParams: Promise<SearchParams>;
}

/**
 * Corpo das páginas `/register/owner` e `/register/host`: com sessão, vai direto para o destino
 * (REQ-OREG-015, REQ-HREG-009); sem sessão, o formulário da variante. Os dados da requisição ficam
 * dentro do `<Suspense>` (Cache Components).
 *
 * @example export default function Page({ searchParams }) { return <RegistrationPage role="host" searchParams={searchParams} /> }
 */
export function RegistrationPage(props: RegistrationPageProps) {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <RegistrationGate {...props} />
    </Suspense>
  );
}

async function RegistrationGate({ role, searchParams }: RegistrationPageProps) {
  const next = firstParam((await searchParams).next) ?? null;
  await redirectIfSignedIn(next);
  return <RegistrationScreen role={role} next={next} />;
}
