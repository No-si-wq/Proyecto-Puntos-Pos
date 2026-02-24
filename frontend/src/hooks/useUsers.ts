import { useEffect, useState, useCallback } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  logoutUserAll,
} from "../api/user.api";
import type { User, CreateUserDTO, UpdateUserDTO } from "../types/user";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setUsers(await getUsers());
    } catch {
      setError("Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(payload: CreateUserDTO) {
    await createUser(payload);
    await load();
  }

  async function update(id: number, payload: UpdateUserDTO) {
    await updateUser(id, payload);
    await load();
  }

  async function logoutAll(userId: number) {
    await logoutUserAll(userId);
    await load();
  }

  return {
    users,
    loading,
    error,
    reload: load,
    create,
    update,
    logoutAll,
  };
}