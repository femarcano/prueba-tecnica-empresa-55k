import { useQuery, useQueryClient } from "@tanstack/react-query";

import { makeUsersCache } from "@/apis/usersCache";
import { useRepositories } from "@/contexts/RepositoriesContext";

export const useGetUsers = () => {
  const queryClient = useQueryClient();
  const { users: usersRepository } = useRepositories();
  const cache = makeUsersCache(queryClient, usersRepository);

  const { data: users = null, isLoading, error } = useQuery(cache.query());

  return {
    error,
    isLoading,
    onDelete: cache.remove,
    onReset: cache.reset,
    users,
  };
};