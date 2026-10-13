import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { resolveSwitchTarget, switchCopy } from "@/features/auth";
import { AccountSwitchScreen } from "@/features/auth/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { firstParam, type SearchParams } from "@/shared/lib/url/searchParams";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = { title: switchCopy.pageTitle, robots: { index: false, follow: false } };

const SWITCH_PATH = "/users/switch";

interface AccountSwitchPageProps {
  searchParams: Promise<SearchParams>;
}

/**
 * `/users/switch` (spec 014). Só tutor ou anfitrião; admin vai para a casa dele (REQ-SWITCH-001).
 * O `<Suspense>` local permite aguardar a requisição, e a sessão vem do
 * `cache()` do `getSession`: confirmar o papel de novo aqui não refaz o `GET /users/me`.
 * `?to=` escolhe o destino; ausente, inválido ou igual à conta atual vira a outra conta (REQ-SWITCH-011).
 * A barreira de requisição impede que o relógio da sessão seja avaliado no prerender.
 * @example <AccountSwitchPage searchParams={Promise.resolve({ to: "host" })} />
 */
export default function AccountSwitchPage(props: AccountSwitchPageProps) {
  return (
    <Suspense fallback={<SniffLoader />}>
      <ConfirmedSwitchPage {...props} />
    </Suspense>
  );
}

async function ConfirmedSwitchPage({ searchParams }: AccountSwitchPageProps) {
  await connection();
  const user = await requireRole(["owner", "host"], SWITCH_PATH);
  const current = user.role === "host" ? "host" : "owner";
  const target = resolveSwitchTarget(current, firstParam((await searchParams).to));
  return <AccountSwitchScreen userId={user.id} current={current} target={target} />;
}
