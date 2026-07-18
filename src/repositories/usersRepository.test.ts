import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { HttpUsersRepository } from "./usersRepository";

function validUser(overrides: Record<string, unknown> = {}) {
  return {
    gender: "male",
    name: { title: "Mr", first: "Test", last: "User" },
    location: {
      street: { number: 1, name: "Main St" },
      city: "Springfield",
      state: "IL",
      country: "US",
      postcode: 62701,
      coordinates: { latitude: "0", longitude: "0" },
      timezone: { offset: "+0:00", description: "UTC" },
    },
    email: "test@example.com",
    login: {
      uuid: "11111111-1111-4111-8111-111111111111",
      username: "tester",
      password: "",
      salt: "",
      md5: "",
      sha1: "",
      sha256: "",
    },
    dob: { date: "1990-01-01T00:00:00.000Z", age: 30 },
    registered: { date: "2024-01-01T00:00:00.000Z", age: 0 },
    phone: "",
    cell: "",
    id: { name: "SSN", value: null },
    picture: { large: "", medium: "", thumbnail: "" },
    nat: "US",
    ...overrides,
  };
}

function payload(users: unknown[]) {
  return {
    results: users,
    info: { seed: "abc", results: users.length, page: 1, version: "1.4" },
  };
}

describe("HttpUsersRepository", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed User[] when the payload is valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => payload([validUser(), validUser({ email: "two@example.com" })]),
      })),
    );

    const repo = new HttpUsersRepository();
    const users = await repo.getUsers();

    expect(users).toHaveLength(2);
    expect(users[0].email).toBe("test@example.com");
    expect(users[0].dob.date).toBeInstanceOf(Date);
    expect(users[0].dob.date.toISOString()).toBe("1990-01-01T00:00:00.000Z");
  });

  it("throws a ZodError when a user field has the wrong shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => payload([validUser({ email: 12345 })]),
      })),
    );

    const repo = new HttpUsersRepository();

    await expect(repo.getUsers()).rejects.toBeInstanceOf(ZodError);
  });

  it("throws a ZodError when the payload is not an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ results: { not: "an array" }, info: {} }),
      })),
    );

    const repo = new HttpUsersRepository();

    await expect(repo.getUsers()).rejects.toBeInstanceOf(ZodError);
  });

  it("propagates non-validation errors from fetch unchanged", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const repo = new HttpUsersRepository();

    await expect(repo.getUsers()).rejects.toThrow("network down");
  });
});
