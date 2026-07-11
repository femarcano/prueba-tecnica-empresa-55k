import "./App.css";
import { UserList } from "@/features/UserList";
import type { UsersRepository } from "@/repositories/usersRepository";

interface AppProps {
  repository: UsersRepository;
}

function App({ repository }: AppProps) {
  return <UserList repository={repository} />;
}

export default App;
