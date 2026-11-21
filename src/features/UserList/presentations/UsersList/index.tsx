import type { Table as TTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";

import type { User } from "@/apis/usersCache";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { userListTableFeatures } from "../../logics/features";

interface UsersListsProps {
  tableData: TTable<typeof userListTableFeatures, User>;
}

/**
 * The table turns into one card per row when the container it sits in is
 * narrower than 600px: the header row is hidden and every cell gets its
 * column label injected in front of its content.
 *
 * The label is injected with a pseudo-element that reads the `data-label`
 * attribute of the cell, so the text of the cell itself stays untouched.
 */
const STACKED_ROW_CLASSES =
  "@max-[600px]:mb-4 @max-[600px]:block @max-[600px]:rounded-md @max-[600px]:border @max-[600px]:border-border @max-[600px]:p-3 @max-[600px]:last:mb-0";

const STACKED_CELL_CLASSES =
  "@max-[600px]:flex @max-[600px]:items-baseline @max-[600px]:gap-x-3 @max-[600px]:border-b @max-[600px]:border-border @max-[600px]:py-2 @max-[600px]:whitespace-normal @max-[600px]:last:border-b-0";

/**
 * The label sits in a column of its own, so the values of the card line up.
 * Only a cell that carries a label gets one: the avatar and the delete button
 * name themselves.
 */
const STACKED_LABELLED_CELL_CLASSES =
  "@max-[600px]:before:w-24 @max-[600px]:before:shrink-0 @max-[600px]:before:font-medium @max-[600px]:before:text-muted-foreground @max-[600px]:before:content-[attr(data-label)]";

export const UsersList: React.FC<UsersListsProps> = ({ tableData }) => {
  return (
    <div className="@container overflow-hidden rounded-md border @max-[600px]:rounded-none @max-[600px]:border-0">
      <Table aria-label="Users" className="@max-[600px]:block">
        <TableHeader className="@max-[600px]:hidden">
          {tableData.getHeaderGroups().map((headerGroup) => {
            return (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} scope="col">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            );
          })}
        </TableHeader>
        <TableBody className="@max-[600px]:block">
          {tableData.getRowModel().rows?.length ? (
            tableData.getRowModel().rows.map((row) => {
              return (
                <TableRow key={row.id} className={STACKED_ROW_CLASSES}>
                  {row.getAllCells().map((cell) => {
                    const label = cell.column.columnDef.meta?.label;
                    return (
                      <TableCell
                        key={cell.id}
                        data-label={label}
                        className={
                          label
                            ? `${STACKED_CELL_CLASSES} ${STACKED_LABELLED_CELL_CLASSES}`
                            : STACKED_CELL_CLASSES
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          ) : (
            <TableRow className={STACKED_ROW_CLASSES}>
              <TableCell
                colSpan={tableData.getAllLeafColumns().length}
                className="h-24 text-center @max-[600px]:block @max-[600px]:whitespace-normal"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
