import * as z from "zod";

import { getRandomUsers } from "@/repositories/__generated__/client/randomuser";
import { GetRandomUsersResponse } from "@/repositories/__generated__/zod/randomuserMe";

export interface UsersRepository {
  getUsers(): Promise<User[]>;
}

export type User = z.infer<typeof GetRandomUsersResponse>["results"][number];

export class HttpUsersRepository implements UsersRepository {
  async getUsers(): Promise<User[]> {
    const response = await getRandomUsers({ results: 100 });
    if (response.status !== 200) {
      throw new Error(`randomuser.me API returned ${response.status}`);
    }
    return GetRandomUsersResponse.parse(response.data).results;
  }
}