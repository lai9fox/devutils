/**
 * 工具工作台会话草稿内存管理器
 * 在工作台内部切换工具时无损保留草稿，不写入持久化 localStorage 避免隐私与存储泄漏
 */

const MAX_DRAFT_STRING_LENGTH = 5 * 1024 * 1024 // 5MB 安全阈值

const drafts: Record<string, any> = {}

function isClientOrTest(): boolean {
  return (
    typeof window !== 'undefined' ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test')
  )
}

export function getToolDraft<T>(key: string, fallback: T): T {
  if (!isClientOrTest()) return fallback
  if (key in drafts && drafts[key] !== undefined) {
    return drafts[key] as T
  }
  return fallback
}

export function setToolDraft<T>(key: string, val: T): void {
  if (!isClientOrTest()) return
  // 对超大字符串草稿进行内存保护
  if (typeof val === 'string' && val.length > MAX_DRAFT_STRING_LENGTH) {
    return
  }
  drafts[key] = val
}

export function clearToolDraft(key: string): void {
  delete drafts[key]
}
