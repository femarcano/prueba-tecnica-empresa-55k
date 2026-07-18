import { createContext, useContext } from "react";

import type { UsersRepository } from "@/repositories/usersRepository";

interface Repositories {
  users: UsersRepository;
}

const RepositoriesContext = createContext<Repositories | null>(null);

export const RepositoriesProvider = RepositoriesContext.Provider;

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoriesContext);
  if (!repositories) {
    throw new Error("useRepositories must be used within a RepositoriesProvider");
  }
  return repositories;
}