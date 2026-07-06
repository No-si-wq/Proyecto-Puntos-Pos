import { useEffect, useState, useCallback } from "react";
import http from "../../core/http/http";
import type { User, CreateUserDTO, UpdateUserDTO, UserSearch } from "./user";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<UserSearch>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await http.get<User[]>("/users", {
        params: { 
          search: filters.search,
          onlyInactive: filters.onlyInactive ? "true" : undefined,
        },
      });
      setUsers(data);
    } catch {
      setError("Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.onlyInactive]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(payload: CreateUserDTO) {
    await http.post<User>("/users", payload);
    await load();
  }

  async function update(id: number, payload: UpdateUserDTO) {
    await http.put<User>(`/users/${id}`, payload);;
    await load();
  }

  async function toggleActive(id: number, active: boolean) {
    await http.patch(`/users/${id}/activate`, { active });
    await load();
  }

  async function logoutAll(userId: number) {
    await http.post(`/users/${userId}/logout-all`);
    await load();
  }

  return {
    users,
    loading,
    error,
    filters,
    setFilters,
    reload: load,
    create,
    update,
    toggleActive,
    logoutAll,
  };
}