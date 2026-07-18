import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { GET_USERS_KEY } from "@/apis/keys";
import type { User } from "@/features/UserList/logics";

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

function setup(initial: User[], snapshot?: User[]) {
  const queryClient = new QueryClient();
  queryClient.setQueryData<User[]>(GET_USERS_KEY, initial);
  if (snapshot) {
    queryClient.setQueryData<User[]>(USERS_SNAPSHOT_KEY, snapshot);
  }
  return { queryClient, cache: makeUsersCache(queryClient) };
}

describe("makeUsersCache", () => {
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
      const cache = makeUsersCache(queryClient);

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