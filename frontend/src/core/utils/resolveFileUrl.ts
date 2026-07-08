import { baseURL } from "../http/http";

const FILES_BASE_URL = baseURL.replace(/\/api\/?$/, "");

export function resolveFileUrl(url?: string | null) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${FILES_BASE_URL}${url}`;
}