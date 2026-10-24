/** Generic UI labels only; domain microcopy must be supplied by callers. */
export const formCopy = {
  showPassword: "Mostrar",
  hidePassword: "Esconder",
  passwordRequirements: "Requisitos da senha",
  /** As cinco regras da senha forte da API, iguais em toda tela que cria senha (`PasswordStrengthChecklist`). */
  passwordRules: {
    length: "8 caracteres ou mais",
    uppercase: "Letra maiúscula",
    lowercase: "Letra minúscula",
    digit: "Número",
    special: "Um símbolo (! @ # ...)",
  },
  met: "Atendido:",
  missing: "Falta:",
  decrease: "Diminuir",
  increase: "Aumentar",
  datePlaceholder: "dd/mm/aaaa",
  /** Dias da semana (`WeekdayPicker`), de segunda a domingo, com a chave da API. */
  weekdays: {
    monday: "Segunda",
    tuesday: "Terça",
    wednesday: "Quarta",
    thursday: "Quinta",
    friday: "Sexta",
    saturday: "Sábado",
    sunday: "Domingo",
  },
  allWeekdays: "Todos os dias",
  /** Endereço brasileiro (`AddressFields`): rótulos genéricos, iguais em qualquer tela. */
  address: {
    zipCode: "CEP",
    street: "Rua",
    number: "Número",
    numberHelp: "Sem número? Escreve S/N.",
    complement: "Complemento (opcional)",
    neighborhood: "Bairro",
    city: "Cidade",
    state: "UF",
    statePlaceholder: "Escolha",
    searching: "Buscando o endereço desse CEP…",
    notFound: "Não achamos esse CEP. Preenche o endereço que a gente segue.",
  },
};
