// Centralized backend base URL. Falls back to the production deployment so
// existing behavior is unchanged if VITE_API_URL isn't set; set it in
// client/.env.local to point at a local server during development.
export const API_URL = import.meta.env.VITE_API_URL || "https://velocity-tours.vercel.app";

export function authHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}
