import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { User } from "../logics";
import { UsersList } from "./UsersList";

type UserListPresentation = {
  users: User[] | null;
  isLoading: boolean;
  error: Error | null;
  onDelete: (uuid: string) => void;
  onReset: () => void;
  showColors: boolean;
  toggleColors: () => void;
  sortByCountry: boolean;
  toggleSortByCountry: () => void;
  setFilterCountry: (country: string) => void;
  sortedUsers: User[] | null;
  filterCountry: string | null;
};

export const UserListPresentation: React.FC<UserListPresentation> = ({
  toggleColors,
  toggleSortByCountry,
  onReset,
  setFilterCountry,
  isLoading,
  error,
  sortedUsers,
  showColors,
  onDelete,
  sortByCountry,
}) => {
  return (
    <div className="App">
      <h1>Test</h1>
      <header className="flex flex-row">
        <Button onClick={toggleColors}>toggle Colors</Button>
        <Button onClick={toggleSortByCountry}>
          {sortByCountry ? "no sort by country" : "sort by country"}
        </Button>
        <Button onClick={onReset}>Reset Users</Button>
        <Input
          placeholder="Filter by Country"
          onChange={(e) => {
            setFilterCountry(e.target.value);
          }}
        ></Input>
      </header>
      <main>
        {isLoading && <p>Loading users…</p>}
        {error && <p>Error loading users.</p>}
        {!isLoading && !error && (
          <UsersList deleteUser={onDelete} showColors={showColors} users={sortedUsers} />
        )}
      </main>
    </div>
  );
};
