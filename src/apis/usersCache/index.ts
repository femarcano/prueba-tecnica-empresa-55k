import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { GET_USERS_KEY } from "@/apis/keys";
import { HttpUsersRepository } from "@/repositories/usersRepository";
import { User } from "@/features/UserList/logics";

const USERS_SNAPSHOT_KEY = [...GET_USERS_KEY, "snapshot"] as const;

const httpUsersRepository = new HttpUsersRepository();

// HttpUsersRepository is wired at module scope because the composition
// root has not been lifted to main.tsx yet (see #6). Until then, only
// remove() and reset() are testable against a fresh QueryClient; query()
// always hits the production adapter.

export function makeUsersCache(queryClient: QueryClient) {
  return {
    query() {
      return queryOptions({
        queryFn: async () => {
          const users = await httpUsersRepository.getUsers();
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