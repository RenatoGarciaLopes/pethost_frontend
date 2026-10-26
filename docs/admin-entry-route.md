# Entrada do painel administrativo

next.config.ts define redirects() com /admin -> /admin/host-applications,
redirecionamento temporario (307). A configuracao e carregada pelo Next antes
do proxy/renderizacao e nao usa dados da sessao. O destino continua protegido
por guardRoute, AdminPanelLayout e RoleGate, com confirmacao da conta pela API.

Antes, /admin sem page enviava o visitante ao login com next=/admin; o login
respeitava o destino mas acabava em 404. Agora o visitante chega ao login com
next da fila existente. Sessao admin abre a fila diretamente; tutor e anfitriao
seguem para a propria area. URLs especificas do painel continuam preservadas.

O literal do destino na config e necessario porque o carregador de next.config.ts
nao resolve dependencias de appRoutes que usam aliases da aplicacao. O teste
src/shared/config/adminEntry.test.ts compara o destino com homeOf(admin), evitando
divergencia. Sem nova pagina, componente, provider, permissao ou contrato.
Uso: acessar /admin. Para mudar a regra no site e preciso novo deploy.

Validacao aplicavel: teste funcional da config e unitarios do guard/appRoutes;
E2E em e2e/mocked/admin/entry.spec.ts cobre login partindo de /admin, retorno
com sessao e bloqueio de tutor em desktop/celular. Backend simulado, nao API real.
Sem nova UI, Storybook nao se aplica.

Validacao final: 25 testes Vitest aprovados; typecheck, ESLint e formatacao dos arquivos alterados aprovados. Playwright registrou 4 cenarios aprovados (desktop/celular, login e bloqueio de tutor); o processo ficou preso na finalizacao dos servidores e foi interrompido depois dos resultados. Nao houve validacao da API real ou deploy nesta entrega.
