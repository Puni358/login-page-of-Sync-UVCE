export type ApprovalStatus = "pending" | "approved" | "rejected"

export interface Profile {
  id: string
  email: string | null
  usn: string | null
  phone_number: string | null
  full_name: string | null
  status: ApprovalStatus
  is_admin: boolean | null
}

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  usn?: string
  phone?: string
  approvalStatus?: ApprovalStatus
  isAdmin?: boolean
}

export interface SignUpInput {
  firstName: string
  lastName: string
  email: string
  password: string
  usn: string
  phone: string
}

export interface LoginInput {
  email: string
  password: string
  rememberMe?: boolean
}
