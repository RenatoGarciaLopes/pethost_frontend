---
spec: 015-my-account
status: in-progress
updated: 2026-10-13
---

# 015 · Tarefas

Pré-requisito: 003, 004 (casca, `requireRole`, `useLogout`), 011 (T2 a T4: validações e campos compartilhados), 014 (grupo `(account)`).

- [x] **T1 · Microcopy de erros nova** (REQ-ACC-007, 010, 011, 017)
  - Teste primeiro: o teste parametrizado de `getErrorMessage.test.ts` (003) já cobre todo código novo da tabela
  - Implementar: `OWNER_CPF_LOCKED`, `OWNER_BIRTH_DATE_LOCKED`, `OWNER_NOT_FOUND`, `HOST_NOT_FOUND`, `HOST_NOT_A_COMPANY`, `PAYLOAD_TOO_LARGE` em `errorCopy.ts`
- [x] **T2 · Utilitários compartilhados** (REQ-ACC-002, 013, 014, 026)
  - Teste primeiro: `validateImageFile.test.ts`, `useObjectUrl.test.tsx`, `maskCpfForDisplay.test.ts`, `formatMemberSince.test.ts`
  - Implementar: `shared/lib/files`, `shared/hooks/useObjectUrl.ts`, `shared/lib/masks`, `shared/lib/date`
- [x] **T3 · Modelo, diff e adaptadores** (REQ-ACC-004, 006, 009, 011)
  - Teste primeiro: `diffProfile.test.ts`, `ownerProfileGateway.test.ts`, `hostProfileGateway.test.ts`
  - Implementar: `npm run gen:feature -- account`; `types`, `lib/diffProfile.ts`, `api/client/*Gateway.ts`, mappers
- [x] **T4 · Layout e navegação** (REQ-ACC-001, 027)
  - Teste primeiro: `AccountSectionNav.test.tsx`
  - Implementar: `app/(account)/users/layout.tsx`, `AccountSectionNav`
- [x] **T5 · AvatarUploader** (REQ-ACC-014 a 017)
  - Teste primeiro: `AvatarUploader.test.tsx`
  - Implementar: `shared/ui/media/AvatarUploader` (gerador) + story
- [x] **T6 · Perfil do tutor** (REQ-ACC-002 a 008, 012, 013)
  - Teste primeiro: `ProfileEditor.owner.test.tsx`, `ProfileEditor.owner.errors.test.tsx`
  - Implementar: `ProfileScreen`, `ProfileEditor`, `PublicProfileCard`, `ProfileForm`, `CurrentPasswordReveal`, `app/(account)/users/profile/page.tsx` + stories
- [x] **T7 · Perfil do anfitrião** (REQ-ACC-009 a 011)
  - Teste primeiro: `ProfileEditor.host.test.tsx`
- [x] **T8 · Trocar a senha** (REQ-ACC-018 a 021)
  - Teste primeiro: `PasswordChangeForm.test.tsx`
  - Implementar: `PasswordChangeScreen`, `PasswordChangeForm`, `app/(account)/users/password/page.tsx`
- [x] **T9 · Pausar a conta** (REQ-ACC-022 a 025)
  - Teste primeiro: `DeactivateForm.test.tsx`
  - Implementar: `DeactivateScreen`, `DeactivateForm`, `app/(account)/users/deactivate/page.tsx`; aviso fixo na home
- [x] **T10 · Privacidade e limite** (REQ-ACC-026, 028): caso novo no teste de arquitetura; contagem com `useCountdown`
- [ ] **T11 · E2E**: `e2e/mocked/account/profile.spec.ts`, `e2e/mocked/account/security.spec.ts` (handlers do mock para owners/me, hosts/me, avatar, senha e desativar), `e2e/real/account/profile.spec.ts`
- [x] **T12 · Documentação:** TSDoc; catálogo (`AvatarUploader`, `validateImageFile`, `useObjectUrl`, `maskCpfForDisplay`, `formatMemberSince`, `features/account`, `ProfileGateway`); nota `development/resources/account.md`; resultados reais em `docs/validation.md`

## Registro (2026-10-13)

- T1 a T10 e T12 feitos; T11 com o E2E simulado (`e2e/mocked/account/profile.spec.ts` e `security.spec.ts`, computador e celular). Falta o E2E real (`e2e/real/account/profile.spec.ts`), que precisa da API de teste.
- T9: o aviso de conta pausada aparece no login, não na home (a casa pública ainda não existe; ver decisões no `design.md`).
- Bug achado pelos testes: o `LockedField` descartava o adorno recebido, e o "Esconder" do CPF travado sumia; corrigido no componente compartilhado.
- Stories das telas de perfil, senha e pausa não foram feitas (só a do `AvatarUploader` e a do `ErrorNotice`); entram na pendência única das stories das telas de conta.
- Perguntas ao backend continuam abertas: sinal de trava do tutor antes de salvar (`identityLocked`), edição de contato do anfitrião não aprovado, foto antes da aprovação, pausa com estadia marcada.
