import Cookies from "js-cookie";

export const TOKEN_COOKIE = "admin_token";
export const USER_COOKIE = "admin_user";

const COOKIE_OPTIONS = { expires: 1, sameSite: "lax", path: "/" };

export function setSession(token, user) {
  Cookies.set(TOKEN_COOKIE, token, COOKIE_OPTIONS);
  if (user) {
    Cookies.set(USER_COOKIE, JSON.stringify(user), COOKIE_OPTIONS);
  }
}

export function clearSession() {
  Cookies.remove(TOKEN_COOKIE, { path: "/" });
  Cookies.remove(USER_COOKIE, { path: "/" });
}

export function getToken() {
  return Cookies.get(TOKEN_COOKIE) ?? null;
}

export function getUser() {
  const raw = Cookies.get(USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
