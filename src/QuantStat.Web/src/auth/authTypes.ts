export type AuthProvider =
  | 'microsoft'
  | 'google'


export interface QuantStatUser {
  provider: AuthProvider
  id: string
  displayName: string
  email: string
  picture?: string
}
