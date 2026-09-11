import Papa from 'papaparse'

export type CsvArrayFormat = 'stringify' | 'join'

export interface CsvConvertOptions {
  flatten?: boolean
  arrayFormat?: CsvArrayFormat
}

function isPlainObject(val: any): val is Record<string, any> {
  return (
    val !== null &&
    typeof val === 'object' &&
    Object.prototype.toString.call(val) === '[object Object]'
  )
}

/**
 * 深度扁平化对象，将嵌套层级转换为 dot notation（如 user.name）
 */
export function flattenObject(
  obj: Record<string, any>,
  prefix = '',
  arrayFormat: CsvArrayFormat = 'stringify'
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (isPlainObject(value)) {
      const nested = flattenObject(value, newKey, arrayFormat)
      if (Object.keys(nested).length > 0) {
        Object.assign(result, nested)
      } else {
        result[newKey] = ''
      }
    } else if (Array.isArray(value)) {
      if (arrayFormat === 'join' && value.every((x) => x === null || typeof x !== 'object')) {
        result[newKey] = value.join(', ')
      } else {
        result[newKey] = JSON.stringify(value)
      }
    } else if (value !== null && typeof value === 'object') {
      result[newKey] = JSON.stringify(value)
    } else if (value === undefined || value === null) {
      result[newKey] = ''
    } else {
      result[newKey] = value
    }
  }
  return result
}

/**
 * 非扁平化模式：将顶层字段中的复杂对象/数组序列化为 JSON 字符串，避免出现 [object Object]
 */
