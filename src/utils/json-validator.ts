import { repairJson } from './json-repair'

export interface ValidationErrorLocation {
  line: number
  column: number
  position: number
}

export interface ValidationSuccess {
  isValid: true
  parsed: unknown
  rootType: 'object' | 'array' | 'primitive'
  stats: {
    lines: number
    byteSize: number
    charCount: number
    keysCount: number
    maxDepth: number
  }
}

export interface ValidationFailure {
  isValid: false
  message: string
  friendlyMessage: string
  suggestion: string
  location: ValidationErrorLocation
  snippet: {
    beforeLines: { lineNum: number; text: string }[]
    errorLine: { lineNum: number; text: string }
    pointer: string
    afterLines: { lineNum: number; text: string }[]
  }
  canRepair: boolean
  repairedPreview?: string
}

export type ValidationResult = ValidationSuccess | ValidationFailure

/**
 * 深入统计 JSON 对象信息
 */
function analyzeJson(data: unknown): { keysCount: number; maxDepth: number } {
  let keysCount = 0
  let maxDepth = 0

  function traverse(node: unknown, depth: number) {
    if (depth > maxDepth) maxDepth = depth
    if (node === null || typeof node !== 'object') return

    if (Array.isArray(node)) {
      for (const item of node) {
        traverse(item, depth + 1)
      }
    } else {
      const entries = Object.entries(node as Record<string, unknown>)
      keysCount += entries.length
      for (const [, val] of entries) {
        traverse(val, depth + 1)
      }
    }
  }

  traverse(data, 1)
  return { keysCount, maxDepth }
}

/**
 * 根据字符偏移量计算行列号
 */
function getLineAndColFromPos(text: string, pos: number): { line: number; col: number } {
  const safePos = Math.max(0, Math.min(pos, text.length))
  const lines = text.slice(0, safePos).split('\n')
  const line = lines.length
  const col = lines[lines.length - 1].length + 1
  return { line, col }
}

import { parse as parseJsonc, printParseErrorCode, type ParseErrorCode } from 'jsonc-parser'

const ParseErrors = {
  InvalidSymbol: 1,
  InvalidNumberFormat: 2,
  PropertyNameExpected: 3,
  ValueExpected: 4,
  ColonExpected: 5,
  CommaExpected: 6,
  CloseBraceExpected: 7,
  CloseBracketExpected: 8,
  EndOfFileExpected: 9,
  InvalidCommentToken: 10,
  UnexpectedEndOfComment: 11,
  UnexpectedEndOfString: 12,
  UnexpectedEndOfNumber: 13,
  InvalidUnicode: 14,
  InvalidEscapeCharacter: 15,
  InvalidCharacter: 16
} as const

function diagnoseJsoncError(
  text: string,
  error: { error: ParseErrorCode; offset: number; length: number }
): { friendlyMessage: string; suggestion: string } {
  // 特殊上下文补充检测：单引号检查
  const surrounding = text.slice(
    Math.max(0, error.offset - 5),
    Math.min(text.length, error.offset + 10)
  )
  if (surrounding.includes("'")) {
    return {
      friendlyMessage: '使用了单引号引起解析失败',
      suggestion: '标准 JSON 规范要求字符串与对象 Key 必须使用英文双引号 (")，请替换所有单引号。'
    }
  }

  // 尾随逗号检测
  const beforeOffset = text.slice(0, error.offset).trimEnd()
  if (beforeOffset.endsWith(',')) {
    const nextChar = text.slice(error.offset).trimStart()[0]
    if (nextChar === '}' || nextChar === ']') {
      return {
        friendlyMessage: '存在多余的尾随逗号 (Trailing Comma)',
        suggestion: 'JSON 规范不允许在对象或数组最后一个元素末尾多写逗号，请删除此逗号。'
      }
    }
  }

  switch (error.error) {
    case ParseErrors.ValueExpected:
      return {
        friendlyMessage: '缺少值 (Value Expected)',
        suggestion: '冒号后缺少有效的 JSON 属性值（字符串、数字、对象、数组、布尔值或 null）。'
      }
    case ParseErrors.PropertyNameExpected:
      return {
        friendlyMessage: '对象属性键名缺失或缺少双引号',
        suggestion: '标准 JSON 中的对象 Key 必须包裹在英文双引号中，例如 "key": "value"。'
      }
    case ParseErrors.ColonExpected:
      return {
        friendlyMessage: '缺少冒号 (:)',
        suggestion: '对象的键名与属性值之间必须使用英文冒号 (:) 分隔。'
      }
    case ParseErrors.CommaExpected:
      return {
        friendlyMessage: '缺少逗号分隔符 (,)',
        suggestion: '对象键值对之间或数组元素之间必须使用英文逗号 (,) 分隔。'
      }
    case ParseErrors.CloseBraceExpected:
      return {
        friendlyMessage: '缺少闭合花括号 (})',
        suggestion: '请在对应层级末尾补全闭合花括号 "}"。'
      }
    case ParseErrors.CloseBracketExpected:
      return {
        friendlyMessage: '缺少闭合方括号 (])',
        suggestion: '请在对应层级末尾补全闭合方括号 "]"。'
      }
    case ParseErrors.EndOfFileExpected:
      return {
        friendlyMessage: '根节点后存在多余字符',
        suggestion: '标准 JSON 仅允许存在单个根节点（一个对象、数组或单值），请清理末尾多余字符。'
      }
    case ParseErrors.InvalidSymbol:
      return {
        friendlyMessage: '非法符号或未加引号的标识符',
        suggestion: '请核对该位置是否存在未定义的符号、拼写错误或未加双引号的文本。'
      }
    case ParseErrors.InvalidNumberFormat:
    case ParseErrors.UnexpectedEndOfNumber:
      return {
        friendlyMessage: '数字格式不符合规范',
        suggestion: 'JSON 中的数字不允许前导零（如 012）、十六进制或不完整的小数点。'
      }
    case ParseErrors.UnexpectedEndOfString:
      return {
        friendlyMessage: '字符串未闭合',
        suggestion: '字符串末尾缺少闭合的双引号 (")，或字符串内部包含未转义的换行符。'
      }
    case ParseErrors.InvalidCommentToken:
    case ParseErrors.UnexpectedEndOfComment:
      return {
        friendlyMessage: 'JSON 规范不支持注释',
        suggestion: '标准 JSON (RFC 8259) 禁止使用 // 或 /* */ 注释，请移除注释或使用修复功能。'
      }
    case ParseErrors.InvalidEscapeCharacter:
    case ParseErrors.InvalidUnicode:
      return {
        friendlyMessage: '非法的字符转义序列',
        suggestion:
          'JSON 仅支持 \\", \\\\, \\/, \\b, \\f, \\n, \\r, \\t 以及 \\uXXXX 形式的 Unicode 转义。'
      }
    case ParseErrors.InvalidCharacter:
      return {
        friendlyMessage: '包含非法的不可见控制字符',
        suggestion: '字符串内部包含未转义的控制字符（如实际换行符），需使用 \\n 等转义字符表示。'
      }
    default:
      return {
        friendlyMessage: `JSON 语法错误 (${printParseErrorCode(error.error)})`,
        suggestion: '数据格式不符合 RFC 8259 规范，请根据错误指示位置核对排查语法。'
      }
  }
}

