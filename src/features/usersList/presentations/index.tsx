import { useState, useMemo } from "react";
import { UsersList } from "../../../components/UsersList";
import type { User } from "../../../types/user";

interface UsersDirectoryProps {
  users: User[] | null;
  isLoading: boolean;
  error: Error | null;
  onDelete: (uuid: string) => void;
  onReset: () => void;
}

export function UsersDirectoryView({
  users,
  isLoading,
  error,
  onDelete,
  onReset,
}: UsersDirectoryProps) {
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

  return (
    <div className="App">
      <h1>Test</h1>
      <header>
        <button onClick={toggleColors}>toggle Colors</button>
        <button onClick={toggleSortByCountry}>
          {sortByCountry ? "no sort by country" : "sort by country"}
        </button>
        <button onClick={onReset}>Reset Users</button>
        <input
          placeholder="Filter by Country"
          onChange={(e) => {
            setFilterCountry(e.target.value);
          }}
        ></input>
      </header>
      <main>
        {isLoading && <p>Loading users…</p>}
        {error && <p>Error loading users.</p>}
        {!isLoading && !error && (
          <UsersList
            deleteUser={onDelete}
            showColors={showColors}
            users={sortedUsers}
          />
        )}
      </main>
    </div>
  );
}