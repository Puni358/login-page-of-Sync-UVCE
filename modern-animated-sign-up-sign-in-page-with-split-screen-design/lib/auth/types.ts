export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
}

export interface SignUpInput {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
  rememberMe?: boolean
}
