---
spec: 066-booking-payment
status: approved
updated: 2026-10-23
---

# 066 · Tarefas

- [x] **T0 · Descoberta e spec**: ler brief/regras, documentação, catálogo, contratos e specs de reservas; escrever requirements/design/tasks e apresentar resumo via `maestri ask "Claude Code"` antes da UI. Aprovada em 2026-10-23 com ajustes incorporados.
- [x] **T1 · Integrar dev e validar contratos** (REQ-PAY-004/005/009): merge `9002094`, schemas regenerados via Orval; typecheck da base sem erros e nove testes BFF aprovados antes das mudanças do checkout. Dependências Stripe disponibilizadas pelo coordenador na junction, sem npm install nesta worktree.
- [ ] **T2 · Contratos e operações de pagamento em TDD** (REQ-PAY-003/004/005/009/011): testes de schemas, seleção/próxima parcela e transportes primeiro; implementar contratos/queries/mutations usando clientes existentes; mocks sintéticos das quatro operações.
- [ ] **T3 · Orquestração e SDK em TDD** (REQ-PAY-005/006/007/008/009): integração de plano/sessão, envio único, erros, retorno e sincronização, privacidade e cache; chave ausente e pendência nunca confirmam reserva.
- [ ] **T4 · Rota e UI em TDD** (REQ-PAY-001/002/003/006/010/011): CTA em Minhas estadias, checkout responsivo, resumo, lembrete, prazo, estados e sucesso; validar metadata/guarda e consumidores existentes. Ler guias locais Next aplicáveis antes do código.
- [ ] **T5 · Stories e jornadas** (REQ-PAY-001 a 011): stories dos estados, testes focados unitários/funcionais/MSW e E2E com Stripe simulado; combinar portas 3100/5099 antes de usar. Comparar PNGs 1440/390 com prancha, registrando diferenças.
- [ ] **T6 · Documentação e entrega**: registrar recurso, catálogo, decisão e linha do tempo diretamente no vault compartilhado autorizado; atualizar árvore se necessário. Rodar typecheck e lint focado, registrar testes reais, conferir paths/links/status, remover código sem uso, commits em português sem atribuição, sem push. Reportar resumo, prints e pendências por Maestri.

## Validação desta etapa

Implementação em andamento. Validação atual em `validation.md`; checks pesados e servidores suspensos pelo coordenador por falta de memória. Fila de portas: Loam → Pixel → Quill → Wren → Rivet; avisar Wren diretamente ao liberar.

Aprovada pelo coordenador em 2026-10-23: lembrete curto sem checkbox; edição direta do vault compartilhado autorizada, sem pacote intermediário. Erros usam helpers atuais, com futura tradução 090 por baixo.
