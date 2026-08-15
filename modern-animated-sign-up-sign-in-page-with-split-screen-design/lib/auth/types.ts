export type ApprovalStatus = "pending" | "approved" | "rejected"

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  usn?: string
  phone?: string
  approvalStatus?: ApprovalStatus
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

export interface PendingUser {
  id: string
  name: string
  usn: string
  phone: string
  status: ApprovalStatus
}
