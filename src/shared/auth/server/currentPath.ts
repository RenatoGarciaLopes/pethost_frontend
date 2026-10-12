import "server-only";
import { headers } from "next/headers";
import { toSafeInternalPath } from "@/shared/lib/url/toSafeInternalPath";
import { CURRENT_PATH_HEADER } from "../contracts/requestHeaders";

/** Caminho da página atual no servidor (posto pelo `proxy.ts`); `/` quando ausente ou inseguro. */
export async function currentPath(): Promise<string> {
  return toSafeInternalPath((await headers()).get(CURRENT_PATH_HEADER), "/");
}
