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

export const UsersList: React.FC<UsersListsProps> = ({ tableData }) => {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {tableData.getHeaderGroups().map((headerGroup) => {
            return (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
        <TableBody>
          {tableData.getRowModel().rows?.length ? (
            tableData.getRowModel().rows.map((row) => {
              return (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={tableData.getAllLeafColumns().length}
                className="h-24 text-center"
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
