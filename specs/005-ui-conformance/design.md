---
spec: 005-ui-conformance
status: in-progress
updated: 2026-10-15
---

# 005 · Design técnico

## Fundamentos (shared)

| Recurso                                                                                                | Onde                                                             | Faz                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quintalRadii` ampliado (`control` 12, `media` 16, `field` 18, `card` 24, `pill` 999) e `radius(name)` | `shared/theme/tokens/radii.ts`                                   | único jeito de pôr raio; no tema, também em `theme.quintal.radius` para `sx` (`(t) => t.quintal.radius.card`)                                      |
| Regra de lint `pethost/no-numeric-radius` (ou `no-restricted-syntax`)                                  | `eslint.config`                                                  | barra `borderRadius: <número>` em objetos de estilo, exceto 0 e `"50%"`                                                                            |
| `Surface`                                                                                              | `shared/ui/layout/Surface`                                       | superfície padrão (borda, raio, sombra `sm`/`md`/`lg`, `interactive`, `component`)                                                                 |
| `PageContainer`                                                                                        | `shared/ui/layout/PageContainer`                                 | `width: "page" \| "reading"`, gutter 16/32, `py` padrão                                                                                            |
| `PageHeader`                                                                                           | `shared/ui/layout/PageHeader`                                    | h1, subtítulo, ações                                                                                                                               |
| `FlowLayout`                                                                                           | `shared/ui/layout/FlowLayout`                                    | três faixas no computador (trilha, passo, prévia opcional); uma coluna no celular com `FlowProgress` compacto no topo e `FlowActions` fixa embaixo |
| `FlowProgress`                                                                                         | `shared/ui/navigation/FlowProgress` (substitui `WizardProgress`) | trilha vertical (computador) e anel "n/N" + nome + "Próximo" (celular); `steps: { id, label, description? }[]`, `current`, `completed`             |
| `FlowActions`                                                                                          | `shared/ui/layout/FlowActions` (evolui `FormActions`)            | Voltar (texto) + Continuar (coral); fixa embaixo no celular com área segura                                                                        |
| Cabeçalho                                                                                              | `widgets/app-shell`                                              | altura fixa 64/56, logo único, atalho ativo por prefixo, "Painel" do anfitrião                                                                     |

## Aplicação nas telas

| Grupo             | Telas                                                                                                                                            | Aplica                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Cadastros         | `/register/*` (011, 012), `/pets/new` (021), `/host/application/*` (030), `/host/listings/new` (044), `/listings/[id]/request` (050)             | `FlowLayout` + `FlowProgress`; a prévia ao vivo onde existir (carteirinha do pet, cartão do cantinho, resumo do pedido)   |
| Painéis e listas  | `/host` (044), `/pets` (020), `/owner/bookings` (052), `/host/bookings` (053), `/admin/*` (031 a 033), `/search` (041)                           | `PageContainer page` + `PageHeader` + grade; cartões com `Surface`                                                        |
| Fichas e detalhes | `/pets/[id]` e edição (022), detalhe de estadia (052/053), `/listings/[id]` (042), `/host/payments` (043), conta (`/users/*`, 015)               | `PageContainer page` com duas colunas no computador quando houver conteúdo lateral; `reading` só para texto e confirmação |
| Peças             | `HostOnboardingStages`, `PetIdCard`, `NewPetTile`, `PhotoSlots`, `DocumentSlot`, listas de estadia, `StatusPill`, `Notice`, `Hint`, `ErrorState` | tokens de raio e `Surface`                                                                                                |

## Galeria (REQ-UIC-010)

`e2e/gallery/gallery.spec.ts`, projeto Playwright `gallery` fora do CI (`npm run gallery`): sobe com o mock, entra com tutor, anfitrião (com e sem verificação) e admin, visita cada rota com estado semeado e salva `test-results/gallery/{conta}/{rota}-{desktop|mobile}.png`. Serve para a revisão humana, não é teste de snapshot.

## Matriz de testes

| REQ     | Nível                    | Onde                                                                                               |
| ------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| 001     | Lint + unitário          | regra de lint testada com casos válidos e inválidos; `radii.test.ts`                               |
| 002     | Componente + story       | `Surface.test.tsx`, stories com a11y                                                               |
| 003     | Componente + E2E         | `AppShell.test.tsx` (altura, ativo por prefixo, Painel); `shell.spec.ts`                           |
| 004/007 | Componente + story       | `PageContainer`, `PageHeader`                                                                      |
| 005/006 | Componente + story + E2E | `FlowLayout`, `FlowProgress` (computador e celular), jornadas de cadastro existentes seguem verdes |
| 009/010 | Galeria                  | revisão visual em 1440 e 390                                                                       |

## Fidelidade: decisões do anfitrião e do admin (17/10/2026, item 3 da auditoria de fidelidade)

Pranchas `telas-anfitriao.png` (pedido com a ficha) e `telas-admin.png` (conferir e decidir). Composição no computador: conteúdo à esquerda e caixa de decisão à direita (`Surface` `md`, fixa ao rolar); no celular, a caixa vem depois do conteúdo.

| Peça                           | Mudança                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PageHeader`                   | `eyebrow` opcional (sobretítulo fora do nome do h1) e `title`/`subtitle` aceitam nós                                                                                                                                                                                                                                                                                                                                      |
| Tema                           | `typography.overline` (0,8 rem, 800, espaçado): sobretítulos "SUA RESPOSTA", "CONFERÊNCIA", "DADOS ENVIADOS"                                                                                                                                                                                                                                                                                                              |
| `StatusPill`                   | selo do tamanho do texto (não vira faixa numa coluna), sem sombra; `ok` grama cheio, `info` (espera) céu cheio, `atencao` tracejado, `neutro` contorno                                                                                                                                                                                                                                                                    |
| `shared/lib/money/earnings.ts` | `splitEarnings` (taxa de 10% e líquido, somando o total) e `netEarnings`, que saiu de `host-listings` para os pedidos também usarem                                                                                                                                                                                                                                                                                       |
| `HostBookingDetail`            | sobretítulo "Pedido de {tutor} · Responda até…" com o selo; título com o pet ("Pipoca quer passar 5 noites aqui."); caixa "Sua resposta" com período, diária × noites × pets, taxa, "Você recebe", "Aceitar o pedido" em grama, "Não posso receber" e o que acontece ao aceitar; contato, marcos e cancelamento na mesma caixa; `PageContainer`                                                                           |
| `HostApplicationReview`        | h1 com o nome (o "Conferir verificação:" fica para leitor de tela), linha "Solicitação de dd/mm · tentativa n de 3 · tipo", selo céu "Em análise"; fotos como cartões com o desenho da vaga (`documentDrawings`, agora na API pública de `host-applications`) que abrem a foto só sob clique; `Hint` com a trilha de auditoria; dados para comparar numa `Surface`; decisão ou resumo na caixa à direita; `PageContainer` |
| `DecisionPanel`                | caixa `aside`; "Aprovar" grama; a frase que a pessoa vai ler numa `Notice` de orientação (gema tracejada); fraude separada, em texto vermelho de erro                                                                                                                                                                                                                                                                     |

Privacidade mantida: nenhuma foto carrega sem clique, o link continua temporário e some ao fechar, CPF segue mascarado até a ação local, e a decisão continua só no computador.

**Ainda difere da prancha:** "Conversar antes" e a mensagem do tutor (não há Conversas nem campo de mensagem na API); caixa de compatibilidade "Combina com a sua casa" e vagas no período (a API do pedido não traz esses dados); ficha da Pipoca com faixa gema, foto redonda e selos Cães/Gatos/Crianças (é o `PetProfileCard`, de pets, fora desta entrega); cabeçalho com atalhos à direita, selo "Admin" e pílula com nome (AppHeader, com outra pessoa); itens do checklist e motivos de recusa com os textos da API/escopo, não os da prancha ("Vencido", "Foto errada"); cartões das fotos mostram o desenho, não a foto, até a abertura explícita (decisão de privacidade); textos "Aceitar o pedido" e "Não posso receber" em vez de "Aceitar a Pipoca" e "Não posso dessa vez" (sem gênero presumido e mantendo os nomes já usados nas jornadas).
