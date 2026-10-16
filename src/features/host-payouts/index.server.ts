import "server-only";
/** API RSC e prefetch autenticado de recebimento. @example await prefetchPayoutAccount(client, user.id); */
export { HostPayoutsScreen } from "./components/server/HostPayoutsScreen";
export { prefetchPayoutAccount } from "./api/server/payoutAccount.server";
