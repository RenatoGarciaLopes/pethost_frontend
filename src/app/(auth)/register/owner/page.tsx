import type { Metadata } from "next";
import { registrationCopy } from "@/features/registration";
import type { SearchParams } from "@/shared/lib/url/searchParams";
import { RegistrationPage } from "../RegistrationPage";

export const metadata: Metadata = { title: registrationCopy.pageTitle };

/** `/register/owner` (spec 011). Com sessão, vai direto para o destino (REQ-OREG-015). */
export default function OwnerRegisterPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <RegistrationPage role="owner" searchParams={searchParams} />;
}
