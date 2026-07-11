import { useUserList } from "./hooks";
import { UserListPresentation } from "./presentations";
import type { UsersRepository } from "../../repositories/usersRepository";

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
    },
    actions: {
      toggleColors,
      toggleSortByCountry,
      setFilterCountry,
      onDelete,
      onReset,
    },
  } = useUserList(repository);

  return (
    <UserListPresentation
      showColors={showColors}
      sortByCountry={sortByCountry}
      filterCountry={filterCountry}
      sortedUsers={sortedUsers}
      isLoading={isLoading}
      error={usersError}
      toggleColors={toggleColors}
      toggleSortByCountry={toggleSortByCountry}
      setFilterCountry={setFilterCountry}
      onDelete={onDelete}
      onReset={onReset}
      users={users}
    />
  );
};