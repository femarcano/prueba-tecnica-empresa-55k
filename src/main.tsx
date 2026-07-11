import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";

import { queryClient } from "@/utils/queryClient";

import App from "./App.tsx";

import "./index.css";
import { HttpUsersRepository } from "./repositories/usersRepository";

const repository = new HttpUsersRepository();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App repository={repository} />
    </QueryClientProvider>
  </React.StrictMode>,
);
