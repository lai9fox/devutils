/**
 * 智能 JSON 修复工具
 * 自动修复常见的松散或非标准 JSON 语法：
 * 1. 单引号转双引号
 * 2. 未加引号的键名补全引号
 * 3. 移除末尾多余逗号 (trailing commas)
 * 4. 剔除 JavaScript 单行与多行注释
 * 5. 特殊常量替换 (undefined, NaN -> null)
 */

export function repairJson(text: string): { repaired: string; changed: boolean } {
  const original = text.trim()
  if (!original) return { repaired: '', changed: false }

  let modified = original

  // 1. 移除多行注释 /* ... */
  modified = modified.replace(/\/\*[\s\S]*?\*\//g, '')

  // 2. 移除单行注释 // ...
  // 需要注意避免误伤字符串内的 http://
  modified = modified.replace(/(^|[^\\])\/\/.*$/gm, '$1')

  // 3. 将单引号字符串转为双引号字符串（保持转义）
  // 简单安全状态机或精确正则匹配
  modified = modified.replace(/'((?:\\.|[^'])*)'/g, (_match, inner) => {
    // 将内部未转义的双引号转义，将转义的单引号还原
    const escaped = inner.replace(/"/g, '\\"').replace(/\\'/g, "'")
    return `"${escaped}"`
  })

  // 4. 为未加引号的对象键补全双引号
  // 匹配形如 { foo: 或 , bar: 这里的未加引号合法 JS 标识符
  modified = modified.replace(
    /([{,]\s*)([a-zA-Z0-9_$-]+)(\s*:)/g,
    (_match, prefix, key, suffix) => {
      // 如果已经有双引号则不处理
      if (key.startsWith('"') && key.endsWith('"')) {
        return `${prefix}${key}${suffix}`
      }
      return `${prefix}"${key}"${suffix}`
    }
  )

  // 5. 移除对象或数组中的尾逗号: ,} 或 ,]
  modified = modified.replace(/,\s*([}\]])/g, '$1')

  // 6. 替换 undefined / NaN 为 null
  modified = modified.replace(/:\s*undefined\b/g, ': null')
  modified = modified.replace(/:\s*NaN\b/g, ': null')

  // 尝试 parse 校验
  try {
    const parsed = JSON.parse(modified)
    return {
      repaired: JSON.stringify(parsed, null, 2),
      changed: modified !== original
    }
  } catch {
    // 若未能完全自愈，返回中间清洗后的字符串
    return {
      repaired: modified,
      changed: modified !== original
    }
  }
}

export interface JsonStats {
  characters: number
  lines: number
  byteSize: number
  keysCount: number
  maxDepth: number
}

export function computeJsonStats(jsonObj: unknown, rawText: string): JsonStats {
  const characters = rawText.length
  const lines = rawText ? rawText.split(/\r\n|\r|\n/).length : 0
  const byteSize = new TextEncoder().encode(rawText).length

  let keysCount = 0
  let maxDepth = 0

  function traverse(val: unknown, currentDepth: number) {
    if (currentDepth > maxDepth) maxDepth = currentDepth

    if (val !== null && typeof val === 'object') {
      if (Array.isArray(val)) {
        for (const item of val) {
          traverse(item, currentDepth + 1)
        }
      } else {
        const keys = Object.keys(val as Record<string, unknown>)
        keysCount += keys.length
        for (const k of keys) {
          traverse((val as Record<string, unknown>)[k], currentDepth + 1)
        }
      }
    }
  }

  traverse(jsonObj, 0)

  return {
    characters,
    lines,
    byteSize,
    keysCount,
    maxDepth
  }
}
