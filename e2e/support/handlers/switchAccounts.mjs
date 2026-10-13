function account(scenario, id, email, role, isActive, password) {
  return { scenario, password, user: { id, fullName: "Camila Souza", email, role, isActive } };
}

/**
 * Contas exclusivamente sintéticas para as jornadas da 014: duas contas, só tutor, anfitrião pausado e admin.
 * Login e handlers de troca compartilham estes dados; a primeira conta preserva a demo da 003.
 * @example const owner = switchAccounts.find(account => account.scenario === "single");
 */
export const switchAccounts = [
  account("both", "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c", "tutora@pethost.test", "owner", true, "senha-de-teste"),
  account("both", "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d", "tutora@pethost.test", "host", true, "senha-do-host"),
  account(
    "single",
    "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b2c",
    "conta-unica@pethost.test",
    "owner",
    true,
    "senha-de-teste",
  ),
  account(
    "paused",
    "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b3c",
    "conta-pausada@pethost.test",
    "owner",
    true,
    "senha-de-teste",
  ),
  account(
    "paused",
    "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b3d",
    "conta-pausada@pethost.test",
    "host",
    false,
    "senha-do-host",
  ),
  account("admin", "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b4c", "equipe@pethost.test", "admin", true, "senha-da-equipe"),
];
