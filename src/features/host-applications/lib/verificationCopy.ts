import type { DocumentKind, DocumentType } from "../types";

/**
 * Textos de "Minha verificação" (spec 030), na voz da PetHost: curtos, gentis, sem culpa na recusa. Sem gênero
 * presumido de quem lê. O aviso das fotos fica por versão (`noticeVersion` da API).
 */
export const verificationCopy = {
  pageTitles: {
    status: "Minha verificação · PetHost",
    start: "Começar a verificação · PetHost",
    documents: "Fotos da verificação · PetHost",
  },
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

  photos: {
    heading: "Fotos do documento",
    intro: "Três fotos: a frente, o verso e você segurando o documento.",
    tipsTitle: "Pra foto sair boa",
    tips: "De dia, perto da janela, sem flash, o documento inteiro na foto.",
    hints: {
      front: "O documento inteiro, com a sua foto aparecendo.",
      back: "O verso inteiro, sem dedo na frente.",
      selfie: "Seu rosto e o documento na mão, os dois aparecendo.",
    } satisfies Record<DocumentKind, string>,
    errors: {
      IMAGE_UNREADABLE: "Não deu pra abrir essa foto. Tira outra ou escolhe uma em JPG, PNG ou WebP.",
      IMAGE_TOO_LARGE: "Essa foto ficou grande demais. Tira outra com menos zoom.",
      rejected: "Essa foto não deu certo. Tira outra, de dia e sem flash.",
      tooLarge: "As fotos ficaram grandes demais juntas. Tira de novo com menos zoom.",
    },
    missingShort: { front: "a frente", back: "o verso", selfie: "a selfie" } satisfies Record<DocumentKind, string>,
    missing: (items: string) => `Falta ${items}.`,
    sending: "Enviando as fotos…",
    back: "Voltar",
    next: "Continuar: confere",
  },

  review: {
    heading: "Confere e envia",
    intro: "Dá uma olhada antes de mandar. Depois de enviada, a verificação não muda mais.",
    photos: "Fotos",
    sentPhoto: (label: string) => `${label}: enviada ✓`,
    cpf: "CPF",
    documentType: "Documento",
    company: "Empresa",
    missing: "Pra enviar, faltam fotos. Volta e completa as três vagas.",
    back: "Voltar: fotos",
    submit: "Enviar pra análise",
    submitting: "Enviando…",
    sent: "Pronto, enviada! Agora é com a gente.",
  },
} as const;

/** Nome de cada vaga de foto, para rótulos e miniaturas. */
export const documentKindLabel: Readonly<Record<DocumentKind, string>> = {
  front: "Foto da frente do documento",
  back: "Foto do verso do documento",
  selfie: "Selfie segurando o documento",
};
