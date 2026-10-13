import type { Metadata } from "next";
import { Suspense } from "react";
import { resolveSwitchTarget, switchCopy } from "@/features/auth";
import { AccountSwitchScreen } from "@/features/auth/index.server";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { firstParam, type SearchParams } from "@/shared/lib/url/searchParams";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = { title: switchCopy.pageTitle, robots: { index: false, follow: false } };

const SWITCH_PATH = "/users/switch";

interface AccountSwitchPageProps {
  searchParams: Promise<SearchParams>;
}

/**
 * `/users/switch` (spec 014). Só tutor ou anfitrião; admin vai para a casa dele (REQ-SWITCH-001).
 * O `<Suspense>` local cobre a leitura da sessão (`requirePersonalUser`, que espera a requisição e reusa o
 * `cache()` do `getSession`, sem segundo `GET /users/me`).
 * `?to=` escolhe o destino; ausente, inválido ou igual à conta atual vira a outra conta (REQ-SWITCH-011).
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
  const user = await requirePersonalUser(SWITCH_PATH);
  const target = resolveSwitchTarget(user.role, firstParam((await searchParams).to));
  return <AccountSwitchScreen userId={user.id} current={user.role} target={target} />;
}
