import { describe, expect, it } from "vitest";
import { sessionSchema, sessionUserSchema } from "./session";

const user = {
  id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
  fullName: "Camila Souza",
  email: "camila@exemplo.com",
  role: "owner",
  isActive: true,
};

describe("sessionSchema", () => {
  it("REQ-HTTP-007 aceita a resposta real, com campos null omitidos", () => {
    const parsed = sessionSchema.parse({ accessToken: "a", refreshToken: "r", expiresAt: 1791461700, user });

    expect(parsed.user.role).toBe("owner");
    expect(parsed.user.avatarUrl).toBeUndefined();
  });

  it("REQ-HTTP-015 estreita o papel para owner, host ou admin", () => {
    expect(sessionUserSchema.safeParse({ ...user, role: "root" }).success).toBe(false);
    expect(sessionUserSchema.parse({ ...user, role: "admin" }).role).toBe("admin");
  });
});
