import { useNavigate } from "react-router-dom";
import { authStore } from "../store/auth.store";
import { logout as logoutApi } from "../api/auth.api";

export function useLogout() {
  const navigate = useNavigate();

  return async function logout() {
    try {
      await logoutApi();
    } catch {
    } finally {
      authStore.getState().logout();
      navigate("/login", { replace: true });
    }
  };
}