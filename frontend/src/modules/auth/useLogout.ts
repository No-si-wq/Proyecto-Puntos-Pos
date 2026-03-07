import { useNavigate } from "react-router-dom";
import { authStore } from "./auth.store";
import http from "../../core/http/http";

export function useLogout() {
  const navigate = useNavigate();

  return async function logout() {
    try {
      await http.post("/auth/logout");
    } catch {
    } finally {
      authStore.getState().logout();
      navigate("/login", { replace: true });
    }
  };
}