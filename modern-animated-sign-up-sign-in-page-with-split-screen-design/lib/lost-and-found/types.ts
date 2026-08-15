export type FoundItem = {
  id: string
  title: string
  description: string
  photos: string[]
  foundWhere: string
  foundWhen: string
  listerId: string
  listerName: string
  listerEmail: string
  listerPhone: string
  createdAt: string
}

export type CreateFoundItemInput = {
  title: string
  description: string
  photos: string[]
  foundWhere: string
  foundWhen: string
  listerEmail: string
  listerPhone: string
}
