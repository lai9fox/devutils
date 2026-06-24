export type ToolCategoryId
  = | 'data-format'
    | 'encoding'
    | 'text-regex'
    | 'time-number'
    | 'security-id'

export interface ToolCategory {
  id: ToolCategoryId
  icon: string
  name: string
  description: string
}

export interface ToolMeta {
  id: string
  path: string
  category: ToolCategoryId
  icon: string
  name: string
  description: string
  keywords: string[]
  seoTitle: string
  seoDescription: string
  featured?: boolean
  order: number
  relatedIds?: string[]
}
