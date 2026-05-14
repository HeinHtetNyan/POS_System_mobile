import apiClient from './client'
import type { LoginCredentials, AuthTokens, User } from '@/types'

export const authApi = {
  login: (creds: LoginCredentials) =>
    apiClient.post<AuthTokens>('/auth/login/', creds).then(r => r.data),

  refresh: (refresh: string) =>
    apiClient.post<{ access: string }>('/auth/token/refresh/', { refresh }).then(r => r.data),

  me: () =>
    apiClient.get<User>('/auth/me/').then(r => r.data),

  logout: (refresh: string) =>
    apiClient.post('/auth/logout/', { refresh }),
}
