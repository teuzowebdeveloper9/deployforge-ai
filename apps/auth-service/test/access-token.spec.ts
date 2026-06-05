import { loadConfig } from "../src/shared/config/app.config";
import { createAccessToken, verifyAccessToken } from "../src/shared/security/access-token";

describe("access token", () => {
  it("signs and verifies HS256 access tokens", () => {
    const config = loadConfig();
    const created = createAccessToken(
      {
        userId: "user-1",
        email: "user@example.com",
        name: "User",
        organizationId: "org-1",
        role: "OWNER",
        plan: "FREE",
        sessionId: "session-1"
      },
      config
    );

    const claims = verifyAccessToken(created.token, config);
    expect(claims.sub).toBe("user-1");
    expect(claims.orgId).toBe("org-1");
    expect(claims.role).toBe("OWNER");
  });
});
