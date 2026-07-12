import type { UsersRepository } from "@/repositories/usersRepository";

import { useUserList } from "./hooks";
import { UserListPresentation } from "./presentations";

interface UserListProps {
  repository: UsersRepository;
}

export const UserList = ({ repository }: UserListProps) => {
  const {
    state: {
      users,
      showColors,
      sortByCountry,
      filterCountry,
      sortedUsers,
      isLoading,
      usersError,
      tableData,
    },
    actions: { toggleColors, toggleSortByCountry, setFilterCountry, onDelete, onReset },
  } = useUserList(repository);

  return (
    <UserListPresentation
      error={usersError}
      filterCountry={filterCountry}
      isLoading={isLoading}
      onDelete={onDelete}
      onReset={onReset}
      setFilterCountry={setFilterCountry}
      showColors={showColors}
      sortByCountry={sortByCountry}
      sortedUsers={sortedUsers}
      tableData={tableData}
      toggleColors={toggleColors}
      toggleSortByCountry={toggleSortByCountry}
      users={users}
    />
  );
};
