import { useUserList } from "./hooks";
import { UserListPresentation } from "./presentations";

export const UserList = () => {
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
  } = useUserList();

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
