import type { Metadata } from "next";
import { registrationCopy } from "@/features/registration";
import type { SearchParams } from "@/shared/lib/url/searchParams";
import { RegistrationPage } from "../RegistrationPage";

export const metadata: Metadata = { title: registrationCopy.hostPageTitle };

/** `/register/host` (spec 012). Com sessão, vai direto para o destino (REQ-HREG-009). */
export default function HostRegisterPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <RegistrationPage role="host" searchParams={searchParams} />;
}
