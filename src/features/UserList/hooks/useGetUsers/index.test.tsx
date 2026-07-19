import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook, waitFor } from "@testing-library/react";
import { type ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { describe, expect, it, vi } from "vitest";

import { RepositoriesProvider } from "@/contexts/RepositoriesContext";
import { FakeUsersRepository } from "@/repositories/__fixtures__/fakeUsersRepository";
import type { UsersRepository } from "@/repositories/usersRepository";

import { useGetUsers } from "./index";

function makeWrapper({
  repository,
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
}: {
  repository: UsersRepository;
  queryClient?: QueryClient;
}) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <RepositoriesProvider value={{ users: repository }}>
        <Suspense fallback={<p>Loading users…</p>}>{children}</Suspense>
      </RepositoriesProvider>
    </QueryClientProvider>
  );
}

describe("useGetUsers", () => {
  it("resolves and returns users from the repository", async () => {
    const repository = new FakeUsersRepository();
    const { result } = renderHook(() => useGetUsers(), {
      wrapper: makeWrapper({ repository }),
    });

    await waitFor(() => {
      expect(result.current?.users).toHaveLength(3);
    });

    expect(result.current?.users[0]?.login.uuid).toBe("fake-uuid-1");
  });

  it("throws to a boundary when the repository rejects", async () => {
    const capturedError: { current: Error | null } = { current: null };
    const getUsers = vi.fn<UsersRepository["getUsers"]>().mockRejectedValue(new Error("boom"));
    const wrapper = makeWrapper({ repository: { getUsers } });

    const Probe = () => {
      useGetUsers();
      return null;
    };

    render(
      <ErrorBoundary
        fallback={null}
        onError={(error) => {
          capturedError.current = error as Error;
        }}
      >
        <Probe />
      </ErrorBoundary>,
      { wrapper },
    );

    await waitFor(() => {
      expect(capturedError.current?.message).toBe("boom");
    });
  });
});
