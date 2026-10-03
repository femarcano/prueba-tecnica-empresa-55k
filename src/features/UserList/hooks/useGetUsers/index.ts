import { useMemo } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";

import { makeUsersCache } from "@/apis/usersCache";
import { HttpUsersRepository } from "@/repositories/usersRepository";

const httpUsersRepository = new HttpUsersRepository();

export const useGetUsers = () => {
  const queryClient = useQueryClient();
  const cache = useMemo(() => makeUsersCache(queryClient, httpUsersRepository), [queryClient]);

  const { data: users } = useSuspenseQuery(cache.query());

  return {
    onDelete: cache.remove,
    onReset: cache.reset,
    users,
  };
};