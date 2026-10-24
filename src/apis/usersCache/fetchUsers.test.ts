import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { fetchUsers } from "./fetchUsers";

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
    picture: {
      large: "https://example.com/large.jpg",
      medium: "https://example.com/medium.jpg",
      thumbnail: "https://example.com/thumb.jpg",
    },
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

function fetchResponse(status: number, body: unknown) {
  return {
    status,
    text: async () => JSON.stringify(body),
    headers: new Headers(),
  };
}

describe("fetchUsers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed User[] when the payload is valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        fetchResponse(200, payload([validUser(), validUser({ email: "two@example.com" })])),
      ),
    );

    const users = await fetchUsers();

    expect(users).toHaveLength(2);
    expect(users[0].email).toBe("test@example.com");
    expect(users[0].dob.date).toBe("1990-01-01T00:00:00.000Z");
  });

  it("throws a ZodError when a user field has the wrong shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fetchResponse(200, payload([validUser({ email: 12345 })]))),
    );

    await expect(fetchUsers()).rejects.toBeInstanceOf(ZodError);
  });

  it("throws a ZodError when the payload is not an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fetchResponse(200, { results: { not: "an array" }, info: {} })),
    );

    await expect(fetchUsers()).rejects.toBeInstanceOf(ZodError);
  });

  it("propagates non-validation errors from fetch unchanged", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    await expect(fetchUsers()).rejects.toThrow("network down");
  });

  it("throws a descriptive HTTP error when the upstream is non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fetchResponse(503, { error: "down" })),
    );

    await expect(fetchUsers()).rejects.toThrow(/503/);
  });

  // Regression: the upstream emits a distinct name.title per locale. The
  // enum in openapi.yaml used to omit "Monsieur", which the API returns
  // for French-speaking users. One such user in a payload of 100 made
  // the whole parse throw, so the table rendered nothing at all.
  it.each(["Mr", "Mademoiselle", "Monsieur", "Mrs", "Ms", "Miss", "Madame"])(
    "accepts the %s title",
    async (title) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          fetchResponse(
            200,
            payload([validUser({ name: { title, first: "Test", last: "User" } })]),
          ),
        ),
      );

      const users = await fetchUsers();

      expect(users).toHaveLength(1);
      expect(users[0].name.title).toBe(title);
    },
  );

  it("accepts a payload where one user has the Monsieur title", async () => {
    const users = Array.from({ length: 100 }, (_, i) =>
      validUser({
        name: { title: i === 37 ? "Monsieur" : "Mr", first: "Test", last: "User" },
      }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fetchResponse(200, payload(users))),
    );

    const result = await fetchUsers();

    expect(result).toHaveLength(100);
    expect(result[37].name.title).toBe("Monsieur");
  });

  // Regression: the upstream builds the address as "<first>.<last>@..."
  // without sanitising the name, so a name ending in a dot produces a
  // malformed address. This shows up roughly once per 3000 users and
  // used to fail the whole payload.
  it("accepts the malformed email the upstream produces for a name ending in a dot", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        fetchResponse(
          200,
          payload([
            validUser({
              name: { title: "Mr", first: "Hans-J.", last: "Schaub" },
              email: "hans-j..schaub@example.com",
            }),
          ]),
        ),
      ),
    );

    const users = await fetchUsers();

    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("hans-j..schaub@example.com");
  });
});
