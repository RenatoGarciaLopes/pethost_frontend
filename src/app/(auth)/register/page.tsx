import type { Metadata } from "next";
import { Suspense } from "react";
import { registrationCopy } from "@/features/registration";
import { RegisterChoiceScreen } from "@/features/registration/index.server";
import { redirectIfSignedIn } from "@/shared/auth/server/redirectIfSignedIn";
import { firstParam, type SearchParams } from "@/shared/lib/url/searchParams";
import { AuthPageFallback } from "../AuthPageFallback";

export const metadata: Metadata = { title: registrationCopy.pageTitle };

interface RegisterPageProps {
  searchParams: Promise<SearchParams>;
}

/** `/register` (REQ-OREG-001): tutor ou anfitrião. Com sessão, vai direto para o destino (REQ-OREG-015). */
export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <RegisterGate searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterGate({ searchParams }: RegisterPageProps) {
  const next = firstParam((await searchParams).next) ?? null;
  await redirectIfSignedIn(next);
  return <RegisterChoiceScreen next={next} />;
}
