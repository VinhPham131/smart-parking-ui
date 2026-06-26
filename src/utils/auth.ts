export type UserRole = 'admin' | 'user'

interface JwtPayload {
  sub: string
  username: string
  role: UserRole
  iat?: number
  exp?: number
}

export function getTokenRole(): UserRole | null {
  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    const payloadBase64 = token.split('.')[1]
    if (!payloadBase64) return null
    const decoded = JSON.parse(atob(payloadBase64)) as JwtPayload
    return decoded.role ?? null
  } catch {
    return null
  }
}

export function getHomeByRole(role: UserRole | null): string {
  return role === 'admin' ? '/admin' : '/'
}
