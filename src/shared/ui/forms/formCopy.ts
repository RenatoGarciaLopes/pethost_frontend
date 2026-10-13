/** Generic UI labels only; domain microcopy must be supplied by callers. */
export const formCopy = {
  showPassword: "Mostrar",
  hidePassword: "Esconder",
  passwordRequirements: "Requisitos da senha",
  /** As cinco regras da senha forte da API, iguais em toda tela que cria senha (`PasswordStrengthChecklist`). */
  passwordRules: {
    length: "8 caracteres ou mais",
    uppercase: "uma letra maiúscula",
    lowercase: "uma letra minúscula",
    digit: "um número",
    special: "um símbolo (como ! ou #)",
  },
  met: "Atendido:",
  missing: "Falta:",
  decrease: "Diminuir",
  increase: "Aumentar",
  datePlaceholder: "dd/mm/aaaa",
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
