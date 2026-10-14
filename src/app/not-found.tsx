import { Box, Button } from "@mui/material";
import { connection } from "next/server";
import { Suspense } from "react";
import { getSession } from "@/shared/auth/server/getSession";
import { homeOf } from "@/shared/config/appRoutes";
import { appShellCopy } from "@/shared/config/appShellCopy";
import { TurmaDog } from "@/shared/ui/brand/TurmaWalker";
import { EmptyState } from "@/shared/ui/feedback/EmptyState";
/** Página 404 (REQ-SHELL-014): só a leitura de sessão depende da requisição, dentro de Suspense.
 * O status HTTP é responsabilidade do App Router; a página não redireciona.
 * @example <NotFound /> // App Router a seleciona para caminhos inexistentes
 */
export default function NotFound() {
  return (
    <Suspense fallback={<NotFoundContent home="/" />}>
      <NotFoundWithSession />
    </Suspense>
  );
}
async function NotFoundWithSession() {
  await connection();
  const user = await getSession().catch(() => null);
  return <NotFoundContent home={user ? homeOf(user.role) : "/"} />;
}
function NotFoundContent({ home }: { home: string }) {
  return (
    <Box component="main" id="conteudo" sx={{ minHeight: "60dvh", display: "grid", placeItems: "center" }}>
      <EmptyState
        headingComponent="h1"
        title={appShellCopy.notFound.title}
        description={appShellCopy.notFound.description}
        illustration={
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TurmaDog member="corgi" height={96} still />
          </Box>
        }
        action={
          <Button href={home} variant="contained">
            {appShellCopy.notFound.home}
          </Button>
        }
      />
    </Box>
  );
}
