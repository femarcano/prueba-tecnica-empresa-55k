import { userSchema, type User } from "@/features/UserList/logics";

export interface UsersRepository {
  getUsers(): Promise<User[]>;
}

interface RandomUserApiResponse {
  results: unknown;
  info: unknown;
}

export class HttpUsersRepository implements UsersRepository {
  async getUsers(): Promise<User[]> {
    const res = await fetch("https://randomuser.me/api/?results=100");
    if (!res.ok) {
      throw new Error(`randomuser.me API returned ${res.status} for ${res.url}`);
    }
    const json = (await res.json()) as RandomUserApiResponse;
    return userSchema.array().parse(json.results);
  }
}
