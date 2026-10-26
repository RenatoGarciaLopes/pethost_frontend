import { Container } from "@mui/material";
import type { PetSpecies } from "../types";
import { PetWizardProvider } from "../stores/PetWizardProvider";
import { PetWizard } from "./client/PetWizard";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { KeeperPendingNotice } from "./client/KeeperPendingNotice";

/**
 * `/pets/new` no servidor: provider e Container do assistente. StepForm compõe a mesma StepWizard do cadastro,
 * com carteirinha no aside em lg (REQ-PNEW-013); no celular, ela aparece na revisão. Fica no `<main>` da casca.
 *
 * @example <PetWizardScreen accountId={user.id} initialSpecies="dog" />
 */
export function PetWizardScreen({
  accountId,
  initialSpecies,
  role = "owner",
  keeperPending = false,
}: {
  accountId: string;
  initialSpecies?: PetSpecies;
  role?: PersonalRole;
  keeperPending?: boolean;
}) {
  if (role === "host" && keeperPending)
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
        <KeeperPendingNotice />
      </Container>
    );
  return (
    <PetWizardProvider initialSpecies={initialSpecies}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
        <PetWizard accountId={accountId} role={role} />
      </Container>
    </PetWizardProvider>
  );
}
