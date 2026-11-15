import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { createUserDataTableColumns } from "../logics";
import { useGetUsers } from "./useGetUsers";

export const useUserList = () => {
  "use no memo";

  const { users, onDelete, onReset } = useGetUsers();

  const [showColors, setShowColors] = useState(false);
  const [sortByCountry, setSortByCountry] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return filterCountry !== null && filterCountry.length > 0
      ? users.filter((user) => {
          return user.location.country.toLocaleLowerCase().includes(filterCountry.toLowerCase());
        })
      : users;
  }, [users, filterCountry]);

  const sortedUsers = useMemo(() => {
    return sortByCountry
      ? [...filteredUsers].sort((a, b) => {
          return a.location.country.localeCompare(b.location.country);
        })
      : filteredUsers;
  }, [filteredUsers, sortByCountry]);

  // TanStack Table v8's `useReactTable` returns a table with interior mutability: the object
  // keeps its reference while its contents change. Memoizing it would freeze the UI, so this
  // hook opts out of compilation with "use no memo" above. The rule that reports it is
  // suppressed on the line that calls it, because the opt-out is already declared.
  // oxlint-disable-next-line react/incompatible-library
  const tableData = useReactTable({
    columns: createUserDataTableColumns({ onDelete }),
    data: sortedUsers,
    getCoreRowModel: getCoreRowModel(),
  });

  const toggleColors = () => {
    setShowColors(!showColors);
  };

  const toggleSortByCountry = () => {
    setSortByCountry((prevState) => !prevState);
  };

  return {
    actions: {
      onDelete,
      onReset,
      setFilterCountry,
      toggleColors,
      toggleSortByCountry,
    },
    state: {
      filterCountry,
      showColors,
      sortByCountry,
      sortedUsers,
      tableData,
      users,
    },
  };
};
