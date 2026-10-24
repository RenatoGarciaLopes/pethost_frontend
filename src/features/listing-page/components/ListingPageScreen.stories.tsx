import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { fn } from "storybook/test";
import { Notice } from "@/shared/ui/feedback/Notice";
import {
  listingDetailFixture,
  listingPhotoFixture,
  listingPhotosFixture,
  listingReviewFixture,
} from "@/test/fixtures/listingPage";
import { ListingPageScreen } from "./ListingPageScreen";

/** Recebe todo dia: as datas da prancha (20 a 25 dez) passam por um domingo, que a fixture não recebe. */
const everyDay = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const stay = {
  today: "2026-12-01",
  search: "where=Zona+7&pets=pet-1&from=2026-12-20&to=2026-12-25",
  where: "Zona 7",
  from: "2026-12-20",
  to: "2026-12-25",
  petIds: ["pet-1"],
  pets: [
    { id: "pet-1", name: "Pipoca", coverUrl: listingPhotoFixture("#FFE9B0", "#C58B4F") },
    { id: "pet-2", name: "Mel", coverUrl: null },
  ],
  closedPeriods: [],
};
const reviews = [
  listingReviewFixture(),
  listingReviewFixture({
    id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b32",
    author: { name: "Paulo", avatarUrl: null },
    comment: "A Dona Cida deu o remédio certinho, e ainda me mandou vídeo.",
    stayEndedAt: "2026-10-05T15:00:00Z",
  }),
];
/** A caixa real (`CompatibilityNotice`) mora na busca e é composta pela rota; aqui, o mesmo `Notice` com o texto dela. */
const compatible = (
  <Notice tone="ok" title="A Pipoca combina com essa casa.">
    <p>Aceita cachorro de porte médio · tem cachorro em casa · sem gato em casa.</p>
    <p>Nessas datas, Dona Cida também recebe Luna (cão pequeno).</p>
  </Notice>
);
const warning = (
  <Notice tone="atencao" title="Vale conferir antes de pedir pra Pipoca:">
    <ul>
      <li>Tem gato em casa</li>
    </ul>
  </Notice>
);

const meta = {
  title: "Listing page/Detalhe",
  component: ListingPageScreen,
  parameters: { layout: "fullscreen", design: { board: "Página do cantinho" } },
  // A lateral troca datas e pets pela URL: o router do Next vem do mock do Storybook.
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), replace: fn(), refresh: fn(), bfcacheId: "listing-page" });
  },
  args: {
    listing: listingDetailFixture({
      photos: listingPhotosFixture,
      rating: { average: 4.9, count: 18 },
      availableWeekdays: everyDay,
    }),
    isOwner: false,
    accountRole: "owner",
    reviews,
    stay,
  },
} satisfies Meta<typeof ListingPageScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Como na prancha: tutor com a Pipoca escolhida, datas, compatibilidade e avaliações. */
export const TutorCompativel: Story = { args: { compatibility: compatible } };
export const ComAviso: Story = { args: { compatibility: warning } };
export const SemFotos: Story = {
  args: { listing: listingDetailFixture({ rating: { average: 4.9, count: 18 }, availableWeekdays: everyDay }) },
};
export const SemAvaliacao: Story = {
  args: { listing: listingDetailFixture({ photos: listingPhotosFixture, availableWeekdays: everyDay }), reviews: [] },
};
export const TutorSemEscolha: Story = {
  args: { stay: { ...stay, search: "", from: undefined, to: undefined, petIds: [], where: undefined } },
};
/** Outra conta de anfitrião visitando: o card de compra sem "Quem vai"; o pedido passa pela troca de conta. */
export const AnfitriaoVisitante: Story = {
  args: {
    accountRole: "host",
    stay: { ...stay, search: "where=Zona+7&from=2026-12-20&to=2026-12-25", petIds: [], count: 1, pets: [] },
  },
};
export const DonoDoCantinho: Story = { args: { isOwner: true, accountRole: "host", stay: undefined } };
/** Visitante (sem conta): fotos, quem cuida, regras, avaliações e a lateral de datas; sem "Quem mora aqui" nem compatibilidade, que exigem conta. */
export const Visitante: Story = {
  args: {
    accountRole: "visitor",
    stay: { ...stay, search: "where=Zona+7&from=2026-12-20&to=2026-12-25", petIds: [], count: 1, pets: [] },
  },
};
export const Celular: Story = {
  args: { compatibility: compatible },
  globals: { viewport: { value: "celular", isRotated: false } },
};
