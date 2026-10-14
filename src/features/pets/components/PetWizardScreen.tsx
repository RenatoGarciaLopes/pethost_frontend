import { Box, Container } from "@mui/material";
import type { PetSpecies } from "../types";
import { PetWizardProvider } from "../stores/PetWizardProvider";
import { LivePetCard } from "./client/LivePetCard";
import { PetWizard } from "./client/PetWizard";

/**
 * `/pets/new` no servidor (spec 021): o assistente à esquerda e, no computador, a carteirinha montando ao vivo
 * à direita (REQ-PNEW-013); no celular, uma coluna. Fica dentro do `<main>` da casca.
 *
 * @example <PetWizardScreen accountId={user.id} initialSpecies="dog" />
 */
export function PetWizardScreen({ accountId, initialSpecies }: { accountId: string; initialSpecies?: PetSpecies }) {
  return (
    <PetWizardProvider initialSpecies={initialSpecies}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 6 },
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(300px, 380px)" },
            alignItems: "start",
          }}
        >
          <PetWizard accountId={accountId} />
          <Box sx={{ display: { xs: "none", md: "block" }, position: "sticky", top: 24 }}>
            <LivePetCard />
          </Box>
        </Box>
      </Container>
    </PetWizardProvider>
  );
}
