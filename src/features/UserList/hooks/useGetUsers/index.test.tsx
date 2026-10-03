import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook, waitFor } from "@testing-library/react";
import { type ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useGetUsers } from "./index";

function user() {
  return {
    gender: "male",
    name: { title: "Mr", first: "Test", last: "User" },
    location: {
      street: { number: 1, name: "Main St" },
      city: "Springfield",
      state: "IL",
      country: "US",
      postcode: 62701,
      coordinates: { latitude: "0", longitude: "0" },
      timezone: { offset: "+0:00", description: "UTC" },
    },
    email: "test@example.com",
    login: {
      uuid: "11111111-1111-4111-8111-111111111111",
      username: "tester",
      password: "",
      salt: "",
      md5: "",
      sha1: "",
      sha256: "",
    },
    dob: { date: "1990-01-01T00:00:00.000Z", age: 30 },
    registered: { date: "2024-01-01T00:00:00.000Z", age: 0 },
    phone: "",
    cell: "",
    id: { name: "SSN", value: null },
    picture: {
      large: "https://example.com/large.jpg",
      medium: "https://example.com/medium.jpg",
      thumbnail: "https://example.com/thumb.jpg",
    },
    nat: "US",
  };
}

function payload(users: unknown[]) {
  return {
    results: users,
    info: { seed: "abc", results: users.length, page: 1, version: "1.4" },
  };
}

function fetchResponse(status: number, body: unknown) {
  return {
    status,
    text: async () => JSON.stringify(body),
    headers: new Headers(),
  };
}

function makeWrapper({ queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }) }: { queryClient?: QueryClient } = {}) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<p>Loading users…</p>}>{children}</Suspense>
    </QueryClientProvider>
  );
}

describe("useGetUsers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves and returns users from the upstream", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fetchResponse(200, payload([user(), { ...user(), email: "two@example.com" }]))),
    );

    const { result } = renderHook(() => useGetUsers(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current?.users).toHaveLength(2);
    });

    expect(result.current?.users[0]?.email).toBe("test@example.com");
    expect(result.current?.users[0]?.login.uuid).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("throws to a boundary when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );

    const capturedError: { current: Error | null } = { current: null };
    const wrapper = makeWrapper();

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