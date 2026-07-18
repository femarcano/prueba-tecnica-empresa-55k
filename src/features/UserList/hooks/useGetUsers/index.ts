import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { getUsers } from "@/apis/queries/getUsers";

import { User } from "../../logics";

export const useGetUsers = () => {
  const queryClient = useQueryClient();
  const { data: users = null, isLoading, error } = useQuery(getUsers());

  const originalUsersRef = useRef<User[] | null>(null);
  if (users && originalUsersRef.current === null) {
    originalUsersRef.current = users;
  }

  const handleDelete = (uuid: string) => {
    queryClient.setQueryData<User[]>(["users"], (old) =>
      old ? old.filter((user) => user.login.uuid !== uuid) : old,
    );
  };

  const handleReset = () => {
    if (originalUsersRef.current) {
      queryClient.setQueryData<User[]>(["users"], originalUsersRef.current);
    }
  };
  return {
    error,
    isLoading,
    onDelete: handleDelete,
    onReset: handleReset,
    users,
  };
};
