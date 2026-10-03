import { useMemo } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";

import { makeUsersCache } from "@/apis/usersCache";

export const useGetUsers = () => {
  const queryClient = useQueryClient();
  const cache = useMemo(() => makeUsersCache(queryClient), [queryClient]);

  const { data: users } = useSuspenseQuery(cache.query());

  return {
    onDelete: cache.remove,
    onReset: cache.reset,
    users,
  };
};