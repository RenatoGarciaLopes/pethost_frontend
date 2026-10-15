import { Container } from "@mui/material";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { prefetchMyApplication } from "../api/server/myApplication.server";
import { wizardRedirect } from "../lib/wizardRedirect";
import type { WizardEntry } from "../types";
import { ApplicationWizard } from "./client/ApplicationWizard/ApplicationWizard";

interface ApplicationWizardScreenProps {
  accountId: string;
  entry: WizardEntry;
}

/**
 * `/host/application/new` e `/documents` no servidor (spec 030): busca a verificação antes de responder, manda para
 * o lugar certo pelo estado do servidor (`wizardRedirect`) e entrega o cache hidratado. Falha na busca deixa o
 * assistente mostrar o erro com "Tentar de novo".
 *
 * @example <ApplicationWizardScreen accountId={user.id} entry="start" />
 */
export async function ApplicationWizardScreen({ accountId, entry }: ApplicationWizardScreenProps) {
  const queryClient = getQueryClient();
  const mine = await prefetchMyApplication(queryClient, accountId);
  const target = mine && wizardRedirect(entry, mine);
  if (target) redirect(target);
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ApplicationWizard accountId={accountId} entry={entry} />
      </HydrationBoundary>
    </Container>
  );
}
