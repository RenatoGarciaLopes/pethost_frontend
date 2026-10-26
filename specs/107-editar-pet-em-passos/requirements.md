# 107 — Cadastro e edição do pet na casca do cadastro

- Edição em sete seções, acessíveis em qualquer ordem por trilha de cartões no computador e lista em folha no celular.
- Uma seção por tela; título recebe foco; URL `?secao=saude` conserva a seção no reload. Links antigos por hash continuam sendo lidos; novos links usam query.
- Salvar mantém PATCH mínimo, validação e erros de campo existentes. Trocar com rascunho oferece Salvar e ir, Descartar e Ficar; falha conserva os dados. Navegação bloqueada durante gravação.
- Carteirinha de edição acompanha os valores do formulário no computador largo. Fotos mantêm mutações imediatas existentes.
- Mobile: anel com posição, botão Seções, Salvar/Próxima fixos, alvos de 56 px, sem overflow horizontal.
- Bicho em grade compacta, com radiogroup e dependências de espécie preservadas.
- Correção adicional solicitada em 26/10: cadastro novo do pet, inclusive anfitrião, deve usar a mesma StepWizard do cadastro do sistema; trilha ao lado do conteúdo, sem lista de espécies empilhada. Preservar rascunho, criação, fotos e erros da API.
