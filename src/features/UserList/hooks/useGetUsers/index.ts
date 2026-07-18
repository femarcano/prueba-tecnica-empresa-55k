import { useQuery, useQueryClient } from "@tanstack/react-query";

import { makeUsersCache } from "@/apis/usersCache";

export const useGetUsers = () => {
  const queryClient = useQueryClient();
  const cache = makeUsersCache(queryClient);

  const { data: users = null, isLoading, error } = useQuery(cache.query());

  return {
    error,
    isLoading,
    onDelete: cache.remove,
    onReset: cache.reset,
    users,
  };
};