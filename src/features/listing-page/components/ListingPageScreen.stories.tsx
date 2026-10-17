import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ListingDetail } from "../api/contracts";
import { ListingPageScreen } from "./ListingPageScreen";

const listing = {
  id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
  hostId: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d",
  host: {
    id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d",
    name: "Casa Cida",
    avatarUrl: null,
    isCompany: false,
    isAvailable: true,
    payoutsEnabled: true,
  },
  title: "Quintal da Cida",
  description: "Um espaço calmo para brincar.",
  homeType: "house",
  hasYard: true,
  hasDogs: false,
  hasCats: true,
  hasKids: false,
  acceptedSpecies: ["dog", "cat"],
  acceptsSmall: true,
  acceptsMedium: false,
  acceptsLarge: true,
  capacity: 3,
  nightlyRate: 60.1,
  houseRules: "Sem subir no sofá.",
  availableWeekdays: ["monday", "friday"],
  address: { neighborhood: "Centro", city: "Curitiba", state: "PR" },
  photos: [{ id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1e", url: "https://images.example/yard.webp", position: 1 }],
  isActive: true,
  deactivatedAt: null,
  createdAt: "2026-10-15T12:00:00Z",
  updatedAt: "2026-10-15T12:00:00Z",
  badges: ["yard"],
} as ListingDetail;

const meta = {
  title: "Listing page/Detalhe",
  component: ListingPageScreen,
  parameters: { design: { board: "Fluxo-Reserva" } },
  args: {
    listing,
    query: { pets: [] },
    requestSearch: "",
    selectedPets: [],
    isOwner: false,
    accountRole: "owner",
  },
} satisfies Meta<typeof ListingPageScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Publica: Story = {};
export const VisaoDoAnfitriao: Story = { args: { isOwner: true, accountRole: "host" } };
