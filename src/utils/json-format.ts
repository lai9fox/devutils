import { format, applyEdits, createScanner, parse, type ParseError } from 'jsonc-parser'

const EOF_TOKEN = 17

export interface FormatJsonOptions {
  indent?: number | 'tab'
  eol?: '\n' | '\r\n'
}

/**
 * 校验文本是否为严格合法的 JSON
 */
export function isValidJson(text: string): boolean {
  if (!text.trim()) return false
  const errors: ParseError[] = []
  parse(text, errors, { allowTrailingComma: false, disallowComments: true })
  return errors.length === 0
}

/**
 * 无损格式化 JSON 文本（保留 64 位大整数、高精度小数、原始数字 token，不通过浮点数转换）
 */
export function formatJson(text: string, options: FormatJsonOptions = {}): string {
  const indent = options.indent ?? 2
  const formattingOptions =
    indent === 'tab'
      ? { insertSpaces: false, tabSize: 2, eol: options.eol ?? '\n' }
      : { insertSpaces: true, tabSize: Number(indent), eol: options.eol ?? '\n' }

  const edits = format(text, undefined, formattingOptions)
  return applyEdits(text, edits)
}

/**
 * 无损单行压缩 JSON（基于词法 Token 扫描，去除无用空格和换行，绝不改变数字与字符串字面量）
 */
export function minifyJson(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''

  const scanner = createScanner(trimmed, true)
  let result = ''
  let token = scanner.scan()
  while (token !== EOF_TOKEN) {
    const offset = scanner.getTokenOffset()
    const length = scanner.getTokenLength()
    result += trimmed.slice(offset, offset + length)
    token = scanner.scan()
  }
  return result
}

/**
 * 安全拼接 JSONPath 属性段
 * 当键名包含特殊字符（如点、括号、空格、引号）时，使用安全的方括号转义表示 $['key']，杜绝路径冲突
 */
export function appendJsonPath(
  parentPath: string,
  key: string | number,
  isParentArray = false
): string {
  if (isParentArray || typeof key === 'number' || /^\d+$/.test(String(key))) {
    return `${parentPath}[${key}]`
  }
  const keyStr = String(key)
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(keyStr)) {
    return `${parentPath}.${keyStr}`
  }
  const escaped = keyStr.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `${parentPath}['${escaped}']`
}
