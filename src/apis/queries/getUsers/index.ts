import { queryOptions } from "@tanstack/react-query";

import { HttpUsersRepository } from "@/repositories/usersRepository";

const httpUSerReposotory = new HttpUsersRepository();

export function getUsers() {
  return queryOptions({
    queryFn: () => httpUSerReposotory.getUsers(),
    queryKey: ["users"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
