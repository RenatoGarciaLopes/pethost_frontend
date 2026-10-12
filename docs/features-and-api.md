# Features, telas e contratos

## Fontes

Análise de 11/10/2026: controllers e DTOs em `../../pethost_backend/src`, escopo, módulos e dicionário em `../../pethost_backend/docs`, e vault em `../../PetHost obsidian/PetHost obsidian`.

Código define chamadas existentes; `escopo-mvp.md` define produto planejado; `dicionario-de-dados.md` orienta domínios sem endpoints. No vault foram consultados escopo oficial, contrato-api, mapa de telas, decisão de 11/10, componentes MUI e estado atual. A nota de estado do design é de 09/10 e não substitui contratos de 11/10. Protótipos e tabelas não significam API implementada.

## Domínios

| Feature               | Escopo                                                                         | Backend observado                                                                |
| --------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `auth`                | Login por papel, recuperação de senha, sessão e troca de conta                 | Módulo Auth: Sessions e Passwords                                                |
| `users`               | Cadastro host e dados comuns da conta, senha e contas vinculadas               | Auth: Users; entidade User e recurso `/users`                                    |
| `owners`              | Cadastro tutor, perfil, avatar, ativação e ações administrativas sobre tutores | Módulo Owners; entidade Owner e recurso `/owners`                                |
| `hosts`               | Perfil aprovado, avatar, ativação e ações administrativas sobre anfitriões     | Módulo Hosts; entidade Host e recurso `/hosts`                                   |
| `pets`                | Ficha, cadastro em etapas, edição, fotos e pets da casa                        | Pets implementado; mesmo domínio para tutor e host aprovado                      |
| `host-applications`   | PF/PJ, documentos, aviso, envio, tentativas e revisão administrativa           | Hosts: HostApplications; entidade HostApplication e recurso `/host-applications` |
| `listings`            | Cantinho público, casa, fotos, capacidade, diária e publicação                 | Planejado                                                                        |
| `search`              | Busca, filtros na URL, resultados, selos e compatibilidade                     | Planejado                                                                        |
| `availability-blocks` | Agenda, bloqueios e capacidade por data                                        | Planejado                                                                        |
| `bookings`            | Pedido, aceite/recusa, prazos, cancelamento e estadia                          | Planejado                                                                        |
| `payments`            | Pix/cartão, conexão Stripe, situação e ganhos                                  | Planejado                                                                        |
| `conversations`       | Texto/foto, lista e contador; chat como diário                                 | Planejado; transporte a decidir com a API                                        |
| `reviews`             | Avaliação bilateral e reputação                                                | Planejado                                                                        |
| `audit`               | Consulta de trilha e filtros administrativos                                   | Endpoint implementado; complemento operacional                                   |

Todas as features estão sem código nesta entrega. A revisão administrativa pertence a `host-applications`; suspensão e liberação de identidade ficam em `owners` e `hosts`. Admin é um papel que acessa recursos, não uma entidade ou módulo de negócio separado. O widget `host-application-review` compõe os dados necessários sem acoplar features entre si.

## Convenções de nomes

Pastas em inglês, minúsculas e kebab-case. Recursos no plural, como na API e no modelo ER: `pets`, `listings`, `bookings`, `payments`, `conversations` e `reviews`. `auth` e `audit` seguem os nomes dos módulos existentes. `host_applications` e `availability_blocks` do banco correspondem a `host-applications` e `availability-blocks` nas pastas. `search` representa o caso de uso de consulta de listings, não uma tabela adicional.

Não criamos uma feature por tabela associativa ou detalhe: `pet_photos` pertence a `pets`; `listing_photos` e `listing_species` a `listings`; `booking_pets` a `bookings`; `messages` a `conversations`; `host_application_documents` a `host-applications`; `stripe_events` permanece no backend de pagamentos. `audit_entries` é o recurso consultado pela feature `audit`.

IDs de recursos nos segmentos mantêm a assinatura da API (`[petId]`, `[hostId]`, `[ownerId]`, `[applicationId]`) e do domínio planejado (`[listingId]`, `[bookingId]`, `[conversationId]`). Contratos futuros devem preservar os campos JSON reais em camelCase, como `fullName`, `birthDate`, `isActive`, `accessToken` e `expiresAt`; snake_case continua sendo a convenção do banco, não do DTO.

## Widgets

| Widget                    | Composição                                            |
| ------------------------- | ----------------------------------------------------- |
| `app-shell`               | Navegação por papel e dados mínimos de conta          |
| `landing-hero`            | Busca inicial e comunicação da marca                  |
| `listing-details`         | Cantinho, perfil, pets residentes, avaliações e datas |
| `host-onboarding`         | Conta → verificação → recebimentos → cantinho         |
| `booking-checkout`        | Reserva, seleção de pets e pagamento                  |
| `booking-dashboard`       | Estado da estadia, ações, conversa e avaliação        |
| `host-dashboard`          | Pedidos, próximas estadias, agenda e ganhos           |
| `conversation-panel`      | Conversa com contexto da estadia                      |
| `host-application-review` | Dados para comparar, documentos temporários e decisão |

