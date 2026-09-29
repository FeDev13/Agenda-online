export function isProtectedAppPath(path: string) {
  return path === "/app" || path.startsWith("/app/");
}

export function sanitizeProtectedNextPath(next: string | string[] | null | undefined) {
  if (typeof next !== "string") {
    return "/app";
  }

  return isProtectedAppPath(next) ? next : "/app";
}
