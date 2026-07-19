import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { GET_USERS_KEY } from "@/apis/keys";
import { User } from "@/features/UserList/logics";
import type { UsersRepository } from "@/repositories/usersRepository";

export function makeUsersCache(queryClient: QueryClient, repository: UsersRepository) {
  return {
    query() {
      return queryOptions({
        queryFn: () => repository.getUsers(),
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
