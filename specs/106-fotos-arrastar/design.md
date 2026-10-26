# Design e contratos

Estende `src/shared/ui/media/PhotoSlots/`, encontrado no catálogo e nos consumidores `ListingPhotosSection`, `PetPhotosSection`, `PetWizard` e documentação do módulo pets. Reutiliza MUI Menu/MenuItem, `keyboardFocus`, `quintalRadii`, `useObjectUrl`, `validateImageFile` e `SPRING_ASSENTAR`; sem novo provider, store ou cliente HTTP.

`PhotoSlots` permanece controlado: `files`, `errors`, `uploadingIndex`, `disabled`, callbacks de escolha, troca, remoção e `onMove?`. `DndContext` contém `SortableContext` com `rectSortingStrategy`; somente índices preenchidos participam. Sensores separados de mouse/toque evitam bloquear rolagem com `touch-action: none`. Teclado usa `sortableKeyboardCoordinates`. Nomes, instruções e anúncios pertencem ao `photoSlotsCopy`.

`Slot` é componente interno no mesmo arquivo, responsável por prévia, entrada nativa de arquivo, foco, alvo sortable, indicação visual e menu contextual. Não deve ser exportado. Recebe estado e callbacks do grupo. O sensor fica apenas na foto; ações abaixo não iniciam arraste. O menu fica fora desse alvo. `destination` desenha uma borda tracejada fixa na célula, enquanto os irmãos se deslocam. Não há clonagem de fotos nem upload adicional.

Escolha visual: manter Trocar/Tirar numa linha curta preserva a descoberta e o fluxo existente dos pets, sem a torre anterior. O menu contém só ordenação, com nome acessível `Opções da foto N`. A ação da primeira foto inclui capa no nome acessível, de acordo com o texto visível.

Persistência: a seção continua usando `useListingPhotoMutations.move`. O consumidor salva sem atualização otimista do cache. Uma ordem visual transitória no PhotoSlots mantém o destino enquanto `uploadingIndex` está ativo e os arquivos controlados ainda são os da origem. Resposta substitui essa ordem; erro devolve a ordem controlada. Nenhum callback adicional nem alteração de API.

Dependências novas já instaladas pelo solicitante: `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0 e `@dnd-kit/utilities` 3.2.2. Registro em [docs/architecture.md](../../docs/architecture.md).

Sem mudança de pastas técnicas: spec em `specs/106-fotos-arrastar/`, teste de composição junto da seção em `features/host-listings/components/client/`. Estado de teste, fixtures e providers existentes são reutilizados.