## Rotas planejadas

Grupos `(public)`, `(auth)` e `(authenticated)` não alteram URLs; `owner`, `host` e `admin` seguem os papéis da API e são segmentos reais para evitar colisões. Users, pets e conversations são compartilhados com permissões por conta ativa. Os nomes técnicos ficam em inglês; textos apresentados ao usuário podem permanecer em português.

| Área          | URLs                                                                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Público       | `/` (scaffold), `/search`, `/listings/[listingId]`                                                                                                                               |
| Entrada       | `/login`, `/register/owner`, `/register/host`, `/forgot-password`, `/reset-password`, `/admin/login`                                                                             |
| Compartilhado | `/users/profile`, `/users/password`, `/users/switch`, `/users/deactivate`, `/pets`, `/pets/new`, `/pets/[petId]`, `/pets/[petId]/edit`, `/conversations` e detalhe               |
| Tutor         | `/owner/bookings`, detalhe, `/payments`, `/reviews`; `/owner/booking-requests/[listingId]`                                                                                       |
| Anfitrião     | `/host`, `/host/application`, new/documents, `/host/payments`, `/host/listings`, edit, `/host/availability-blocks`, `/host/booking-requests`, `/host/bookings` e `/host/payouts` |
| Admin         | `/admin/host-applications`, detalhe, `/admin/users`, detalhe e `/admin/audit-entries`                                                                                            |

Pastas vazias **não publicam rotas** sem `page.tsx`/`route.ts`. Listas e painéis usam os diretórios pais. O scaffold publica apenas a home.

## Endpoints existentes

Prefixo backend `/api/v1`; equivalentes BFF futuros sob `/api` no Next.

| Área            | Sufixos observados nos controllers                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Sessão          | `POST /auth/sessions/login`, `/refresh`, `/logout`, `/switch`                                                                                   |
| Senha           | `POST /auth/password/forgot`, `/reset`; `POST /users/me/password`                                                                               |
| Conta           | `POST /users/register`, `GET /users/me`, `GET /users/me/accounts`                                                                               |
| Tutor           | `POST /owners/register`, `GET/PATCH /owners/me`, `PUT/DELETE /owners/me/avatar`, `POST /owners/me/deactivate`, `POST /owners/reactivate`        |
| Host            | `GET/PATCH /hosts/me`, `PUT/DELETE /hosts/me/avatar`, `POST /hosts/me/deactivate`, `POST /hosts/reactivate`                                     |
| Verificação     | `GET/POST/PATCH/DELETE /hosts/me/application`, `PUT .../documents`, `POST .../submission`                                                       |
| Pets            | `POST /pets`, `GET /pets/me`, `GET/PATCH /pets/{petId}`, `POST/DELETE .../deactivation`, `POST .../photos`, `PATCH/DELETE .../photos/{photoId}` |
| Pets residentes | `GET /hosts/{hostId}/pets`                                                                                                                      |
| Revisão         | `GET /host-applications`, detalhe, documentos por kind, `POST .../approval`, `POST .../rejection`                                               |
| Administração   | Owners/Hosts: listagem e detalhe, `POST/DELETE .../suspension`, `POST /owners/{ownerId}/cpf-release`, `POST /hosts/{hostId}/identity-release`   |
| Auditoria       | `GET /audit-entries`                                                                                                                            |

Envelope `{ success, data | error, timestamp }`; erros de campo em `error.details: [{ field, messages[] }]`, inclusive `address.zipCode`. Normalizar erros e apresentar microcopy em português. Validar DTOs reais antes de implementar formulários.

## Regras que afetam a estrutura

- Contas owner/host separadas mesmo com o mesmo e-mail; trocar exige senha de destino e limpeza do cache.
- Conta host não implica perfil aprovado. Pets da casa e Stripe dependem do onboarding.
- Pets: 12 espécies, porte obrigatório em cachorro, opcional em gato e proibido nas outras; até três fotos. Cantinho prevê cinco.
- Verificação: frente/verso/selfie, fotos privadas e tentativas limitadas. Não persistir documentos nem URLs assinadas em estado global.
- Endereço exato/telefone apenas após pagamento; não enviar dado privado para apenas escondê-lo no componente.
- Disponibilidade/capacidade e expiração são determinadas no backend, não pela seleção client.
- Dinheiro em centavos inteiros. Datas da estadia são datas de calendário; timestamps de sessão representam instantes.
- Aceite/pagamento: 24h. Confirmação de pagamento só pela API/webhook, nunca por retorno do browser. Webhooks Stripe ficam no backend.
- Avaliação: estadia concluída e até sete dias. Chat cobre diário; selos e compatibilidade são derivados, sem CRUD próprio.

Não criamos DTOs nem endpoints especulativos para features planejadas. As pastas de `app/api` representam apenas contratos existentes.
