import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { GET_USERS_KEY } from "@/apis/keys";

import { fetchUsers, type User } from "./fetchUsers";

export type { User };

export function makeUsersCache(queryClient: QueryClient) {
  return {
    query() {
      return queryOptions({
        queryFn: fetchUsers,
        queryKey: GET_USERS_KEY,
        staleTime: 1000 * 60 * 5,
      });
    },
    remove(uuid: string): void {
      queryClient.setQueryData<User[]>(GET_USERS_KEY, (old) =>
        old ? old.filter((user) => user.login.uuid !== uuid) : old,
      );
    },
    reset(): void {
      queryClient.invalidateQueries({ queryKey: GET_USERS_KEY });
    },
  };
}