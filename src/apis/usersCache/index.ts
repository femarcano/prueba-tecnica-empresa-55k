import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { GET_USERS_KEY } from "@/apis/keys";
import type { UsersRepository } from "@/repositories/usersRepository";
import { User } from "@/features/UserList/logics";

const USERS_SNAPSHOT_KEY = [...GET_USERS_KEY, "snapshot"] as const;

export function makeUsersCache(queryClient: QueryClient, repository: UsersRepository) {
  return {
    query() {
      return queryOptions({
        queryFn: async () => {
          const users = await repository.getUsers();
          if (!queryClient.getQueryData<User[]>(USERS_SNAPSHOT_KEY)) {
            queryClient.setQueryData(USERS_SNAPSHOT_KEY, users);
          }
          return users;
        },
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
      const snapshot = queryClient.getQueryData<User[]>(USERS_SNAPSHOT_KEY);
      if (snapshot) {
        queryClient.setQueryData(GET_USERS_KEY, snapshot);
      }
    },
  };
}