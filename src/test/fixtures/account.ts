import { sessionUserFixture } from "./session";
/** Endereço exclusivamente sintético. @example const address = { ...accountAddressFixture }; */
export const accountAddressFixture = {
  zipCode: "01001000",
  street: "Rua de Teste",
  number: "10",
  complement: "apto 2",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP",
};
/** DTO sintético de tutor, validado nas integrações do gateway. @example apiOk(ownerProfileDtoFixture) */
export const ownerProfileDtoFixture = {
  id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b5c",
  userId: sessionUserFixture.id,
  cpf: "52998224725",
  isActive: true,
  createdAt: "2026-10-13T12:00:00Z",
  user: {
    ...sessionUserFixture,
    phone: "11987654321",
    birthDate: "1990-05-03",
    address: accountAddressFixture,
    avatarUrl: null,
    createdAt: "2026-09-01T12:00:00Z",
  },
};
/** DTO sintético de anfitrião PF. @example apiOk(hostProfileDtoFixture) */
export const hostProfileDtoFixture = {
  ...ownerProfileDtoFixture,
  personType: "individual",
  company: null,
  verifiedAt: "2026-10-12T12:00:00Z",
  stripeConnected: false,
  stripePayoutsEnabled: false,
  user: { ...ownerProfileDtoFixture.user, role: "host" },
};
/** Modelo da UI sem credenciais. @example toProfileFormValues(accountProfileFixture) */
export const accountProfileFixture = {
  role: "owner" as const,
  fullName: sessionUserFixture.fullName,
  email: sessionUserFixture.email,
  phone: "11987654321",
  birthDate: "1990-05-03",
  cpf: "52998224725",
  address: accountAddressFixture,
  avatarUrl: null,
  memberSince: ownerProfileDtoFixture.createdAt,
  company: null,
  verified: true,
};
