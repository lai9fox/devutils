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

/**
 * 从原生错误消息中解析错误位置
 */
function extractPositionFromError(
  errMsg: string,
  text: string
): { line: number; col: number; pos: number } {
  // 1. Chrome / V8: "at position 42"
  const posMatch = errMsg.match(/at position (\d+)/i)
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10)
    const { line, col } = getLineAndColFromPos(text, pos)
    return { line, col, pos }
  }

  // 2. Firefox: "at line 3 column 5 of the JSON data"
  const lineColMatch = errMsg.match(/at line (\d+) column (\d+)/i)
  if (lineColMatch) {
    const line = parseInt(lineColMatch[1], 10)
    const col = parseInt(lineColMatch[2], 10)
    const lines = text.split('\n')
    let pos = 0
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      pos += lines[i].length + 1
    }
    pos += Math.min(col - 1, (lines[line - 1] || '').length)
    return { line, col, pos }
  }

  // 3. Safari: "at line 2 column 5"
  const safariMatch = errMsg.match(/line (\d+) column (\d+)/i)
  if (safariMatch) {
    const line = parseInt(safariMatch[1], 10)
    const col = parseInt(safariMatch[2], 10)
    const lines = text.split('\n')
    let pos = 0
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      pos += lines[i].length + 1
    }
    pos += Math.min(col - 1, (lines[line - 1] || '').length)
    return { line, col, pos }
  }

  // Fallback: 尝试粗略定位
  return { line: 1, col: 1, pos: 0 }
}

/**
 * 诊断常见错误原因与给出中文修复建议
 */
function diagnoseError(
  text: string,
  rawMsg: string,
  line: number,
  _col: number,
  pos: number
): { friendlyMessage: string; suggestion: string } {
  const lineText = text.split('\n')[line - 1] || ''

  // 1. 检查单引号
  if (text.includes("'")) {
    const surrounding = text.slice(Math.max(0, pos - 15), Math.min(text.length, pos + 15))
    if (surrounding.includes("'")) {
      return {
        friendlyMessage: '使用了单引号引起解析失败',
        suggestion: '标准 JSON 规范要求字符串与对象 Key 必须使用英文双引号 (")，请替换所有单引号。'
      }
    }
  }

  // 2. 检查尾随逗号 (Trailing Comma)
  const textBeforePos = text.slice(0, pos).trimEnd()
  const charBefore = textBeforePos[textBeforePos.length - 1]
  const charAtPos = text[pos] || ''
  if (
    (charBefore === ',' || textBeforePos.endsWith(',')) &&
    (charAtPos === '}' || charAtPos === ']' || /^\s*[}\]]/.test(text.slice(pos)))
  ) {
    return {
      friendlyMessage: '存在多余的尾随逗号 (Trailing Comma)',
      suggestion: 'JSON 规范不允许在对象或数组最后一个元素末尾多写逗号，请删除此逗号。'
    }
  }

  // 3. 检查未加引号的 Key
  if (/[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(lineText)) {
    return {
      friendlyMessage: '对象键名缺少双引号',
      suggestion: '标准 JSON 中的对象 Key 必须包裹在英文双引号中，例如 "key": "value"。'
    }
  }

  // 4. 检查括号闭合情况
  let openBraces = 0
  let openBrackets = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '{') openBraces++
    else if (c === '}') openBraces--
    else if (c === '[') openBrackets++
    else if (c === ']') openBrackets--
  }

  if (openBraces > 0) {
    return {
      friendlyMessage: '大括号未闭合',
      suggestion: `JSON 末尾缺少 ${openBraces} 个闭合的花括号 "}"。`
    }
  } else if (openBraces < 0) {
    return {
      friendlyMessage: '多余的闭合大括号',
      suggestion: '发现了未匹配的闭合花括号 "}"，请核对层级结构。'
    }
  }

  if (openBrackets > 0) {
    return {
      friendlyMessage: '数组方括号未闭合',
      suggestion: `JSON 末尾缺少 ${openBrackets} 个闭合的方括号 "]"。`
    }
  } else if (openBrackets < 0) {
    return {
      friendlyMessage: '多余的闭合方括号',
      suggestion: '发现了未匹配的闭合方括号 "]"，请核对数组结构。'
    }
  }

  // 5. 缺少冒号或逗号
  if (rawMsg.includes('Expected') || rawMsg.includes('Unexpected token')) {
    return {
      friendlyMessage: '语法符号异常或标记不匹配',
      suggestion: '请核对该位置前后是否缺少英文冒号 (:)、逗号 (,)，或者包含非法的转义字符。'
    }
  }

  return {
    friendlyMessage: 'JSON 语法错误',
    suggestion: '数据格式不符合 RFC 8259 规范，请根据指示标记排查语法。'
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
    const { line, col, pos } = extractPositionFromError(rawMsg, rawInput)
    const { friendlyMessage, suggestion } = diagnoseError(rawInput, rawMsg, line, col, pos)
    const snippet = buildCodeSnippet(rawInput, line, col)

    // 检测能否自动修复
    const { repaired, changed } = repairJson(rawInput)
    let canRepair = false
    let repairedPreview: string | undefined

    if (changed) {
      try {
        JSON.parse(repaired)
        canRepair = true
        repairedPreview = repaired
      } catch {
        canRepair = false
      }
    }

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
