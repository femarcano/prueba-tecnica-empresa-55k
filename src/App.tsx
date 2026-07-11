import { useRef, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import "./App.css";
import { UsersList } from "./components/UsersList";
import type { UsersRepository } from "./repositories/usersRepository";
import type { User } from "./types/user";

interface AppProps {
  repository: UsersRepository;
}

function App({ repository }: AppProps) {
  const [showColors, setShowColors] = useState(false);
  const [sortByCountry, setSortByCountry] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: users = null, isLoading, error } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => repository.getUsers(),
  });

  const originalUsersRef = useRef<User[] | null>(null);
  if (users && originalUsersRef.current === null) {
    originalUsersRef.current = users;
  }

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
    queryClient.setQueryData<User[]>(["users"], (old) =>
      old ? old.filter((user) => user.login.uuid !== uuid) : old
    );
  };

  const handleReset = () => {
    if (originalUsersRef.current) {
      queryClient.setQueryData<User[]>(["users"], originalUsersRef.current);
    }
  };

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
        {isLoading && <p>Loading users…</p>}
        {error && <p>Error loading users.</p>}
        {!isLoading && !error && (
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