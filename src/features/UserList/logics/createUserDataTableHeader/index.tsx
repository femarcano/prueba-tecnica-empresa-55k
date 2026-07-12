import { ColumnDef } from "@tanstack/react-table";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { User } from "../schema";

type Args = {
  onDelete: (uuid: string) => void;
};

type IUserDataTableColumns = (args: Args) => ColumnDef<User>[];

export const createUserDataTableColumns: IUserDataTableColumns = ({ onDelete }) => {
  return [
    {
      accessorKey: "picture.thumbnail",
      header: () => <p className="text-center">Photo</p>,
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
    },
    {
      accessorKey: "name",
      header: () => <p className="text-center">Name</p>,
      cell: ({ row }) => {
        return `${row.original.name.title} ${row.original.name.first} ${row.original.name.last}`;
      },
    },
    {
      accessorKey: "email",
      header: () => <p className="text-center">Email</p>,
    },
    {
      accessorKey: "phone",
      header: () => <p className="text-center">Phone</p>,
    },
    {
      accessorKey: "location.city",
      header: () => <p className="text-center">City</p>,
    },
    {
      accessorKey: "location.state",
      header: () => <p className="text-center">State</p>,
    },
    {
      accessorKey: "location.country",
      header: () => <p className="text-center">Country</p>,
    },
    {
      id: "delete",
      header: () => <p className="text-center">Delete</p>,
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
    },
  ];
};
