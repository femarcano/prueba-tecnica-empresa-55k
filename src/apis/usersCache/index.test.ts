import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { GET_USERS_KEY } from "@/apis/keys";
import type { User } from "@/features/UserList/logics";
import type { UsersRepository } from "@/repositories/usersRepository";

import { makeUsersCache } from "./index";

function user(uuid: string): User {
  return {
    gender: "female",
    name: { title: "Ms", first: "Test", last: uuid },
    login: { uuid, username: uuid, password: "", salt: "", md5: "", sha1: "", sha256: "" },
    email: `${uuid}@example.com`,
    dob: { date: new Date("1990-01-01"), age: 0 },
    registered: { date: new Date("2024-01-01"), age: 0 },
    phone: "",
    cell: "",
    id: { name: "", value: null },
    picture: { large: "", medium: "", thumbnail: "" },
    nat: "",
  } as unknown as User;
}

function fakeRepository(getUsers: UsersRepository["getUsers"]): UsersRepository {
  return { getUsers: vi.fn(getUsers) };
}

function setup(initial: User[] | null, repository?: UsersRepository) {
  const queryClient = new QueryClient();
  if (initial !== null) {
    queryClient.setQueryData<User[]>(GET_USERS_KEY, initial);
  }
  const repo = repository ?? fakeRepository(async () => []);
  return { queryClient, cache: makeUsersCache(queryClient, repo), repository: repo };
}

const noopContext = {} as QueryFunctionContext<typeof GET_USERS_KEY>;

describe("makeUsersCache", () => {
  describe("query", () => {
    it("returns the users from the repository", async () => {
      const users = [user("alice"), user("bob")];
      const { cache } = setup(null, fakeRepository(async () => users));

      const result = await cache.query().queryFn!(noopContext);

      expect(result).toEqual(users);
    });

    it("propagates errors from the repository", async () => {
      const getUsers = vi.fn<UsersRepository["getUsers"]>().mockRejectedValue(new Error("boom"));
      const { cache } = setup(null, fakeRepository(getUsers));

      await expect(cache.query().queryFn!(noopContext)).rejects.toThrow("boom");
    });
  });

  describe("remove", () => {
    it("filters the user with the matching uuid out of the cache", () => {
      const alice = user("alice");
      const bob = user("bob");
      const { queryClient, cache } = setup([alice, bob]);

      cache.remove("alice");

      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toEqual([bob]);
    });

    it("leaves the cache unchanged in content when the uuid is unknown", () => {
      const alice = user("alice");
      const { queryClient, cache } = setup([alice]);

      cache.remove("bob");

      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toEqual([alice]);
    });

    it("does nothing when the cache has no data", () => {
      const queryClient = new QueryClient();
      const cache = makeUsersCache(queryClient, fakeRepository(async () => []));

      cache.remove("alice");

      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toBeUndefined();
    });

    it("leaves an empty array empty", () => {
      const { queryClient, cache } = setup([]);

      cache.remove("alice");

      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toEqual([]);
    });
  });

  describe("reset", () => {
    it("invalidates the users query so the next fetch returns fresh data", async () => {
      const initial = [user("alice")];
      const refreshed = [user("alice"), user("bob")];
      const getUsers = vi
        .fn<UsersRepository["getUsers"]>()
        .mockResolvedValueOnce(initial)
        .mockResolvedValueOnce(refreshed);
      const queryClient = new QueryClient();
      const cache = makeUsersCache(queryClient, fakeRepository(getUsers));

      expect(await queryClient.fetchQuery(cache.query())).toEqual(initial);

      cache.reset();
      expect(await queryClient.fetchQuery(cache.query())).toEqual(refreshed);
    });

    it("does nothing when no data is cached", () => {
      const { cache } = setup(null);

      expect(() => cache.reset()).not.toThrow();
    });

    it("round-trips: remove then reset brings back the full list from the API", async () => {
      const alice = user("alice");
      const bob = user("bob");
      const getUsers = vi.fn<UsersRepository["getUsers"]>().mockResolvedValue([alice, bob]);
      const queryClient = new QueryClient();
      const cache = makeUsersCache(queryClient, fakeRepository(getUsers));

      await queryClient.fetchQuery(cache.query());
      cache.remove("alice");
      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toEqual([bob]);

      cache.reset();
      expect(await queryClient.fetchQuery(cache.query())).toEqual([alice, bob]);
    });

    it("surfaces upstream changes: reset reflects new users that appeared since the first fetch", async () => {
      const first = [user("alice")];
      const withNewcomer = [user("alice"), user("newcomer")];
      const getUsers = vi
        .fn<UsersRepository["getUsers"]>()
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce(withNewcomer);
      const queryClient = new QueryClient();
      const cache = makeUsersCache(queryClient, fakeRepository(getUsers));

      await queryClient.fetchQuery(cache.query());

      cache.reset();
      expect(await queryClient.fetchQuery(cache.query())).toEqual(withNewcomer);
    });

    it("suspendable round-trip: returns prefilled cache without hitting the repo, then refetches after reset", async () => {
      const prefilled = [user("alice")];
      const refreshed = [user("bob")];
      const getUsers = vi.fn<UsersRepository["getUsers"]>().mockResolvedValue(refreshed);
      const queryClient = new QueryClient();
      const cache = makeUsersCache(queryClient, fakeRepository(getUsers));

      queryClient.setQueryData<User[]>(GET_USERS_KEY, prefilled);

      expect(await queryClient.fetchQuery(cache.query())).toEqual(prefilled);
      expect(getUsers).not.toHaveBeenCalled();

      cache.reset();

      expect(await queryClient.fetchQuery(cache.query())).toEqual(refreshed);
      expect(getUsers).toHaveBeenCalledTimes(1);
    });
  });
});
