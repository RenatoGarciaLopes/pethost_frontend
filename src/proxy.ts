import { NextResponse, type NextRequest } from "next/server";
import { CURRENT_PATH_HEADER } from "@/shared/auth/contracts/requestHeaders";
import { guardRoute } from "@/shared/auth/server/routeGuard";

/**
 * Proxy do Next 16 (antigo middleware), spec 004:
 * - redirecionamento otimista das áreas logadas (regra em `shared/auth/server/routeGuard.ts`);
 * - repassa o caminho atual num cabeçalho da requisição, para os layouts montarem o `next`.
 */
export function proxy(request: NextRequest) {
  const redirect = guardRoute(request);
  if (redirect) return redirect;

  const headers = new Headers(request.headers);
  headers.set(CURRENT_PATH_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Fora do BFF (`/api`), dos arquivos do Next e dos estáticos com extensão.
  matcher: ["/((?!api|_next/static|_next/image|brand|favicon.ico|.*\.[a-z0-9]+$).*)"],
};
