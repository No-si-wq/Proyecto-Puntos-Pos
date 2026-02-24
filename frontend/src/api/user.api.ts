import http from "./http";
import type { User, CreateUserDTO, UpdateUserDTO } from "../types/user";

export async function getUsers() {
  const { data } = await http.get<User[]>("/users");
  return data;
}

export async function createUser(payload: CreateUserDTO) {
  const { data } = await http.post<User>("/users", payload);
  return data;
}

export async function updateUser(id: number, payload: UpdateUserDTO) {
  const { data } = await http.put<User>(`/users/${id}`, payload);
  return data;
}

export async function logoutUserAll(userId: number) {
  await http.post(`/users/${userId}/logout-all`);
}