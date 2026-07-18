import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";

import { RepositoriesProvider } from "@/contexts/RepositoriesContext";
import { HttpUsersRepository } from "@/repositories/usersRepository";
import { queryClient } from "@/utils/queryClient";

import App from "./App.tsx";

import "./index.css";

const httpUsersRepository = new HttpUsersRepository();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RepositoriesProvider value={{ users: httpUsersRepository }}>
        <App />
      </RepositoriesProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);