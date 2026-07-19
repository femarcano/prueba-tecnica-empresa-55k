import { Suspense } from "react";

import "./App.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserList } from "@/features/UserList";

function App() {
  return (
    <ErrorBoundary fallback={<p>Error loading users.</p>}>
      <Suspense fallback={<p>Loading users…</p>}>
        <UserList />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
