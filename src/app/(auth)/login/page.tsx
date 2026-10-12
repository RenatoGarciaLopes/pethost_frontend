import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginScreen } from "@/features/auth/index.server";
import { getSession } from "@/shared/auth/server/getSession";
import { resolvePostLoginPath } from "@/shared/config/appRoutes";
import { firstParam, type SearchParams } from "@/shared/lib/url/searchParams";
import { AuthPageFallback } from "../AuthPageFallback";

export const metadata: Metadata = { title: "Entrar · PetHost" };

interface LoginPageProps {
  searchParams: Promise<SearchParams>;
}

/**
 * `/login` (spec 010). Sessão e URL são dados de requisição: com Cache Components ficam
 * dentro de `<Suspense>`. Com sessão, vai direto para o destino sem mostrar o formulário (REQ-AUTH-014).
 */
export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <LoginGate searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginGate({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = firstParam(params.next) ?? null;
  const user = await getSession();
  if (user) redirect(resolvePostLoginPath(user.role, next));

  // `?as=host` marca "Sou anfitrião" (REQ-AUTH-001).
  return (
    <LoginScreen variant="account" initialRole={firstParam(params.as) === "host" ? "host" : "owner"} next={next} />
  );
}
