import { useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import "./App.css";
import { UsersDirectoryView } from "./features/usersList/presentations";
import type { UsersRepository } from "./repositories/usersRepository";
import type { User } from "./types/user";

interface AppProps {
  repository: UsersRepository;
}

function App({ repository }: AppProps) {
  const queryClient = useQueryClient();
  const { data: users = null, isLoading, error } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => repository.getUsers(),
  });

  const originalUsersRef = useRef<User[] | null>(null);
  if (users && originalUsersRef.current === null) {
    originalUsersRef.current = users;
  }

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
    <UsersDirectoryView
      users={users}
      isLoading={isLoading}
      error={error as Error | null}
      onDelete={handleDelete}
      onReset={handleReset}
    />
  );
}

export default App;