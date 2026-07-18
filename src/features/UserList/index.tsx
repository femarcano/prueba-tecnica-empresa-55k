import { useUserList } from "./hooks";
import { UserListPresentation } from "./presentations";

export const UserList = () => {
  const {
    state: {
      showColors,
      sortByCountry,
      filterCountry,
      sortedUsers,
      isLoading,
      usersError,
      tableData,
    },
    actions: { toggleColors, toggleSortByCountry, setFilterCountry, onReset },
  } = useUserList();

  return (
    <UserListPresentation
      error={usersError}
      filterCountry={filterCountry}
      isLoading={isLoading}
      onReset={onReset}
      setFilterCountry={setFilterCountry}
      showColors={showColors}
      sortByCountry={sortByCountry}
      sortedUsers={sortedUsers}
      tableData={tableData}
      toggleColors={toggleColors}
      toggleSortByCountry={toggleSortByCountry}
    />
  );
};
