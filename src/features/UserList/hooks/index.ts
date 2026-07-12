import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import type { UsersRepository } from "@/repositories/usersRepository";

import { createUserDataTableColumns } from "../logics";
import { useGetUsers } from "./useGetUsers";

export const useUserList = (repository: UsersRepository) => {
  const { users, isLoading, error, onDelete, onReset } = useGetUsers(repository);

  const [showColors, setShowColors] = useState(false);
  const [sortByCountry, setSortByCountry] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return filterCountry !== null && filterCountry.length > 0 && users
      ? users.filter((user) => {
          return user.location.country.toLocaleLowerCase().includes(filterCountry.toLowerCase());
        })
      : users;
  }, [users, filterCountry]);

  const sortedUsers = useMemo(() => {
    return sortByCountry
      ? [...(filteredUsers ?? [])].sort((a, b) => {
          return a.location.country.localeCompare(b.location.country);
        })
      : filteredUsers;
  }, [filteredUsers, sortByCountry]);

  const tableData = useReactTable({
    columns: createUserDataTableColumns({ onDelete }),
    data: sortedUsers ?? [],
    getCoreRowModel: getCoreRowModel(),
  });

  const toggleColors = () => {
    setShowColors(!showColors);
  };

  const toggleSortByCountry = () => {
    setSortByCountry((prevState) => !prevState);
  };

  return {
    state: {
      showColors,
      sortByCountry,
      filterCountry,
      sortedUsers,
      isLoading,
      usersError: error,
      users,
      tableData,
    },
    actions: {
      toggleColors,
      toggleSortByCountry,
      setFilterCountry,
      onDelete,
      onReset,
    },
  };
};
