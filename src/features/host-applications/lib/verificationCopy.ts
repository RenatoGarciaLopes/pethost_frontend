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
    progressTitle: "Verificação",
    progressLabel: "Etapas da verificação",
    stepLabels: ["Antes de começar", "Seus dados", "Fotos", "Confere"],
    stepDescriptions: [
      "Como as fotos são usadas",
      "CPF e documento",
      "Frente, verso e selfie",
      "Último olhar antes de enviar",
    ],
    position: (current: number, total: number) => `Passo ${current} de ${total}`,
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
    personTypes: {
      pf: { label: "Pessoa física", description: "Você mesmo recebe os pets." },
      pj: { label: "Empresa", description: "Hospedagem ou negócio com CNPJ." },
    },
    personTypeLocked: "O tipo fica como foi escolhido quando a verificação começou.",
    accept: "Li e concordo",
    acceptMissing: "Pra seguir, marca o “Li e concordo”.",
    back: "Voltar",
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

  status: {
    heading: "Minha verificação",
    empty: {
      title: "Mostrar quem você é",
      body: "É o primeiro passo pra receber pets: a gente confere seu documento e uma selfie. Leva uns 5 minutos.",
      start: "Começar",
    },
    draft: {
      expires: (weekday: string, date: string) =>
        `Sua verificação ficou pela metade. Ela vale até ${weekday} (${date}).`,
      continue: "Continuar de onde parei",
    },
    submitted: {
      timeline: "Andamento da verificação",
      steps: ["Enviado", "Em análise", "Aprovado"],
      wait: "A gente responde em até 2 dias úteis.",
      meanwhile: "Enquanto isso, já dá pra ir pensando nas fotos da sua casa.",
    },
    cancel: {
      open: "Desistir",
      title: "Desistir da verificação?",
      message:
        "As fotos que você mandou são apagadas. Desistir não gasta tentativa: dá pra começar de novo quando quiser.",
      confirm: "Desistir",
      keep: "Continuar a verificação",
    },
    rejected: {
      title: "Dessa vez não deu",
      todo: "Tira as fotos de novo com calma, que a gente confere outra vez.",
      attempts: (count: number) =>
        count === 1 ? "Você ainda tem 1 tentativa." : `Você ainda tem ${count} tentativas.`,
      retry: "Tentar de novo",
    },
    support: {
      title: "Agora é pelo suporte",
      blocked: "Não foi possível confirmar sua identidade. Fala com o suporte.",
      noAttempts: "Já foram 3 tentativas. Agora a gente continua pelo suporte, com calma.",
    },
    approved: {
      title: "Verificação aprovada!",
      body: "Agora é só dizer como você quer receber.",
    },
    closed: {
      expired: { title: "Sua verificação venceu", body: "Ela ficou 7 dias pela metade, e as fotos foram apagadas." },
      cancelled: { title: "Você desistiu da verificação", body: "As fotos foram apagadas." },
      free: "Isso não gasta tentativa.",
      restart: "Começar de novo",
    },
  },
} as const;

/** Nome de cada vaga de foto, para rótulos e miniaturas. */
export const documentKindLabel: Readonly<Record<DocumentKind, string>> = {
  front: "Foto da frente do documento",
  back: "Foto do verso do documento",
  selfie: "Selfie segurando o documento",
};
