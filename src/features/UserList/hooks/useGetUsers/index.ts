import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";

import { makeUsersCache } from "@/apis/usersCache";

export const useGetUsers = () => {
  const queryClient = useQueryClient();
  const cache = makeUsersCache(queryClient);

  const { data: users } = useSuspenseQuery(cache.query());

  return {
    onDelete: cache.remove,
    onReset: cache.reset,
    users,
  };
};