export function stringifyNestedValues(
  obj: Record<string, any>,
  arrayFormat: CsvArrayFormat = 'stringify'
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      if (arrayFormat === 'join' && value.every((x) => x === null || typeof x !== 'object')) {
        result[key] = value.join(', ')
      } else {
        result[key] = JSON.stringify(value)
      }
    } else if (value !== null && typeof value === 'object') {
      result[key] = JSON.stringify(value)
    } else if (value === undefined || value === null) {
      result[key] = ''
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * 将 JSON 数据转换为 CSV 字符串
 * 针对支持的格式：
 * 1. 对象数组：`[{"name":"张三"},{"name":"李四"}]`
 * 2. 字段不一致的对象数组：`[{"name":"张三"},{"age":18}]`
 * 3. 单个对象：`{"name":"张三","age":18}`
 * 4. 二维数组：`[["name","age"],["张三",18]]`
 * 5. 一维字符串数组：`["Vue","Go","AI"]`
 * 6. 一维数字数组：`[1,2,3]`
 * 7. 嵌套对象：`[{"user":{"name":"张三"}}]` 或 `{"user":{"name":"张三"}}`
 * 8. 数组字段：`[{"tags":["Vue","Go"]}]`
 *
 * 其余不支持的格式抛出明确错误提示。
 */
export function jsonToCsv(json: any, options: CsvConvertOptions = {}): string {
  const flatten = options.flatten ?? true
  const arrayFormat = options.arrayFormat ?? 'stringify'

  if (json === null || json === undefined || json === '') return ''

  // 1. 基础类型（字符串、数字、布尔值、null）直接位于顶层时不支持
  if (typeof json !== 'object' || json === null) {
    throw new Error(
      '当前 JSON 格式不支持转换为 CSV。仅支持对象数组、单个对象、二维数组或一维基础类型数组。'
    )
  }

  // 2. 数组类型
  if (Array.isArray(json)) {
    if (json.length === 0) return ''

    // 检查是否为一维基础类型数组（字符串、数字、布尔、null）
    const allPrimitives = json.every((item) => item === null || typeof item !== 'object')
    if (allPrimitives) {
      return Papa.unparse({
        fields: ['value'],
        data: json.map((item) => [item ?? ''])
      })
    }

    // 检查是否为二维数组
    const allArrays = json.every((item) => Array.isArray(item))
    if (allArrays) {
      // 检查是否有 3 维以上数组
      const hasDeepArray = json.some((row) => row.some((cell: any) => Array.isArray(cell)))
      if (hasDeepArray) {
        throw new Error('不支持三维及以上的多维数组转换为 CSV。')
      }
      // 将非基础类型的单元格序列化为 JSON 字符串
      const processedRows = json.map((row) =>
        row.map((cell: any) =>
          cell !== null && typeof cell === 'object' ? JSON.stringify(cell) : (cell ?? '')
        )
      )
      return Papa.unparse(processedRows)
    }

    // 检查是否为对象数组
    const allObjects = json.every((item) => isPlainObject(item))
    if (allObjects) {
      const processedList = json.map((item) => {
        return flatten
          ? flattenObject(item, '', arrayFormat)
          : stringifyNestedValues(item, arrayFormat)
      })

      // 合并所有唯一的 key，不存在的值留空，确保不同字段的对象能够完整合并
      const allKeys = Array.from(new Set(processedList.flatMap((item) => Object.keys(item))))

      return Papa.unparse({
        fields: allKeys,
        data: processedList
      })
    }

    // 混合类型数组（如既有对象又有基础类型或数组）
    throw new Error(
      '当前数组元素类型不一致（混合了基础类型、对象或数组），无法转换为规整的 CSV 表格。'
    )
  }

  // 3. 单个普通对象
  if (isPlainObject(json)) {
    const keys = Object.keys(json)
    if (keys.length === 0) return ''

    const processed = flatten
      ? flattenObject(json, '', arrayFormat)
      : stringifyNestedValues(json, arrayFormat)

    const allKeys = Object.keys(processed)
    return Papa.unparse({
      fields: allKeys,
      data: [processed]
    })
  }

  throw new Error('当前 JSON 格式不支持转换为 CSV。')
}

/**
 * 智能还原单元格类型（布尔、JSON 对象/数组、数字等）
 */
export function parseCellValue(value: any): any {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return ''

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null

  // 尝试反序列化 JSON 数组或对象
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return value
    }
  }

  // 具有前导 0 且长度大于 1（如邮编、以 0 开头的电话或工号），保留原字符串
  if (/^0\d+$/.test(trimmed) || /^-0\d+$/.test(trimmed)) {
    return value
  }

  // 10 位以上纯数字（通常为手机号、账号、身份证、订单号、时间戳），保留字符串防止精度丢失
  if (/^\d{10,}$/.test(trimmed)) {
    return value
  }

  // 常规合法数字
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    const num = Number(trimmed)
    if (!isNaN(num) && Number.isFinite(num)) {
      return num
    }
  }

  return value
}

/**
 * 反扁平化：将 dot notation 键名还原为嵌套对象
 */
export function unflattenObject(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, rawValue] of Object.entries(obj)) {
    const value = parseCellValue(rawValue)
    const parts = key.split('.')
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {}
      }
      current = current[part]
    }
    current[parts[parts.length - 1]] = value
  }
  return result
}

/**
 * 将 CSV 字符串解析转换为 JSON 结构
 */
export function csvToJson(csvStr: string, options: CsvConvertOptions = {}): any {
  const flatten = options.flatten ?? true
  const parsed = Papa.parse(csvStr, { header: true, skipEmptyLines: true })

  if (parsed.errors && parsed.errors.length > 0 && (!parsed.data || parsed.data.length === 0)) {
    throw new Error(parsed.errors[0].message)
  }

  const rows = (parsed.data || []) as Record<string, any>[]
  if (rows.length === 0) return []

  // 检查是否为由一维基础类型数组导出的单列（表头为 value）
  const fields = parsed.meta?.fields || Object.keys(rows[0] || {})
  if (fields.length === 1 && fields[0] === 'value') {
    return rows.map((r) => parseCellValue(r.value))
  }

  const processed = rows.map((row) => {
    if (flatten) {
      return unflattenObject(row)
    } else {
      const res: Record<string, any> = {}
      for (const [k, v] of Object.entries(row)) {
        res[k] = parseCellValue(v)
      }
      return res
    }
  })

  return processed.length === 1 ? processed[0] : processed
}
