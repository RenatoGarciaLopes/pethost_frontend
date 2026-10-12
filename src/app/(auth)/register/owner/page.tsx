import type { Metadata } from "next";
import { Suspense } from "react";
import { registrationCopy } from "@/features/registration";
import { RegistrationScreen } from "@/features/registration/index.server";
import { redirectIfSignedIn } from "@/shared/auth/server/redirectIfSignedIn";
import { firstParam, type SearchParams } from "@/shared/lib/url/searchParams";
import { AuthPageFallback } from "../../AuthPageFallback";

export const metadata: Metadata = { title: registrationCopy.pageTitle };

interface OwnerRegisterPageProps {
  searchParams: Promise<SearchParams>;
}

/** `/register/owner` (spec 011). Com sessão, vai direto para o destino (REQ-OREG-015). */
export default function OwnerRegisterPage({ searchParams }: OwnerRegisterPageProps) {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <OwnerRegisterGate searchParams={searchParams} />
    </Suspense>
  );
}

async function OwnerRegisterGate({ searchParams }: OwnerRegisterPageProps) {
  const next = firstParam((await searchParams).next) ?? null;
  await redirectIfSignedIn(next);
  return <RegistrationScreen next={next} />;
}
