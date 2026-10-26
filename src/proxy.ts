import { NextResponse, type NextRequest } from "next/server";
import { CURRENT_PATH_HEADER } from "@/shared/auth/contracts/requestHeaders";
import { guardRoute } from "@/shared/auth/server/routeGuard";

/**
 * Proxy do Next 16 (antigo middleware), spec 004:
 * - redirecionamento otimista das áreas logadas (regra em `shared/auth/server/routeGuard.ts`);
 * - repassa o caminho atual num cabeçalho da requisição, para os layouts montarem o `next`.
 * @example proxy(request); // Sem sessão em /users/profile, redireciona com next.
 */
export function proxy(request: NextRequest) {
  const redirect = guardRoute(request);
  if (redirect) return redirect;

  const headers = new Headers(request.headers);
  headers.set(CURRENT_PATH_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Fora do BFF (`/api`), dos arquivos do Next e dos estáticos com extensão. O ponto vai escapado duas vezes:
  // com uma só, a string vira "." e o padrão casava com toda rota terminada em letra (o proxy não rodava).
  matcher: ["/((?!api|_next/static|_next/image|brand|favicon.ico|.*\\.[a-z0-9]+$).*)"],
};
