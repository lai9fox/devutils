import type { ToolMeta } from '~/types/tool'
import { getCategoryById, getToolById, tools, toolsByCategory } from '~/data/tools'

export function useTools() {
  const allTools = computed<ToolMeta[]>(() => [...tools].sort((a, b) => a.order - b.order))
  const groupedTools = computed(() => toolsByCategory)
  const featuredTools = computed(() => allTools.value.filter(tool => tool.featured))

  function searchTools(query: string): ToolMeta[] {
    const q = query.toLowerCase().trim()
    if (!q) return allTools.value

    return allTools.value
      .map(tool => ({ tool, score: scoreTool(tool, q) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || a.tool.order - b.tool.order)
      .map(item => item.tool)
  }

  function getTool(id: string): ToolMeta | undefined {
    return getToolById(id)
  }

  function getRelatedTools(tool: ToolMeta, limit = 4): ToolMeta[] {
    const explicit = (tool.relatedIds ?? [])
      .map(id => getToolById(id))
      .filter((item): item is ToolMeta => Boolean(item))

    const sameCategory = allTools.value.filter(item =>
      item.id !== tool.id
      && item.category === tool.category
      && !explicit.some(explicitTool => explicitTool.id === item.id)
    )

    return [...explicit, ...sameCategory].slice(0, limit)
  }

  function hasToolById(id: string): boolean {
    return Boolean(getToolById(id))
  }

  return {
    tools: allTools,
    groupedTools,
    featuredTools,
    searchTools,
    getTool,
    getCategoryById,
    getRelatedTools,
    hasToolById
  }
}

function scoreTool(tool: ToolMeta, query: string): number {
  const category = getCategoryById(tool.category)
  let score = 0

  if (tool.id.toLowerCase() === query) score += 120
  if (tool.id.toLowerCase().includes(query)) score += 50
  if (tool.name.toLowerCase().includes(query)) score += 80
  if (tool.description.toLowerCase().includes(query)) score += 30
  if (category?.name.toLowerCase().includes(query)) score += 20
  if (tool.keywords.some(keyword => keyword.toLowerCase() === query)) score += 70
  if (tool.keywords.some(keyword => keyword.toLowerCase().includes(query))) score += 45

  return score
}