/**
 * 生成带指示箭头的上下文代码片段
 */
function buildCodeSnippet(text: string, lineNum: number, colNum: number) {
  const allLines = text.split('\n')
  const lineIdx = lineNum - 1
  const errorLineContent = allLines[lineIdx] ?? ''

  // 前 2 行
  const beforeLines: { lineNum: number; text: string }[] = []
  for (let i = Math.max(0, lineIdx - 2); i < lineIdx; i++) {
    beforeLines.push({ lineNum: i + 1, text: allLines[i] })
  }

  // 错误行
  const errorLine = { lineNum, text: errorLineContent }

  // 错误指针
  const indentCount = Math.max(0, colNum - 1)
  const pointer = ' '.repeat(indentCount) + '^--- 错误位置'

  // 后 2 行
  const afterLines: { lineNum: number; text: string }[] = []
  for (let i = lineIdx + 1; i < Math.min(allLines.length, lineIdx + 3); i++) {
    afterLines.push({ lineNum: i + 1, text: allLines[i] })
  }

  return { beforeLines, errorLine, pointer, afterLines }
}

/**
 * 核心验证函数
 */
export function validateJson(rawInput: string): ValidationResult {
  const trimmed = rawInput.trim()
  if (!trimmed) {
    return {
      isValid: false,
      message: '输入内容为空',
      friendlyMessage: '请输入或粘贴 JSON 数据',
      suggestion: '请在左侧编辑器中输入合法的 JSON 文本或点击上方“示例数据”体验。',
      location: { line: 1, column: 1, position: 0 },
      snippet: {
        beforeLines: [],
        errorLine: { lineNum: 1, text: '' },
        pointer: '^',
        afterLines: []
      },
      canRepair: false
    }
  }

  try {
    const parsed = JSON.parse(rawInput)
    const { keysCount, maxDepth } = analyzeJson(parsed)
    const lines = rawInput.split('\n').length
    const byteSize = new TextEncoder().encode(rawInput).length
    const charCount = rawInput.length

    let rootType: 'object' | 'array' | 'primitive' = 'primitive'
    if (parsed !== null && typeof parsed === 'object') {
      rootType = Array.isArray(parsed) ? 'array' : 'object'
    }

    return {
      isValid: true,
      parsed,
      rootType,
      stats: {
        lines,
        byteSize,
        charCount,
        keysCount,
        maxDepth
      }
    }
  } catch (err) {
    const rawMsg = (err as Error).message
    const errors: { error: ParseErrorCode; offset: number; length: number }[] = []
    parseJsonc(rawInput, errors, { allowTrailingComma: false, disallowComments: true })

    let line = 1
    let col = 1
    let pos = 0
    let friendlyMessage = 'JSON 语法错误'
    let suggestion = '请检查 JSON 格式是否符合 RFC 8259 规范。'

    if (errors.length > 0) {
      const firstErr = errors[0]
      pos = firstErr.offset
      const loc = getLineAndColFromPos(rawInput, pos)
      line = loc.line
      col = loc.col
      const diag = diagnoseJsoncError(rawInput, firstErr)
      friendlyMessage = diag.friendlyMessage
      suggestion = diag.suggestion
    }

    const snippet = buildCodeSnippet(rawInput, line, col)

    // 检测能否自动修复
    const { repaired, changed, success } = repairJson(rawInput)
    const canRepair = success && changed
    const repairedPreview = canRepair ? repaired : undefined

    return {
      isValid: false,
      message: rawMsg,
      friendlyMessage,
      suggestion,
      location: { line, column: col, position: pos },
      snippet,
      canRepair,
      repairedPreview
    }
  }
}
