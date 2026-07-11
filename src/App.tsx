import { useEffect, useRef, useState, useMemo } from "react";
import "./App.css";
import { UsersList } from "./components/UsersList";
import type { UsersRepository } from "./repositories/usersRepository";
import type { User } from "./types/user";

interface AppProps {
  repository: UsersRepository;
}

function App({ repository }: AppProps) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showColors, setShowColors] = useState(false);
  const [sortByCountry, setSortByCountry] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string | null>(null);
  const originalUsersRef = useRef<User[] | null>(null);

  const toggleColors = () => {
    setShowColors(!showColors);
  };
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

  const toggleSortByCountry = () => {
    setSortByCountry((prevState) => !prevState);
  };

  const handleDelete = (uuid: string) => {
    const filteredUsers = users?.filter((user) => user.login.uuid !== uuid);
    setUsers(filteredUsers ?? null);
  };

  const handleReset = () => {
    setUsers(originalUsersRef.current);
  };

  useEffect(() => {
    repository
      .getUsers()
      .then((fetchedUsers) => {
        setUsers(fetchedUsers);
        originalUsersRef.current = fetchedUsers;
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [repository]);

  return (
    <div className="App">
      <h1>Test</h1>
      <header>
        <button onClick={toggleColors}>toggle Colors</button>
        <button onClick={toggleSortByCountry}>
          {sortByCountry ? "no sort by country" : "sort by country"}
        </button>
        <button onClick={handleReset}>Reset Users</button>
        <input
          placeholder="Filter by Country"
          onChange={(e) => {
            setFilterCountry(e.target.value);
          }}
        ></input>
      </header>
      <main>
        {loading && <p>Loading users…</p>}
        {error && <p>Error loading users.</p>}
        {!loading && !error && (
          <UsersList
            deleteUser={handleDelete}
            showColors={showColors}
            users={sortedUsers}
          />
        )}
      </main>
    </div>
  );
}

export default App;