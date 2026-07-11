import { useMemo, useState } from "react";
import { useGetUsers } from "./useGetUsers";

export const useUserList = () => {
  const { users, isLoading, error, onDelete, onReset } = useGetUsers();

  const [showColors, setShowColors] = useState(false);
  const [sortByCountry, setSortByCountry] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return filterCountry !== null && filterCountry.length > 0 && users
      ? users.filter((user) => {
          return user.location.country
            .toLocaleLowerCase()
            .includes(filterCountry.toLowerCase());
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
