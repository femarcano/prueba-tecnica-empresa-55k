import { tableFeatures } from "@tanstack/react-table";

/**
 * The features the UserList table uses.
 *
 * TanStack Table v9 requires the features a table uses to be declared explicitly.
 * This table only needs the core ones: it filters and sorts with its own state,
 * not with the table's own filtering and sorting features.
 *
 * It lives in its own module because both the hook and the column definitions
 * need the same type: the column definitions are typed as
 * `ColumnDef<typeof userListTableFeatures, User>`, and the hook builds the table
 * with these features.
 *
 * `columnMeta` is a type-only slot. It declares the shape of `columnDef.meta`,
 * which carries the label of a column so the view can name a cell when the
 * table is stacked.
 */
export const userListTableFeatures = tableFeatures({
  columnMeta: {} as { label?: string },
});
