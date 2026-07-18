import { describe, expect, it } from "vitest";

import { HttpUsersRepository } from "@/repositories/usersRepository";

describe("vitest setup smoke test", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("has the jsdom environment loaded (window is defined)", () => {
    expect(typeof window).toBe("object");
  });

  it("supports async tests", async () => {
    const value = await Promise.resolve(42);
    expect(value).toBe(42);
  });

  it("resolves the @/ path alias to a real module", () => {
    expect(typeof HttpUsersRepository).toBe("function");
  });
});