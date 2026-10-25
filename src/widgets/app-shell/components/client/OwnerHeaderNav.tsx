"use client";

import { usePathname } from "next/navigation";
import { useStayUpdates } from "@/features/bookings/index.client";
import type { NavItem } from "@/shared/config/navigation";
import { HeaderNav } from "./HeaderNav";

/** Isolates query/storage updates from the header; AppHeader keys this island by account.
 * Requires QueryClientProvider. Host/visitor navigation uses HeaderNav directly.
 * @example <OwnerHeaderNav key={user.id} accountId={user.id} items={items} />
 */
export function OwnerHeaderNav({ accountId, items }: { accountId: string; items: readonly NavItem[] }) {
  const updates = useStayUpdates(accountId, usePathname() ?? "");
  return <HeaderNav items={items} stayUpdates={updates} />;
}
