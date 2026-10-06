import { describe, expect, it } from 'vitest'
import { resolveApiBase } from '@/api/base'

describe('la base de la API no se come el /api/v1', () => {
  it('una cadena vacía cae al relativo · no a la raíz', () => {
    // El Dockerfile pone `ENV VITE_API_URL=""`. Con `??` eso gana y el chat
    // pega a `/config/chat` — 405 de nginx, no de la API.
    expect(resolveApiBase('', '')).toBe('/api/v1')
    expect(resolveApiBase(undefined, '')).toBe('/api/v1')
    expect(resolveApiBase(undefined, undefined)).toBe('/api/v1')
  })

  it('un valor puesto gana, y el de auth gana sobre el de la API', () => {
    expect(resolveApiBase(undefined, 'https://api.ejemplo/api/v1')).toBe(
      'https://api.ejemplo/api/v1',
    )
    expect(resolveApiBase('https://auth.ejemplo', '/api/v1')).toBe('https://auth.ejemplo')
  })
})
