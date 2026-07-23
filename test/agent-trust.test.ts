import { describe, expect, it } from "vitest";

import { evaluateWorkspaceTrust } from "../src/agent-trust.cjs";

describe("workspace trust evaluation", () => {
  it("continues when the workspace is trusted", () => {
    expect(
      evaluateWorkspaceTrust({ ok: true, projects: { "/repo": { hasTrustDialogAccepted: true } } }, "/repo"),
    ).toBe("trusted");
  });

  it("warns and continues when the trust state cannot be determined", () => {
    expect(evaluateWorkspaceTrust({ ok: false }, "/repo")).toBe("unknown");
  });
});
