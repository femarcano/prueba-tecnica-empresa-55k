import type { Table as TanstackTable } from "@tanstack/react-table";

import type { User } from "@/apis/usersCache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { userListTableFeatures } from "../logics/features";
import { UsersList } from "./UsersList";

type UserListPresentation = {
  onReset: () => void;
  showColors: boolean;
  toggleColors: () => void;
  sortByCountry: boolean;
  toggleSortByCountry: () => void;
  setFilterCountry: (country: string) => void;
  filterCountry: string | null;
  tableData: TanstackTable<typeof userListTableFeatures, User>;
};

export const UserListPresentation: React.FC<UserListPresentation> = ({
  toggleColors,
  toggleSortByCountry,
  onReset,
  setFilterCountry,
  showColors,
  sortByCountry,
  tableData,
}) => {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <a
        href="#users-table"
        className="focus:bg-primary focus:text-primary-foreground focus:ring-ring/30 sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-4xl focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-3"
      >
        Skip to the users table
      </a>

      <header className="@container flex flex-col gap-4">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight text-balance">
          Users
        </h1>

        <div className="flex flex-col gap-4 @md:flex-row @md:flex-wrap @md:items-end @md:justify-between">
          {/* The filter is a search control, so it lives in a search landmark. */}
          <search aria-label="Filter users" className="flex w-full flex-col gap-1.5 @md:max-w-xs">
            <label htmlFor="filter-country" className="text-foreground text-sm font-medium">
              Filter by country
            </label>
            <Input
              id="filter-country"
              name="country"
              type="search"
              placeholder="Filter by Country"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="pointer-coarse:min-h-12"
              onChange={(e) => {
                setFilterCountry(e.target.value);
              }}
            />
          </search>

          <div className="flex flex-col gap-2 @sm:flex-row @sm:flex-wrap @sm:items-center">
            <Button
              variant="outline"
              aria-pressed={showColors}
              className="aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/80 aria-pressed:hover:text-primary-foreground pointer-coarse:min-h-12"
              onClick={toggleColors}
            >
              Toggle colors
            </Button>
            <Button
              variant="outline"
              className="pointer-coarse:min-h-12"
              onClick={toggleSortByCountry}
            >
              {sortByCountry ? "no sort by country" : "sort by country"}
            </Button>
            <Button variant="outline" className="pointer-coarse:min-h-12" onClick={onReset}>
              Reset users
            </Button>
          </div>
        </div>
      </header>

      <main id="users-table" tabIndex={-1}>
        <UsersList tableData={tableData} />
      </main>
    </div>
  );
};
