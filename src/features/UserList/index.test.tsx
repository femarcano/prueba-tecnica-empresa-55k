import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { type ReactNode, Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserList } from "./index";

function makeUser({
  uuid,
  first,
  last,
  email,
  country,
}: {
  uuid: string;
  first: string;
  last: string;
  email: string;
  country: string;
}) {
  return {
    gender: "male",
    name: { title: "Mr", first, last },
    location: {
      street: { number: 1, name: "Main St" },
      city: "Springfield",
      state: "IL",
      country,
      postcode: 62701,
      coordinates: { latitude: "0", longitude: "0" },
      timezone: { offset: "+0:00", description: "UTC" },
    },
    email,
    login: {
      uuid,
      username: first.toLowerCase(),
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

const alice = makeUser({
  uuid: "11111111-1111-4111-8111-111111111111",
  first: "Alice",
  last: "Anderson",
  email: "alice@example.com",
  country: "Canada",
});

const bob = makeUser({
  uuid: "22222222-2222-4222-8222-222222222222",
  first: "Bob",
  last: "Brown",
  email: "bob@example.com",
  country: "Australia",
});

const carol = makeUser({
  uuid: "33333333-3333-4333-8333-333333333333",
  first: "Carol",
  last: "Clark",
  email: "carol@example.com",
  country: "Canada",
});

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

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<p>Loading users…</p>}>{children}</Suspense>
    </QueryClientProvider>
  );
}

function stubUpstream(users: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => fetchResponse(200, payload(users))),
  );
}

/**
 * The rows of the rendered table, in the order they appear.
 *
 * The table's header row is excluded, so the result is one entry per user.
 */
function renderedRows() {
  const table = screen.getByRole("table");
  return within(table).getAllByRole("row").slice(1);
}

/** The columns are Photo, Name, Email, Phone, City, State, Country and Delete. */
const EMAIL_COLUMN_INDEX = 2;

/**
 * The emails the rendered rows carry, in the order they appear.
 *
 * The columns are Photo, Name, Email, Phone, City, State, Country and Delete.
 */
function renderedEmails() {
  return renderedRows().map((row) => {
    const cells = within(row).getAllByRole("cell");
    return cells[EMAIL_COLUMN_INDEX]?.textContent ?? "";
  });
}

describe("UserList", () => {
  afterEach(() => {
    // This repository's Vitest configuration has no global cleanup, so each render
    // would otherwise stay in the document and the row queries would see the rows of
    // the previous tests as well.
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders one row per user the upstream returned", async () => {
    stubUpstream([alice, bob, carol]);

    render(<UserList />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(renderedRows()).toHaveLength(3);
    });

    expect(screen.getByText("alice@example.com")).toBeTruthy();
    expect(screen.getByText("bob@example.com")).toBeTruthy();
    expect(screen.getByText("carol@example.com")).toBeTruthy();
  });

  it("spans the empty state across every column of the table", async () => {
    stubUpstream([]);

    render(<UserList />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByText("No results.")).toBeTruthy();
    });

    // The empty state is one cell that has to span the whole width of the table.
    const columnCount = screen.getAllByRole("columnheader").length;
    expect(columnCount).toBe(8);
    expect(screen.getByText("No results.").closest("td")?.getAttribute("colspan")).toBe(
      String(columnCount),
    );
  });

  it("narrows the rows to the users of the filtered country", async () => {
    stubUpstream([alice, bob, carol]);

    render(<UserList />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(renderedRows()).toHaveLength(3);
    });

    fireEvent.change(screen.getByPlaceholderText("Filter by Country"), {
      target: { value: "Canada" },
    });

    await waitFor(() => {
      expect(renderedRows()).toHaveLength(2);
    });

    expect(screen.getByText("alice@example.com")).toBeTruthy();
    expect(screen.getByText("carol@example.com")).toBeTruthy();
    expect(screen.queryByText("bob@example.com")).toBeNull();
  });

  it("reorders the rows by country when the sort is toggled", async () => {
    stubUpstream([alice, bob, carol]);

    render(<UserList />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(renderedRows()).toHaveLength(3);
    });

    // Unsorted, the upstream order holds.
    expect(renderedEmails()).toEqual(["alice@example.com", "bob@example.com", "carol@example.com"]);

    fireEvent.click(screen.getByRole("button", { name: "sort by country" }));

    await waitFor(() => {
      expect(renderedEmails()).toEqual([
        "bob@example.com", // Australia
        "alice@example.com", // Canada
        "carol@example.com", // Canada
      ]);
    });

    // Toggling it back restores the upstream order.
    fireEvent.click(screen.getByRole("button", { name: "no sort by country" }));

    await waitFor(() => {
      expect(renderedEmails()).toEqual([
        "alice@example.com",
        "bob@example.com",
        "carol@example.com",
      ]);
    });
  });

  it("removes the row of the user that is deleted", async () => {
    stubUpstream([alice, bob, carol]);

    render(<UserList />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(renderedRows()).toHaveLength(3);
    });

    const bobRow = screen.getByText("bob@example.com").closest("tr");
    expect(bobRow).not.toBeNull();
    fireEvent.click(within(bobRow as HTMLTableRowElement).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(renderedRows()).toHaveLength(2);
    });

    expect(screen.queryByText("bob@example.com")).toBeNull();
    expect(screen.getByText("alice@example.com")).toBeTruthy();
    expect(screen.getByText("carol@example.com")).toBeTruthy();
  });
});
