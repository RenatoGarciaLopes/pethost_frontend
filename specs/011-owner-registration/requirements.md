---
spec: 011-owner-registration
status: draft
updated: 2026-10-11
area: OREG
---

# 011 · Criar conta de tutor

## Contexto

Quem chega aqui já quer algo: puxar conversa com um anfitrião, pedir estadia ou apresentar o pet ([[20-conta-e-entrada]], "pedir conta o mais tarde possível"). O medo é de formulário longo e de entregar dado demais (CPF) sem saber por quê. A tela resolve com dois passos curtos ("Você" e "Onde você mora"), o CEP que preenche o endereço, a régua de senha viva e a explicação de cada dado sensível no próprio campo. No fim, uma comemoração curta e o convite para apresentar o pet.

A spec também cria a porta de entrada `/register` (escolha entre tutor e anfitrião) e a base de formulário de conta que a 012 reaproveita.

## Referências

- **Design:**
  - canvas → board `Fluxo-Conta` (computador e celular) → telas "Criar conta 1/2", "Criar conta 2/2" e "Conta criada";
  - vault: `design/20-conta-e-entrada.md` (seção "Criar conta"), `design/17-cadastros-e-formularios.md` (12 regras de mecânica), `design/02-orcamento-de-personalidade.md` (zero enfeite no formulário, momento só no fim), `design/08-acessibilidade.md`.
- **API:**
  - ✅ `POST /api/v1/owners/register` `{ fullName, email, password, phone, birthDate, cpf, address: { zipCode, street, number, complement, neighborhood, city, state } }` → `201` com `{ accessToken, refreshToken, expiresAt, owner }` (o `user` vem **dentro** de `owner`);
  - erros: `400 VALIDATION_ERROR` (todos os campos de uma vez, endereço como `address.<campo>`), `409 AUTH_EMAIL_ALREADY_REGISTERED`, `409 OWNER_CPF_ALREADY_REGISTERED`, `429 TOO_MANY_REQUESTS` (política `registration`);
  - regras: `pethost_backend/docs/modulo-auth.md` seção 5.1 (value objects) e `modulo-owners.md` seções 1, 3.2 e 4;
  - externa: ViaCEP (`https://viacep.com.br/ws/<cep>/json/`) só para sugerir o endereço; a API não confere se o CEP existe.
- **Depende de:** 002 (`ChoiceCardGroup`, `WizardProgress`, `PasswordField`, `PasswordStrengthChecklist`, `MaskedTextField`, `FormActions`, `Notice`, `Hint`, `Celebration`, `shared/lib/masks`), 003 (handler `POST /api/owners/register`, `applyFieldErrors`, `getErrorMessage`), 004 (`resolvePostLoginPath`, layout `(auth)`), 010 (`useCountdown`).
- **Usada por:** 012 (mesma base de formulário), 015 (`AddressFields`, validações), 030 (`isValidCpf`).

## Histórias

