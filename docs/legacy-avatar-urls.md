# Avatares legados locais

`src/shared/ui/media/InitialsAvatar/InitialsAvatar.tsx` mantém sua interface pública.
Em produção, seu helper interno `avatarSource` omite fontes locais (localhost,
loopback, IPv4 privado/link-local, nomes internos e literais IPv6), inválidas ou
com protocolo diferente de HTTP(S). Assim o Avatar MUI mostra as iniciais antes
de criar uma imagem ou solicitar acesso a serviços do dispositivo. URLs relativas
ao site e URLs HTTP(S) públicas continuam funcionando. Desenvolvimento conserva
o comportamento anterior para RustFS local. Não há nova configuração ou export.

Consumidores: cabeçalho, perfil, busca, detalhe do cantinho, reservas e uploader
que já reutilizam InitialsAvatar. Não altera os dados persistidos nem inventa uma
URL R2 para um arquivo cuja existência não foi comprovada.

A página pública de um cantinho retornou um avatar absoluto localhost:9000.
A verificação HEAD do mesmo caminho em media.pethost.cfd retornou 403; portanto
não foi possível confirmar ou migrar a imagem. Recuperar o arquivo do storage
anterior ou reenviar o avatar e atualizar o registro no backend continua necessário
para restaurar a foto. A proteção de apresentação elimina o request indevido.

Testes funcionais adjacentes verificam ausência de imagem e de construção de
Image para oito endereços locais; preservação de imagem pública/relativa e fallback
após erro. Cobrem o helper pela composição observável. Integração HTTP não se
aplica: o comportamento corrigido impede a requisição. E2E em produção depende
de deploy e não foi executado nesta entrega.

Validacao local: 11 testes funcionais aprovados; typecheck e ESLint dos arquivos alterados aprovados.
