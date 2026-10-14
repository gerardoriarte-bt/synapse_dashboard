export function resolveApiBase(authUrl?: string, apiUrl?: string): string {
  return authUrl || apiUrl || '/api/v1'
}

export function apiBase(): string {
  return resolveApiBase(undefined, import.meta.env.VITE_API_URL)
}

export function authBase(): string {
  return resolveApiBase(import.meta.env['VITE_AUTH_URL'], import.meta.env.VITE_API_URL)
}
