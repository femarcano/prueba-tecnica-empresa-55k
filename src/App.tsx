import { useEffect, useRef, useState, useMemo } from "react";
import "./App.css";
import { UsersList } from "./components/UsersList";

function App() {
  const [users, setUsers] = useState<User[] | null>(null);
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
    fetch("https://randomuser.me/api/?results=100")
      .then((res) => res.json())
      .then((res: APIResult) => {
        setUsers(res.results);
        originalUsersRef.current = res.results;
      })
      .catch((err) => console.error(err));
  }, []);

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
        <UsersList
          deleteUser={handleDelete}
          showColors={showColors}
          users={sortedUsers}
        />
      </main>
    </div>
  );
}

export default App;
