import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { RegisterChoice } from "./client/RegisterChoice";

export interface RegisterChoiceScreenProps {
  next: string | null;
}

/** `/register` (REQ-OREG-001), Server Component: a página estreita e centralizada com a escolha. */
export function RegisterChoiceScreen({ next }: RegisterChoiceScreenProps) {
  return (
    <PageContainer component="main" id="conteudo" width="reading">
      <RegisterChoice next={next} />
    </PageContainer>
  );
}