- Como pessoa que vai viajar, quero criar a conta de tutor em poucos minutos e já apresentar meu pet.
- Como pessoa desconfiada, quero saber por que pedem meu CPF e meu endereço antes de digitar.
- Como pessoa que já tem conta, quero ser levada ao login quando o e-mail já existir, sem perder o que digitei.
- Como quem chegou por "Pedir estadia", quero voltar para o cantinho que eu estava vendo depois de criar a conta.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-OREG-001 | Em `/register`, O SISTEMA DEVE mostrar dois cartões de escolha: "Tenho pet e vou viajar" (leva a `/register/owner`) e "Quero receber pets em casa" (leva a `/register/host`), preservando o `next` seguro da URL                                                                                                                                                                                                                                                                                |
| REQ-OREG-002 | O SISTEMA DEVE dividir o cadastro em 2 passos com `WizardProgress`: "Você" (nome, e-mail, senha, telefone, nascimento, CPF) e "Onde você mora" (CEP, rua, número, complemento opcional, bairro, cidade, UF)                                                                                                                                                                                                                                                                                     |
| REQ-OREG-003 | O SISTEMA DEVE validar cada campo ao sair dele e todos os campos do passo ao tocar "Continuar", com as regras da API: nome até 120; e-mail válido até 160; senha forte (8 a 128, maiúscula, minúscula, número e símbolo); telefone com DDD de 10 a 13 dígitos; nascimento válido, não futuro e 18 anos ou mais; CPF com dígitos verificadores válidos e não repetidos; CEP com 8 dígitos; rua até 120; número até 10 (aceita "S/N"); complemento até 60; bairro e cidade até 80; UF entre as 27 |
| REQ-OREG-004 | ENQUANTO a pessoa digita a senha, O SISTEMA DEVE atualizar a régua de 5 itens (`PasswordStrengthChecklist`) sem anunciar cada tecla, só a mudança de estado de cada item                                                                                                                                                                                                                                                                                                                        |
| REQ-OREG-005 | QUANDO o CEP tiver 8 dígitos, O SISTEMA DEVE consultar o ViaCEP e preencher rua, bairro, cidade e UF sem apagar o que a pessoa já editou; SE o CEP não existir ou a consulta falhar ou demorar mais de 4 s, O SISTEMA DEVE avisar "Não achamos esse CEP. Preenche o endereço que a gente segue." e deixar os campos livres                                                                                                                                                                      |
| REQ-OREG-006 | O SISTEMA DEVE mostrar, junto do CPF, a ajuda "Pra identificar quem paga. Não aparece pra ninguém." e, junto do endereço, "Pra mostrar cantinhos perto de você e pro pagamento."                                                                                                                                                                                                                                                                                                                |
| REQ-OREG-007 | "Voltar" DEVE manter tudo o que já foi respondido; trocar de passo NÃO DEVE apagar campos                                                                                                                                                                                                                                                                                                                                                                                                       |
| REQ-OREG-008 | QUANDO o passo 2 for enviado válido, O SISTEMA DEVE chamar o cadastro do BFF uma vez, com CPF, CEP e telefone sem máscara e o nascimento em `yyyy-MM-dd`, mostrar "Criando sua conta…" com `aria-busy` e impedir envio duplo                                                                                                                                                                                                                                                                    |
| REQ-OREG-009 | SE a API responder `VALIDATION_ERROR`, O SISTEMA DEVE levar cada mensagem ao campo dela (inclusive `address.*`), voltar ao primeiro passo que tiver erro e focar o primeiro campo com erro                                                                                                                                                                                                                                                                                                      |
| REQ-OREG-010 | SE a API responder `AUTH_EMAIL_ALREADY_REGISTERED`, O SISTEMA DEVE mostrar "Esse e-mail já tem conta de tutor. Quer entrar?" com o link para `/login?as=owner` (mantendo o `next`), no passo 1 e com foco no aviso                                                                                                                                                                                                                                                                              |
| REQ-OREG-011 | SE a API responder `OWNER_CPF_ALREADY_REGISTERED`, O SISTEMA DEVE mostrar no campo CPF "Esse CPF já está em outra conta. Se ele é seu, fala com o suporte que a gente resolve." com o link de suporte                                                                                                                                                                                                                                                                                           |
| REQ-OREG-012 | SE a API responder `TOO_MANY_REQUESTS`, O SISTEMA DEVE mostrar a contagem do `Retry-After` e bloquear o envio até zerar; erro de rede ou desconhecido mostra a mensagem genérica e mantém os dados                                                                                                                                                                                                                                                                                              |
| REQ-OREG-013 | QUANDO o cadastro der certo, O SISTEMA DEVE limpar o cache do TanStack Query, mostrar "Prazer, {primeiro nome}!" com o `Celebration` (até 900 ms; parado com movimento reduzido) e o botão "Apresentar meu pet" (`/pets/new`); SE houver `next` seguro, o botão principal DEVE ser "Voltar pra onde eu estava" e o de pet vira secundário                                                                                                                                                       |
| REQ-OREG-014 | Senha e CPF NUNCA DEVEM ir para URL, `localStorage`, `sessionStorage`, log ou analytics; o formulário NÃO DEVE guardar rascunho fora da memória                                                                                                                                                                                                                                                                                                                                                 |
| REQ-OREG-015 | SE já houver sessão ao abrir `/register` ou `/register/owner`, O SISTEMA DEVE redirecionar no servidor para a casa do papel (ou `next` seguro)                                                                                                                                                                                                                                                                                                                                                  |
| REQ-OREG-016 | Os campos DEVEM usar `autocomplete` e teclado certos: `name`, `email`, `new-password`, `tel` (`inputmode="tel"`), `bday`, `postal-code` (`inputmode="numeric"`), `address-line1`, `address-level2`, `address-level1`; CPF com `inputmode="numeric"` e `autocomplete="off"`                                                                                                                                                                                                                      |
| REQ-OREG-017 | No celular, `FormActions` DEVE ficar fixo embaixo (respeitando a área segura) e o botão de continuar DEVE dizer o que vem ("Continuar: endereço" / "Criar minha conta")                                                                                                                                                                                                                                                                                                                         |
| REQ-OREG-018 | As páginas DEVEM ter `<title>` "Criar conta · PetHost" e `robots: noindex`                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Estados da tela

