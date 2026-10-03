import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET_USERS_KEY } from "@/apis/keys";
import type { User } from "@/apis/usersCache";

import { makeUsersCache } from "./index";

function makeUser(overrides: Partial<User> & Pick<User, "login">): User {
  const base = {
    gender: "female",
    name: { title: "Ms", first: "Test", last: "User" },
    location: {
      street: { number: 1, name: "Main St" },
      city: "Springfield",
      state: "IL",
      country: "US",
      postcode: 62701,
      coordinates: { latitude: "0", longitude: "0" },
      timezone: { offset: "+0:00", description: "UTC" },
    },
    email: `${overrides.login.username}@example.com`,
    dob: { date: "1990-01-01T00:00:00.000Z", age: 0 },
    registered: { date: "2024-01-01T00:00:00.000Z", age: 0 },
    phone: "",
    cell: "",
    id: { name: "", value: null },
    picture: {
      large: "https://example.com/large.jpg",
      medium: "https://example.com/medium.jpg",
      thumbnail: "https://example.com/thumb.jpg",
    },
    nat: "",
  };
  return { ...base, ...overrides } as unknown as User;
}

const alice = makeUser({
  login: {
    uuid: "11111111-1111-4111-8111-111111111111",
    username: "alice",
    password: "",
    salt: "",
    md5: "",
    sha1: "",
    sha256: "",
  },
});
const bob = makeUser({
  login: {
    uuid: "22222222-2222-4222-8222-222222222222",
    username: "bob",
    password: "",
    salt: "",
    md5: "",
    sha1: "",
    sha256: "",
  },
});
const newcomer = makeUser({
  login: {
    uuid: "33333333-3333-4333-8333-333333333333",
    username: "newcomer",
    password: "",
    salt: "",
    md5: "",
    sha1: "",
    sha256: "",
  },
});

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

function setup(initial: User[] | null) {
  const queryClient = new QueryClient();
  if (initial !== null) {
    queryClient.setQueryData<User[]>(GET_USERS_KEY, initial);
  }
  return { queryClient, cache: makeUsersCache(queryClient) };
}

const noopContext = {} as QueryFunctionContext<typeof GET_USERS_KEY>;

describe("makeUsersCache", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("query", () => {
    it("returns the users from the upstream", async () => {
      const users = [alice, bob];
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => fetchResponse(200, payload(users))),
      );
      const { cache } = setup(null);

      const result = await cache.query().queryFn!(noopContext);

      expect(result).toEqual(users);
    });

    it("propagates errors from fetch", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new Error("boom");
        }),
      );
      const { cache } = setup(null);

      await expect(cache.query().queryFn!(noopContext)).rejects.toThrow("boom");
    });
  });

  describe("remove", () => {
    it("filters the user with the matching uuid out of the cache", () => {
      const { queryClient, cache } = setup([alice, bob]);

      cache.remove("11111111-1111-4111-8111-111111111111");

      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toEqual([bob]);
    });

    it("leaves the cache unchanged in content when the uuid is unknown", () => {
      const { queryClient, cache } = setup([alice]);

      cache.remove("22222222-2222-4222-8222-222222222222");

      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toEqual([alice]);
    });

    it("does nothing when the cache has no data", () => {
      const queryClient = new QueryClient();
      const cache = makeUsersCache(queryClient);

      cache.remove("11111111-1111-4111-8111-111111111111");

      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toBeUndefined();
    });

    it("leaves an empty array empty", () => {
      const { queryClient, cache } = setup([]);

      cache.remove("11111111-1111-4111-8111-111111111111");

      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toEqual([]);
    });
  });

  describe("reset", () => {
    it("invalidates the users query so the next fetch returns fresh data", async () => {
      const initial = [alice];
      const refreshed = [alice, bob];
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce(fetchResponse(200, payload(initial)) as Response)
        .mockResolvedValueOnce(fetchResponse(200, payload(refreshed)) as Response);
      vi.stubGlobal("fetch", fetch);

      const queryClient = new QueryClient();
      const cache = makeUsersCache(queryClient);

      expect(await queryClient.fetchQuery(cache.query())).toEqual(initial);

      cache.reset();
      expect(await queryClient.fetchQuery(cache.query())).toEqual(refreshed);
    });

    it("does nothing when no data is cached", () => {
      const { cache } = setup(null);

      expect(() => cache.reset()).not.toThrow();
    });

    it("round-trips: remove then reset brings back the full list from the API", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => fetchResponse(200, payload([alice, bob])) as Response),
      );

      const queryClient = new QueryClient();
      const cache = makeUsersCache(queryClient);

      await queryClient.fetchQuery(cache.query());
      cache.remove("11111111-1111-4111-8111-111111111111");
      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toEqual([bob]);

      cache.reset();
      expect(await queryClient.fetchQuery(cache.query())).toEqual([alice, bob]);
    });

    it("surfaces upstream changes: reset reflects new users that appeared since the first fetch", async () => {
      const first = [alice];
      const withNewcomer = [alice, newcomer];
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce(fetchResponse(200, payload(first)) as Response)
        .mockResolvedValueOnce(fetchResponse(200, payload(withNewcomer)) as Response);
      vi.stubGlobal("fetch", fetch);

      const queryClient = new QueryClient();
      const cache = makeUsersCache(queryClient);

      await queryClient.fetchQuery(cache.query());

      cache.reset();
      expect(await queryClient.fetchQuery(cache.query())).toEqual(withNewcomer);
    });

    it("suspendable round-trip: returns prefilled cache without hitting fetch, then refetches after reset", async () => {
      const prefilled = [alice];
      const refreshed = [bob];
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(fetchResponse(200, payload(refreshed)) as Response);
      vi.stubGlobal("fetch", fetch);

      const queryClient = new QueryClient();
      const cache = makeUsersCache(queryClient);

      queryClient.setQueryData<User[]>(GET_USERS_KEY, prefilled);

      expect(await queryClient.fetchQuery(cache.query())).toEqual(prefilled);
      expect(fetch).not.toHaveBeenCalled();

      cache.reset();

      expect(await queryClient.fetchQuery(cache.query())).toEqual(refreshed);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});