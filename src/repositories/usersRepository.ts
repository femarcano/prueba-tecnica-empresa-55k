import { User } from "@/features/UserList/logics";

export interface UsersRepository {
  getUsers(): Promise<User[]>;
}

interface RandomUserApiResponse {
  results: User[];
  info: {
    seed: string;
    results: number;
    page: number;
    version: string;
  };
}

export class HttpUsersRepository implements UsersRepository {
  async getUsers(): Promise<User[]> {
    const res = await fetch("https://randomuser.me/api/?results=100");
    const json = (await res.json()) as RandomUserApiResponse;
    return json.results;
  }
}
