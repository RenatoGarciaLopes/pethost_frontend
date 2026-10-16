---
spec: 005-ui-conformance
status: in-progress
updated: 2026-10-15
---

# 005 · Tarefas

- [x] **T1 · Galeria e auditoria** (REQ-UIC-010, 009): `e2e/gallery`, `npm run gallery`; `specs/005-ui-conformance/audit.md` com a lista de desvios por tela (critério, print, gravidade)
- [x] **T2 · Fundamentos** (REQ-UIC-001, 002, 004, 006, 007): tokens de raio, regra de lint, `Surface`, `PageContainer`, `PageHeader`, `FlowProgress`, `FlowActions`, `FlowLayout`, com testes e stories
- [x] **T3 · Cabeçalho** (REQ-UIC-003)
- [ ] **T4 · Cadastros** (REQ-UIC-005, 006, 008): 011, 012, 021, 030, 044, 050
- [ ] **T5 · Painéis, listas e fichas** (REQ-UIC-002, 007, 008, 009): 020, 022, 031 a 033, 041, 042, 043, 044 (painel), 052, 053, 015
- [ ] **T6 · Revisão visual final**: galeria de novo, auditoria zerada ou com desvio aprovado pelo Renato

Lote T5/005b: implementadas as telas de pets/ficha/edição, listas e detalhes de estadias, conta/entrada e recebimentos atribuídas pelo Renato. Contratos e limites no design; 85 stories aprovadas e regressões descritas em docs/validation.md. Validação de 16/10: 303 testes de componentes/integração e 4 da guarda pública aprovados; 20/20 E2E de conformidade, 34 capturas e 144 E2E aprovados pela combinação da rodada ampla e reexecuções. Servidores encerrados. O checkbox global T5 permanece aberto para coordenação dos outros lotes; T6 não foi declarada concluída. Notas do vault e push ficam com Renato.
