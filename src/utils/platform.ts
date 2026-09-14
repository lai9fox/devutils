/**
 * 平台环境与系统快捷键工具函数
 */

export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as unknown as {
    userAgentData?: { platform?: string }
    platform?: string
    userAgent?: string
  }
  if (nav.userAgentData?.platform) {
    return /mac/i.test(nav.userAgentData.platform)
  }
  const platform = nav.platform || ''
  const userAgent = nav.userAgent || ''
  return /mac/i.test(platform) || /macintosh|mac os x/i.test(userAgent)
}

export function getPasteShortcutText(): string {
  return isMac() ? '⌘V' : 'Ctrl+V'
}
