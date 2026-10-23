# 081: contorno somente durante navegação de teclado

## Comportamento

Clique e toque nunca desenham contorno, inclusive em input/textarea que o navegador considera focus-visible e no foco devolvido por menus. Navegação por Tab/Shift+Tab, setas, Home/End/PageUp/PageDown, Enter/Espaço e Escape habilita os indicadores em tinta. Digitação comum e composição IME não mudam a modalidade. Clique após teclado esconde o indicador imediatamente, sem exigir blur. A 072 definiu a geometria; a 081 corrige a heurística de entrada.

## Implementação

- `shared/hooks/useInputModality.ts`: efeito instalado no ThemeProviders existente, sem novo provider/contexto/store/estado React. Listeners em capture no documento para keydown, pointerdown, mousedown e touchstart. Mantém `html[data-input]` como pointer ou keyboard; padrão pointer. Cleanup remove listeners e atributo. Montar uma vez por documento.
- `shared/theme/focus.ts`: fonte única de INPUT_MODALITY_ATTRIBUTE, focusRing e keyboardFocus(selector = "&:focus-visible"). O helper compõe `:where(html[data-input="keyboard"])` com o seletor recebido; :where preserva a especificidade existente e as supressões intencionais de headings.
- CssBaseline remove o outline nativo de :focus e devolve o indicador apenas sob keyboardFocus, incluindo InputBase. Button, ButtonBase, Chip, Switch e Link compõem o helper. Sem token azul e sem alterações de borda de erro.
- ChoiceCard, PetPickCards, DocumentSlot, AvatarUploader, PhotoSlots, StayList e Notice aplicam a mesma condição aos indicadores locais. Suas props, domínio, HTTP e estado permanecem iguais.
- SearchBar: célula inteira usa `[keyboardFocus("&:has(:focus-visible)")]`; indicador em tinta, offset 3 px, raio control de 12 px. Outline interno do InputBase também é suprimido sob o helper para preservar a hierarquia de especificidade. Não voltar a focus-within colorido.
- Storybook instala o mesmo hook em seu decorator de tema existente. renderWithProviders não muda: teste de modalidade deve montar o hook/ThemeProviders; testes isolados comuns continuam sem listeners globais novos.

## Integração com a 075

Pixel está trocando os inputs de data por calendário próprio. Preservar keyboardFocus na célula com :has(:focus-visible) e usá-lo nos indicadores próprios dos botões/dias. Nenhuma implementação da 075 foi antecipada nesta branch. Coordenador avisado sobre os dois seletores da célula para conciliar o merge.

## Validação enxuta, aguardando liberação

- Story Focus.Keyboard atualizada: input clicado/digitação sem outline; Tab/Shift+Tab habilitam indicadores; clique no input já focado esconde sem blur. Os quatro controles existentes mantêm o teste visual do tema.
- Um funcional `useInputModality.test.tsx` cobre exclusivamente instalação/cleanup de listeners, sem repetir os estilos do navegador.
- Unidade isolada do helper trivial N/A: comportamento do seletor é coberto pela composição real de CSS na story, evitando teste que espelha strings de implementação.
- Integração HTTP/API e novo E2E de jornada N/A: não há requisição, contrato ou percurso de domínio alterado; regressão visual no navegador e capturas do SAÍDA cobrem o foco.
- Tsc/lint nos arquivos tocados, testes direcionados e capturas antes/depois do SAÍDA clicado/Tab em 1440/390 estão pendentes; nada foi executado por instrução do coordenador.

Documentação de interface, consumidores e execução no vault: `development/resources/frontend-input-modality.md`. A 076 não foi modificada por esta entrega.

O fallback `src/app/global-error.tsx`, que substitui o layout quebrado, usa o mesmo hook e CSS nativo gerado pelo helper/geometry, preservando sua independência de MUI/providers. As duas fronteiras de produção são alternativas, não dois trackers simultâneos. ToggleButton herda a condição de buttonStyles, sem alterar seleção. Esses recursos também aguardam validação autorizada.
