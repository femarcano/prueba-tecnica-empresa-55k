import * as z from "zod";

import { getRandomUsers } from "@/apis/__generated__/client/randomuser";
import { GetRandomUsersResponse } from "@/apis/__generated__/zod/randomuserMe";

export type User = z.infer<typeof GetRandomUsersResponse>["results"][number];

export async function fetchUsers(): Promise<User[]> {
  const response = await getRandomUsers({ results: 100 });
  if (response.status !== 200) {
    throw new Error(`randomuser.me API returned ${response.status}`);
  }
  return GetRandomUsersResponse.parse(response.data).results;
}