| Estado                | O que aparece                                                                     |
| --------------------- | --------------------------------------------------------------------------------- |
| Escolha (`/register`) | Dois cartões grandes, nenhum marcado                                              |
| Passo 1               | Campos da pessoa, régua de senha                                                  |
| Passo 2               | CEP primeiro; endereço habilitado depois do CEP ou do aviso de CEP não encontrado |
| Buscando CEP          | Indicador discreto no campo CEP (`aria-busy`), campos de endereço ainda editáveis |
| Enviando              | Botão "Criando sua conta…" desabilitado, `aria-busy`                              |
| Erro de campo         | Mensagem embaixo do campo, ícone e borda de erro                                  |
| Erro da API           | `Notice` no topo do passo, com foco                                               |
| Limite                | `Notice` de atenção com contagem                                                  |
| Conta criada          | "Prazer, {primeiro nome}!", comemoração curta e próximos passos                   |

## Microcopy

- **Escolha:** título "Como você vai usar o PetHost?"; cartões "Tenho pet e vou viajar" / "Quero receber pets em casa"; rodapé "Já tem conta? Entrar".
- **Passo 1:** título "Primeiro, você". Rótulos: "Seu nome completo", "E-mail", "Crie uma senha", "Celular com DDD", "Quando você nasceu?", "CPF". Ajuda do nascimento: "O PetHost é pra quem tem 18 anos ou mais."
- **Passo 2:** título "Onde você mora". Rótulos: "CEP", "Rua", "Número", "Complemento (opcional)", "Bairro", "Cidade", "UF". Ajuda do número: "Sem número? Escreve S/N."
- **Erros de campo:** "Falta seu nome.", "Esse e-mail parece incompleto.", "A senha ainda não cumpre a régua.", "Confere o DDD e o número.", "Essa data não existe.", "Precisa ter 18 anos ou mais.", "Esse CPF não confere. Dá uma olhada nos números.", "O CEP tem 8 números.", "Falta a rua.", "Falta o número (ou S/N).", "Falta o bairro.", "Falta a cidade.", "Escolhe a UF."
- **Botões:** "Continuar: endereço", "Voltar", "Criar minha conta", "Criando sua conta…".
- **Sucesso:** "Prazer, {primeiro nome}!" / "Sua conta de tutor está pronta. Agora apresenta seu pet pra gente."; botões "Apresentar meu pet" e "Fazer isso depois".
- **Erros da API:** de `errorCopy` (spec 003), com o contexto `role: "owner"`.

## Acessibilidade e responsividade

- Cada passo é um `<form>` com `<h1>` próprio; ao trocar de passo, o foco vai para o título do passo novo.
- Mensagens de erro ligadas por `aria-describedby`; o resumo de erros do envio é um `Notice` com `role="alert"`.
- A régua de senha usa `aria-live="polite"` e anuncia só a mudança de cada item.
- Computador: trilha vertical à esquerda, passo no meio; a faixa direita mostra "o que a gente faz com cada dado" (sem ficha ao vivo: não há pet ainda).
- Celular: uma coluna, anel "1/2" + nome do passo, botão fixo embaixo, sem rolagem horizontal em 360 px.

## Fora do escopo

- Termos de uso e política de privacidade (ver Perguntas em aberto).
- Verificação de e-mail (a API ainda não tem; `modulo-auth.md` pendência 4).
- Apresentar o pet (spec 021): aqui só o link.
- Cadastro de anfitrião (spec 012), que reaproveita esta base.

## Perguntas em aberto

- **Consentimento LGPD:** a API não recebe aceite de termos nem de privacidade. Precisa de campo (`acceptedTermsVersion`) no cadastro ou fica só como texto informativo com link? Levar ao produto e ao backend.
- **Tratamento:** o design usa "Prazer, Camila!", que não depende de gênero. Nenhum outro texto desta spec flexiona gênero; manter assim até existir campo de tratamento.
- **Rascunho:** a regra 5 de `17-cadastros-e-formularios.md` pede rascunho automático. Aqui não há rascunho fora da memória porque o formulário tem senha e CPF (REQ-OREG-014, REQ-HTTP-019). O formulário é curto; confirmar com o design.
- **Divergência vault × API:** o vault fala em "CPF até o primeiro pagamento" no perfil; no cadastro o CPF é obrigatório (API). Sem conflito para esta tela.
