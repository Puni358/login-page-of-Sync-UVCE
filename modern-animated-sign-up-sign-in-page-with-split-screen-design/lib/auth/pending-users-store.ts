import type { PendingUser } from "./types"

const PENDING_USERS_KEY = "nova_pending_users"

const DUMMY_PENDING_USERS: PendingUser[] = [
  {
    id: "dummy_1",
    name: "Arjun Mehta",
    usn: "1UV20CS001",
    phone: "+91 98765 43210",
    status: "pending",
  },
  {
    id: "dummy_2",
    name: "Priya Sharma",
    usn: "1UV21EC045",
    phone: "+91 87654 32109",
    status: "pending",
  },
  {
    id: "dummy_3",
    name: "Rahul Kumar",
    usn: "1UV22ME078",
    phone: "+91 76543 21098",
    status: "pending",
  },
]

function readStore(): PendingUser[] {
  if (typeof window === "undefined") return DUMMY_PENDING_USERS
  try {
    const raw = localStorage.getItem(PENDING_USERS_KEY)
    if (!raw) {
      localStorage.setItem(PENDING_USERS_KEY, JSON.stringify(DUMMY_PENDING_USERS))
      return DUMMY_PENDING_USERS
    }
    return JSON.parse(raw) as PendingUser[]
  } catch {
    return DUMMY_PENDING_USERS
  }
}

function writeStore(users: PendingUser[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PENDING_USERS_KEY, JSON.stringify(users))
}

export function getPendingUsers(): PendingUser[] {
  return readStore().filter((u) => u.status === "pending")
}

export function addPendingUser(user: Omit<PendingUser, "status">): PendingUser {
  const entry: PendingUser = { ...user, status: "pending" }
  const store = readStore()
  const withoutDuplicate = store.filter((u) => u.id !== entry.id)
  writeStore([entry, ...withoutDuplicate])
  return entry
}
