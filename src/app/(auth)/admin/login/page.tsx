import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginScreen } from "@/features/auth/index.server";
import { redirectIfSignedIn } from "@/shared/auth/server/redirectIfSignedIn";
import { firstParam, type SearchParams } from "@/shared/lib/url/searchParams";
import { AuthPageFallback } from "../../AuthPageFallback";

export const metadata: Metadata = { title: "Entrada da equipe · PetHost" };

interface AdminLoginPageProps {
  searchParams: Promise<SearchParams>;
}

/** `/admin/login` (REQ-AUTH-015): mesmo formulário, papel fixo admin, sem cadastro e sem cena. */
export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AdminLoginGate searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminLoginGate({ searchParams }: AdminLoginPageProps) {
  const next = firstParam((await searchParams).next) ?? null;
  await redirectIfSignedIn(next);

  return <LoginScreen variant="admin" initialRole="admin" next={next} />;
}
