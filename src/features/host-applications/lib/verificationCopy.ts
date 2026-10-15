import type { DocumentKind, DocumentType } from "../types";

/**
 * Textos de "Minha verificação" (spec 030), na voz da PetHost: curtos, gentis, sem culpa na recusa. Sem gênero
 * presumido de quem lê. O aviso das fotos fica por versão (`noticeVersion` da API).
 */
export const verificationCopy = {
  pageTitle: "Minha verificação",
  loading: "Buscando sua verificação",
  loadError: "Não deu pra abrir sua verificação.",

  wizard: {
    progressLabel: "Etapas da verificação",
    stepLabels: ["Antes de começar", "Seus dados", "Fotos", "Confere"],
  },

  notice: {
    heading: "Antes de começar",
    /** Aviso de uso das fotos por versão; versão sem texto aqui usa o mais recente (`latestNoticeVersion`). */
    versions: {
      "2026-10-10": [
        "As fotos servem só pra confirmar que você é você.",
        "Só a equipe da PetHost vê.",
        "A gente apaga assim que decidir.",
        "Leva uns 5 minutos.",
      ],
    } as Readonly<Record<string, readonly string[]>>,
    latestNoticeVersion: "2026-10-10",
    personType: "Quem vai receber os pets?",
    personTypes: { pf: "Pessoa física", pj: "Empresa" },
    personTypeLocked: "O tipo fica como foi escolhido quando a verificação começou.",
    accept: "Li e concordo",
    acceptMissing: "Pra seguir, marca o “Li e concordo”.",
    next: "Continuar: seus dados",
  },

  data: {
    heading: "Seus dados",
    cpf: "CPF",
    cpfHelp: { pf: "O seu CPF.", pj: "O CPF de quem representa a empresa: você." },
    cpfMissing: "Falta o CPF.",
    cpfInvalid: "Esse CPF não confere. Dá uma olhada nos números.",
    documentType: "Qual documento você vai fotografar?",
    documentTypeMissing: "Escolhe o documento.",
    documentTypes: {
      rg: { label: "RG", description: "A carteira de identidade." },
      cnh: { label: "CNH", description: "A carteira de motorista." },
      cin: { label: "CIN", description: "A nova carteira de identidade, com o CPF." },
    } satisfies Record<DocumentType, { label: string; description: string }>,
    company: {
      heading: "Dados da empresa",
      cnpj: "CNPJ",
      cnpjHelp: "Pode ter letras, como no CNPJ novo.",
      cnpjMissing: "Falta o CNPJ.",
      cnpjInvalid: "Esse CNPJ não confere. Dá uma olhada nos números e nas letras.",
      legalName: "Razão social",
      legalNameMissing: "Falta a razão social.",
      tradeName: "Nome fantasia",
      tradeNameHelp: "É o nome que os tutores vão ver.",
      tradeNameMissing: "Falta o nome fantasia.",
      address: "Endereço da empresa",
      addressErrors: {
        zipCode: "O CEP tem 8 números.",
        street: "Falta a rua.",
        number: "Falta o número (ou S/N).",
        neighborhood: "Falta o bairro.",
        city: "Falta a cidade.",
        state: "Escolhe a UF.",
        tooLong: (max: number) => `Ficou comprido demais: vai até ${max} caracteres.`,
      },
    },
    back: "Voltar",
    next: "Continuar: fotos",
    saving: "Salvando seus dados…",
  },
} as const;

/** Nome de cada vaga de foto, para rótulos e miniaturas. */
export const documentKindLabel: Readonly<Record<DocumentKind, string>> = {
  front: "Foto da frente do documento",
  back: "Foto do verso do documento",
  selfie: "Selfie segurando o documento",
};
