/**
 * Textos do cadastro (spec 011, seção Microcopy). Erros vindos da API não ficam aqui:
 * a frase de cada código vem de `getErrorMessage` (`shared/api/errors/errorCopy.ts`).
 * Nenhum texto supõe gênero (não há campo de tratamento).
 */
export const registrationCopy = {
  pageTitle: "Criar conta · PetHost",
  choice: {
    title: "Como você vai usar o PetHost?",
    legend: "Escolha o tipo de conta",
    owner: { label: "Tenho pet e vou viajar", description: "Conta de tutor: acha um cantinho e acompanha a estadia." },
    host: {
      label: "Quero receber pets em casa",
      description: "Conta de anfitrião: abre o seu cantinho depois da verificação.",
    },
    continue: "Continuar",
    continueAs: { owner: "Continuar como tutor", host: "Continuar como anfitrião" },
    pickFirst: "Escolhe uma das duas pra continuar.",
    hasAccount: "Já tem conta?",
    login: "Entrar",
  },
  steps: {
    person: { label: "Você", title: "Primeiro, você" },
    address: {
      label: "Onde você mora",
      title: "Onde você mora",
      why: "Pra mostrar cantinhos perto de você e pro pagamento.",
    },
  },
  fields: {
    fullName: "Seu nome completo",
    email: "E-mail",
    password: "Crie uma senha",
    phone: "Celular com DDD",
    birthDate: "Quando você nasceu?",
    birthDateHelp: "O PetHost é pra quem tem 18 anos ou mais.",
    cpf: "CPF",
    cpfHelp: "Pra identificar quem paga. Não aparece pra ninguém.",
  },
  passwordRules: {
    length: "8 caracteres ou mais",
    uppercase: "uma letra maiúscula",
    lowercase: "uma letra minúscula",
    digit: "um número",
    special: "um símbolo (como ! ou #)",
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
  dataUse: {
    title: "O que a gente faz com cada dado",
    items: [
      { field: "Nome e celular", use: "Pro anfitrião saber com quem está falando." },
      { field: "CPF", use: "Pra identificar quem paga. Não aparece pra ninguém." },
      { field: "Endereço", use: "Pra mostrar cantinhos perto de você e pro pagamento." },
      { field: "Senha", use: "Guardada embaralhada. Nem a gente consegue ler." },
    ],
  },
  success: {
    title: (firstName: string) => `Prazer, ${firstName}!`,
    owner: "Sua conta de tutor está pronta. Agora apresenta seu pet pra gente.",
    addPet: "Apresentar meu pet",
    later: "Fazer isso depois",
    backToNext: "Voltar pra onde eu estava",
  },
} as const;
