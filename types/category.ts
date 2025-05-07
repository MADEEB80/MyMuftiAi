// Category type definition
export interface Category {
  id: string
  name: string
  description: string
  slug: string
  parentId?: string
  order: number
  createdAt: Date
  updatedAt: Date
}
