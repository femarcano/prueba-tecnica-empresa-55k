import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import "./App.css";
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
