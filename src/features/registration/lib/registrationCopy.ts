/**
 * Textos do cadastro (specs 011 e 012, seção Microcopy). Os textos só do anfitrião começam com `host`.
 * Erros vindos da API não ficam aqui: a frase de cada código vem de `getErrorMessage`
 * (`shared/api/errors/errorCopy.ts`).
 * Nenhum texto supõe gênero (não há campo de tratamento).
 */
export const registrationCopy = {
  pageTitle: "Criar conta · PetHost",
  hostPageTitle: "Criar conta de anfitrião · PetHost",
  choice: {
    legend: "Escolha o tipo de conta",
    owner: { label: "Tenho pet e vou viajar", description: "Conta de tutor" },
    host: {
      label: "Quero receber pets em casa",
      description: "Conta de anfitrião",
    },
    hasAccount: "Já tem conta?",
    login: "Entrar",
  },
  steps: {
    person: {
      label: "Você",
      title: "Bora se conhecer.",
      description: "Nome, contato e CPF",
      hostDescription: "Nome e contato",
      intro: "Primeiro, conta pra gente o que você quer fazer aqui.",
      hostIntro: "O CPF e os documentos ficam pra verificação, no próximo passo.",
    },
    address: {
      label: "Onde você mora",
      title: "Onde você mora",
      description: "Pra achar cantinhos perto",
      hostDescription: "Pro cadastro e a verificação",
      why: "Pra mostrar cantinhos perto de você e pro pagamento.",
      hostWhy: "Pro seu cadastro e pra verificação de quem você é.",
    },
  },
  progress: {
    label: "Criar conta",
    position: (current: number, total: number) => `Passo ${current} de ${total}`,
    pet: "Seu pet",
    petDescription: "Depois, com calma",
  },
  switchRole: {
    title: "Trocar o tipo de conta?",
    message: "Ao trocar, os dados que você preencheu aqui serão apagados. Quer continuar?",
    confirm: "Trocar de conta",
    cancel: "Continuar preenchendo",
  },
  fields: {
    fullName: "Nome completo",
    email: "E-mail",
    password: "Crie uma senha",
    hostPasswordHelp: "Se você também tem conta de tutor, esta senha é só da conta de anfitrião.",
    phone: "Celular com DDD",
    birthDate: "Nascimento",
    birthDateHelp: "Precisa ter 18 anos ou mais.",
    cpf: "CPF",
    cpfHelp: "Um CPF por pessoa. Fica protegido.",
    phoneHelp: "Só aparece pro anfitrião depois do pagamento.",
  },
  fieldErrors: {
    fullNameMissing: "Falta seu nome.",
    emailMissing: "Falta o e-mail.",
    emailInvalid: "Esse e-mail parece incompleto.",
    passwordWeak: "A senha ainda não cumpre a régua.",
    phoneInvalid: "Confere o DDD e o número.",
    birthDateMissing: "Falta quando você nasceu.",
    birthDateInvalid: "Essa data não existe.",
    birthDateFuture: "Essa data ainda não chegou.",
    underage: "Precisa ter 18 anos ou mais.",
    cpfMissing: "Falta o CPF.",
    cpfInvalid: "Esse CPF não confere. Dá uma olhada nos números.",
    zipCode: "O CEP tem 8 números.",
    street: "Falta a rua.",
    number: "Falta o número (ou S/N).",
    neighborhood: "Falta o bairro.",
    city: "Falta a cidade.",
    state: "Escolhe a UF.",
    tooLong: (max: number) => `Ficou comprido demais: vai até ${max} caracteres.`,
  },
  actions: {
    back: "Voltar",
    toAddress: "Continuar: endereço",
    submit: "Criar minha conta",
    submitting: "Criando sua conta…",
    login: "Entrar",
    countdown: (seconds: number) => `Dá pra tentar de novo em ${seconds} ${seconds === 1 ? "segundo" : "segundos"}.`,
  },
  success: {
    title: (firstName: string) => `Prazer, ${firstName}!`,
    owner: "Sua conta de tutor está pronta. Agora apresenta seu pet pra gente.",
    host: "Sua conta de anfitrião está pronta. Agora mostra quem você é: é rapidinho e protege quem deixa o pet com você.",
    addPet: "Apresentar meu pet",
    startVerification: "Começar a verificação",
    later: "Fazer isso depois",
    backToNext: "Voltar pra onde eu estava",
  },
} as const;
