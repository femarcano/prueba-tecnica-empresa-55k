import { useUserList } from "./hooks";
import { UserListPresentation } from "./presentations";

export const UserList = () => {
  const {
    state: { showColors, sortByCountry, filterCountry, tableData },
    actions: { toggleColors, toggleSortByCountry, setFilterCountry, onReset },
  } = useUserList();

  return (
    <UserListPresentation
      filterCountry={filterCountry}
      onReset={onReset}
      setFilterCountry={setFilterCountry}
      showColors={showColors}
      sortByCountry={sortByCountry}
      tableData={tableData}
      toggleColors={toggleColors}
      toggleSortByCountry={toggleSortByCountry}
    />
  );
};
