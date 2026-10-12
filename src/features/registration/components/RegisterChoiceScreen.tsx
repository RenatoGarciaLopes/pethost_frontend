import { Container } from "@mui/material";
import { RegisterChoice } from "./client/RegisterChoice";

export interface RegisterChoiceScreenProps {
  next: string | null;
}

/** `/register` (REQ-OREG-001), Server Component: a página estreita e centralizada com a escolha. */
export function RegisterChoiceScreen({ next }: RegisterChoiceScreenProps) {
  return (
    <Container component="main" id="conteudo" maxWidth="sm" sx={{ py: { xs: 4, md: 10 } }}>
      <RegisterChoice next={next} />
    </Container>
  );
}
