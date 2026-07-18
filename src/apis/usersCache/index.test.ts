import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { GET_USERS_KEY } from "@/apis/keys";
import type { User } from "@/features/UserList/logics";
import type { UsersRepository } from "@/repositories/usersRepository";

import { makeUsersCache } from "./index";

const USERS_SNAPSHOT_KEY = [...GET_USERS_KEY, "snapshot"] as const;

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

function setup(initial: User[] | null, snapshot?: User[], repository?: UsersRepository) {
  const queryClient = new QueryClient();
  if (initial !== null) {
    queryClient.setQueryData<User[]>(GET_USERS_KEY, initial);
  }
  if (snapshot) {
    queryClient.setQueryData<User[]>(USERS_SNAPSHOT_KEY, snapshot);
  }
  const repo = repository ?? fakeRepository(async () => []);
  return { queryClient, cache: makeUsersCache(queryClient, repo), repository: repo };
}

const noopContext = {} as QueryFunctionContext<typeof GET_USERS_KEY>;

describe("makeUsersCache", () => {
  describe("query", () => {
    it("returns the users from the repository", async () => {
      const users = [user("alice"), user("bob")];
      const { cache } = setup(null, undefined, fakeRepository(async () => users));

      const result = await cache.query().queryFn!(noopContext);

      expect(result).toEqual(users);
    });

    it("writes the snapshot on the first call", async () => {
      const users = [user("alice"), user("bob")];
      const { queryClient, cache } = setup(null, undefined, fakeRepository(async () => users));

      await cache.query().queryFn!(noopContext);

      expect(queryClient.getQueryData<User[]>(USERS_SNAPSHOT_KEY)).toEqual(users);
    });

    it("does not overwrite the snapshot on subsequent calls", async () => {
      const first = [user("alice")];
      const second = [user("alice"), user("bob")];
      const getUsers = vi
        .fn<UsersRepository["getUsers"]>()
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce(second);
      const { queryClient, cache } = setup(null, undefined, fakeRepository(getUsers));

      await cache.query().queryFn!(noopContext);
      await cache.query().queryFn!(noopContext);

      expect(queryClient.getQueryData<User[]>(USERS_SNAPSHOT_KEY)).toEqual(first);
    });

    it("propagates errors from the repository", async () => {
      const getUsers = vi.fn<UsersRepository["getUsers"]>().mockRejectedValue(new Error("boom"));
      const { cache } = setup(null, undefined, fakeRepository(getUsers));

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

    it("does not touch the snapshot key", () => {
      const alice = user("alice");
      const bob = user("bob");
      const snapshot = [alice, bob];
      const { queryClient, cache } = setup([alice], snapshot);

      cache.remove("alice");

      expect(queryClient.getQueryData<User[]>(USERS_SNAPSHOT_KEY)).toEqual(snapshot);
    });
  });

  describe("reset", () => {
    it("restores the snapshot to the main key", () => {
      const alice = user("alice");
      const bob = user("bob");
      const { queryClient, cache } = setup([bob], [alice, bob]);

      cache.reset();

      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toEqual([alice, bob]);
    });

    it("does nothing when no snapshot exists", () => {
      const alice = user("alice");
      const { queryClient, cache } = setup([alice]);

      cache.reset();

      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toEqual([alice]);
    });

    it("round-trips: remove then reset brings back the snapshot", () => {
      const alice = user("alice");
      const bob = user("bob");
      const { queryClient, cache } = setup([alice, bob], [alice, bob]);

      cache.remove("alice");
      cache.reset();

      expect(queryClient.getQueryData<User[]>(GET_USERS_KEY)).toEqual([alice, bob]);
    });
  });
});