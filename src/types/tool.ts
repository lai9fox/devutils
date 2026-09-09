export type ToolCategoryId = 'format-view' | 'validate-query' | 'convert-types'

export interface ToolCategory {
  id: ToolCategoryId
  name: string
  description: string
  icon: string
}

export interface ToolMeta {
  id: string
  path: string
  category: ToolCategoryId
  name: string
  shortName?: string
  description: string
  icon: string
  keywords: string[]
  tags?: string[]
  seoTitle: string
  seoDescription: string
  featured?: boolean
  order: number
}
