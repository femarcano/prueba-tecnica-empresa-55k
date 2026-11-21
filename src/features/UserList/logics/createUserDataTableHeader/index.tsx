import { type ColumnDef } from "@tanstack/react-table";

import type { User } from "@/apis/usersCache";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { userListTableFeatures } from "../features";

type Args = {
  onDelete: (uuid: string) => void;
};

type IUserDataTableColumns = (args: Args) => ColumnDef<typeof userListTableFeatures, User>[];

/**
 * The columns of the users table.
 *
 * A column that carries a text value declares its label in `meta`, so the view
 * can name the cell when the table is stacked into one card per row. The photo
 * and the delete column have no label: the first renders an avatar, the second
 * a button that names itself.
 */
export const createUserDataTableColumns: IUserDataTableColumns = ({ onDelete }) => {
  return [
    {
      accessorKey: "picture.thumbnail",
      cell: ({ row }) => {
        return (
          <Avatar>
            <AvatarImage src={row.original.picture.thumbnail} />
            <AvatarFallback>
              {`${row.original.name.first[0]}${row.original.name.last[0]}`}
            </AvatarFallback>
          </Avatar>
        );
      },
      header: () => <p className="text-center">Photo</p>,
    },
    {
      accessorKey: "name",
      meta: { label: "Name" },
      cell: ({ row }) => {
        return `${row.original.name.title} ${row.original.name.first} ${row.original.name.last}`;
      },
      header: () => <p className="text-center">Name</p>,
    },
    {
      accessorKey: "email",
      meta: { label: "Email" },
      header: () => <p className="text-center">Email</p>,
    },
    {
      accessorKey: "phone",
      meta: { label: "Phone" },
      header: () => <p className="text-center">Phone</p>,
    },
    {
      accessorKey: "location.city",
      meta: { label: "City" },
      header: () => <p className="text-center">City</p>,
    },
    {
      accessorKey: "location.state",
      meta: { label: "State" },
      header: () => <p className="text-center">State</p>,
    },
    {
      accessorKey: "location.country",
      meta: { label: "Country" },
      header: () => <p className="text-center">Country</p>,
    },
    {
      cell: ({ row }) => {
        return (
          <button
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            onClick={() => {
              const uuid = row.original.login.uuid;
              onDelete(uuid);
            }}
          >
            Delete
          </button>
        );
      },
      header: () => <p className="text-center">Delete</p>,
      id: "delete",
    },
  ];
};
