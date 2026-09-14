/**
 * JSON 转各种编程语言类型定义工具
 * 支持 TypeScript, Java, Go, Rust, Python
 */

function toPascalCase(str: string): string {
  const words = str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
  if (words.length === 0) return 'Item'
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1) || 'item'
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/[^a-zA-Z0-9_]/g, '_')
}

const JAVA_KEYWORDS = new Set([
  'abstract',
  'assert',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extends',
  'final',
  'finally',
  'float',
  'for',
  'goto',
  'if',
  'implements',
  'import',
  'instanceof',
  'int',
  'interface',
  'long',
  'native',
  'new',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'strictfp',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'try',
  'void',
  'volatile',
  'while',
  'record'
])

function toJavaFieldName(key: string): string {
  let name = toCamelCase(key)
  if (name === 'class') return 'clazz'
  if (/^[0-9]/.test(name)) {
    name = '_' + name
  } else if (JAVA_KEYWORDS.has(name)) {
    name = name + '_'
  }
  return name
}

function toJavaMethodName(fieldName: string, prefix: 'get' | 'set'): string {
  if (fieldName.startsWith('_')) {
    return `${prefix}${fieldName}`
  }
  const pascal = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
  return `${prefix}${pascal}`
}

const GO_KEYWORDS = new Set([
  'break',
  'default',
  'func',
  'interface',
  'select',
  'case',
  'defer',
  'go',
  'map',
  'struct',
  'chan',
  'else',
  'goto',
  'package',
  'switch',
  'const',
  'fallthrough',
  'if',
  'range',
  'type',
  'continue',
  'for',
  'import',
  'return',
  'var'
])

function toGoFieldName(key: string): string {
  let name = toPascalCase(key)
  if (/^[0-9]/.test(name)) {
    name = 'Field' + name
  } else if (GO_KEYWORDS.has(name.toLowerCase())) {
    name = name + 'Field'
  }
  return name
}

const PYTHON_KEYWORDS = new Set([
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'False',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'None',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'True',
  'try',
  'while',
  'with',
  'yield'
])

function toPythonFieldName(key: string): string {
  let name = toSnakeCase(key)
  if (/^[0-9]/.test(name)) {
    name = 'field_' + name
  } else if (PYTHON_KEYWORDS.has(name)) {
    name = name + '_'
  }
  return name
}

const RUST_KEYWORDS = new Set([
  'as',
  'break',
  'const',
  'continue',
  'crate',
  'else',
  'enum',
  'extern',
  'false',
  'fn',
  'for',
  'if',
  'impl',
  'in',
  'let',
  'loop',
  'match',
  'mod',
  'move',
  'mut',
  'pub',
  'ref',
  'return',
  'self',
  'Self',
  'static',
  'struct',
  'super',
  'trait',
  'true',
  'type',
  'unsafe',
  'use',
  'where',
  'while',
  'async',
  'await',
  'dyn'
])

function toRustFieldName(key: string): string {
  let name = toSnakeCase(key)
  if (/^[0-9]/.test(name)) {
    return 'field_' + name
  }
  if (RUST_KEYWORDS.has(name)) {
    return 'r#' + name
  }
  return name
}

/**
 * 辅助：合并数组内多个对象的属性
 */
function mergeArrayObjectProperties(arr: Record<string, unknown>[]): {
  keys: string[]
  keyMap: Map<string, { values: unknown[]; isOptional: boolean }>
} {
  const keyMap = new Map<string, { values: unknown[]; isOptional: boolean }>()
  for (const obj of arr) {
    if (obj !== null && typeof obj === 'object') {
      for (const k of Object.keys(obj)) {
        if (!keyMap.has(k)) {
          keyMap.set(k, { values: [], isOptional: false })
        }
      }
    }
  }

  const allKeys = Array.from(keyMap.keys())
  for (const k of allKeys) {
    const entry = keyMap.get(k)!
    for (const obj of arr) {
      if (obj !== null && typeof obj === 'object') {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          entry.values.push(obj[k])
        } else {
          entry.isOptional = true
        }
      }
    }
  }

  return { keys: allKeys, keyMap }
}

// 1. TypeScript Generator
export function jsonToTypeScript(json: unknown, rootName = 'RootObject'): string {
  const interfaces: Map<string, string> = new Map()
  const usedNames = new Set<string>()

  function allocateName(base: string): string {
    let name = toPascalCase(base)
    if (!usedNames.has(name)) {
      usedNames.add(name)
      return name
    }
    let counter = 2
    while (usedNames.has(`${name}${counter}`)) {
      counter++
    }
    const unique = `${name}${counter}`
    usedNames.add(unique)
    return unique
  }

  function generateInterface(obj: Record<string, unknown>, name: string): string {
    const lines: string[] = []
    lines.push(`export interface ${name} {`)

    for (const [key, value] of Object.entries(obj)) {
      const typeStr = getType(value, name + toPascalCase(key), toPascalCase(key))
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
      lines.push(`  ${safeKey}: ${typeStr};`)
    }

    lines.push('}')
    const res = lines.join('\n')
    interfaces.set(name, res)
    return name
  }

  function generateMergedInterface(arr: Record<string, unknown>[], name: string): string {
    const { keys, keyMap } = mergeArrayObjectProperties(arr)
    const lines: string[] = []
    lines.push(`export interface ${name} {`)

    for (const key of keys) {
      const { values, isOptional } = keyMap.get(key)!
      const typeSet = new Set<string>()
      for (const val of values) {
        typeSet.add(getType(val, name + toPascalCase(key), toPascalCase(key)))
      }
      const typeStr = Array.from(typeSet).join(' | ') || 'any'
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
      lines.push(`  ${safeKey}${isOptional ? '?' : ''}: ${typeStr};`)
    }

    lines.push('}')
    const res = lines.join('\n')
    interfaces.set(name, res)
    return name
  }

  function getType(val: unknown, qualifiedContext: string, fallbackName: string): string {
    if (val === null) return 'any'
    if (typeof val === 'string') return 'string'
    if (typeof val === 'number') return 'number'
    if (typeof val === 'boolean') return 'boolean'
    if (Array.isArray(val)) {
      if (val.length === 0) return 'any[]'
      const objects = val.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === 'object' && !Array.isArray(item)
      )
      if (objects.length > 0) {
        const typeName = allocateName(fallbackName + 'Item')
        generateMergedInterface(objects, typeName)
        return `${typeName}[]`
      }
      const itemTypes = new Set<string>()
      for (const item of val) {
        itemTypes.add(getType(item, qualifiedContext + 'Item', fallbackName + 'Item'))
      }
      const union = Array.from(itemTypes).join(' | ')
      return itemTypes.size > 1 ? `(${union})[]` : `${union}[]`
    }
    if (typeof val === 'object') {
      const typeName = allocateName(fallbackName)
      generateInterface(val as Record<string, unknown>, typeName)
      return typeName
    }
    return 'any'
  }

  if (Array.isArray(json)) {
    const objects = json.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
    )
    if (objects.length > 0) {
      const typeName = allocateName(rootName + 'Item')
      generateMergedInterface(objects, typeName)
      return `${Array.from(interfaces.values()).join('\n\n')}\n\nexport type ${rootName} = ${typeName}[];`
    }
    return `export type ${rootName} = any[];`
  }

  if (typeof json === 'object' && json !== null) {
    usedNames.add(rootName)
    generateInterface(json as Record<string, unknown>, rootName)
    return Array.from(interfaces.values()).join('\n\n')
  }

  return `export type ${rootName} = ${typeof json};`
}

// 2. Java Generator
export type JavaStyle = 'pojo' | 'record' | 'lombok'

export function jsonToJava(json: unknown, rootName = 'Root', style: JavaStyle = 'pojo'): string {
  const classes: string[] = []
  const usedNames = new Set<string>()
  let hasList = false

  function allocateName(base: string): string {
    let name = toPascalCase(base)
    if (!usedNames.has(name)) {
      usedNames.add(name)
      return name
    }
    let counter = 2
    while (usedNames.has(`${name}${counter}`)) {
      counter++
    }
    const unique = `${name}${counter}`
    usedNames.add(unique)
    return unique
  }

  function getJavaType(val: unknown, keyContext: string): string {
    if (val === null) return 'Object'
    if (typeof val === 'string') return 'String'
    if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        return Math.abs(val) > 2147483647 ? 'Long' : 'Integer'
      }
      return 'Double'
    }
    if (typeof val === 'boolean') return 'Boolean'
    if (Array.isArray(val)) {
      hasList = true
      if (val.length === 0) return 'List<Object>'
      const objects = val.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === 'object' && !Array.isArray(item)
      )
      if (objects.length > 0) {
        const className = allocateName(keyContext + 'Item')
        generateClassFromObjects(objects, className)
        return `List<${className}>`
      }
      const innerType = getJavaType(val[0], keyContext + 'Item')
      return `List<${innerType}>`
    }
    if (typeof val === 'object') {
      const className = allocateName(keyContext)
      generateClass(val as Record<string, unknown>, className)
      return className
    }
    return 'Object'
  }

  function generateClassFromObjects(arr: Record<string, unknown>[], name: string) {
    const { keys, keyMap } = mergeArrayObjectProperties(arr)
    const merged: Record<string, unknown> = {}
    for (const k of keys) {
      const values = keyMap.get(k)!.values
      merged[k] = values.length > 0 ? values[0] : null
    }
    generateClass(merged, name)
  }

  function generateClass(obj: Record<string, unknown>, name: string) {
    const entries = Object.entries(obj)

    if (style === 'record') {
      const fieldList: string[] = []
      for (const [key, val] of entries) {
        const fieldName = toJavaFieldName(key)
        const fieldType = getJavaType(val, toPascalCase(key))
        const jsonAnnotation = `@JsonProperty("${key}") `
        fieldList.push(`    ${jsonAnnotation}${fieldType} ${fieldName}`)
      }
      const recordStr = [`public record ${name}(`, fieldList.join(',\n'), `) {}`].join('\n')
      classes.push(recordStr)
      return
    }

    if (style === 'lombok') {
      const lines: string[] = [
        `@Data`,
        `@NoArgsConstructor`,
        `@AllArgsConstructor`,
        `public class ${name} {`
      ]
      for (const [key, val] of entries) {
        const fieldName = toJavaFieldName(key)
        const fieldType = getJavaType(val, toPascalCase(key))
        lines.push(`    @JsonProperty("${key}")`)
        lines.push(`    private ${fieldType} ${fieldName};`)
        lines.push('')
      }
      if (entries.length > 0) lines.pop()
      lines.push('}')
      classes.push(lines.join('\n'))
      return
    }

    // Default: Standard POJO
    const lines: string[] = [`public class ${name} {`]
    const fields: { key: string; name: string; type: string }[] = []

    for (const [key, val] of entries) {
      const fieldName = toJavaFieldName(key)
      const fieldType = getJavaType(val, toPascalCase(key))
      fields.push({ key, name: fieldName, type: fieldType })
      lines.push(`    @JsonProperty("${key}")`)
      lines.push(`    private ${fieldType} ${fieldName};`)
    }

    lines.push('')
    lines.push(`    public ${name}() {}`)
    lines.push('')

    for (const f of fields) {
      const getter = toJavaMethodName(f.name, 'get')
      const setter = toJavaMethodName(f.name, 'set')
      lines.push(`    public ${f.type} ${getter}() {`)
      lines.push(`        return this.${f.name};`)
      lines.push(`    }`)
      lines.push('')
      lines.push(`    public void ${setter}(${f.type} ${f.name}) {`)
      lines.push(`        this.${f.name} = ${f.name};`)
      lines.push(`    }`)
      lines.push('')
    }
    lines.pop()
    lines.push('}')
    classes.push(lines.join('\n'))
  }

  const importList: string[] = ['import com.fasterxml.jackson.annotation.JsonProperty;']

  if (style === 'lombok') {
    importList.push('import lombok.Data;')
    importList.push('import lombok.NoArgsConstructor;')
    importList.push('import lombok.AllArgsConstructor;')
  }

  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    usedNames.add(rootName)
    generateClass(json as Record<string, unknown>, rootName)
    if (hasList) {
      importList.unshift('import java.util.List;')
    }
    return `${importList.join('\n')}\n\n${classes.join('\n\n')}`
  }

  if (Array.isArray(json)) {
    const objects = json.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
    )
    if (objects.length > 0) {
      const className = allocateName(rootName + 'Item')
      generateClassFromObjects(objects, className)
      importList.unshift('import java.util.List;')
      return `${importList.join('\n')}\n\n${classes.join('\n\n')}\n\n// 根节点为列表: List<${className}>`
    }
    return `import java.util.List;\n\n// 根节点为列表: List<Object>`
  }

  return `// 根节点需为 JSON 对象\npublic class ${rootName} {}`
}

// 3. Go Struct Generator
export function jsonToGo(json: unknown, rootName = 'AutoGenerated'): string {
  const structs: string[] = []
  const usedNames = new Set<string>()

  function allocateName(base: string): string {
    let name = toPascalCase(base)
    if (!usedNames.has(name)) {
      usedNames.add(name)
      return name
    }
    let counter = 2
    while (usedNames.has(`${name}${counter}`)) {
      counter++
    }
    const unique = `${name}${counter}`
    usedNames.add(unique)
    return unique
  }

  function generateStruct(obj: Record<string, unknown>, name: string): string {
    const lines: string[] = []
    lines.push(`type ${name} struct {`)

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toGoFieldName(key)
      const fieldType = getGoType(value, toPascalCase(key))
      lines.push(`\t${fieldName} ${fieldType} \`json:"${key}"\``)
    }

    lines.push('}')
    const res = lines.join('\n')
    structs.push(res)
    return name
  }

  function generateStructFromObjects(arr: Record<string, unknown>[], name: string): string {
    const { keys, keyMap } = mergeArrayObjectProperties(arr)
    const merged: Record<string, unknown> = {}
    for (const k of keys) {
      const values = keyMap.get(k)!.values
      merged[k] = values.length > 0 ? values[0] : null
    }
    return generateStruct(merged, name)
  }

  function getGoType(val: unknown, keyContext: string): string {
    if (val === null) return 'interface{}'
    if (typeof val === 'string') return 'string'
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'int64' : 'float64'
    }
    if (typeof val === 'boolean') return 'bool'
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]interface{}'
      const objects = val.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === 'object' && !Array.isArray(item)
      )
      if (objects.length > 0) {
        const structName = allocateName(keyContext + 'Item')
        generateStructFromObjects(objects, structName)
        return `[]${structName}`
      }
      const innerType = getGoType(val[0], keyContext + 'Item')
      return `[]${innerType}`
    }
    if (typeof val === 'object') {
      const structName = allocateName(keyContext)
      generateStruct(val as Record<string, unknown>, structName)
      return structName
    }
    return 'interface{}'
  }

  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    usedNames.add(rootName)
    generateStruct(json as Record<string, unknown>, rootName)
    return structs.join('\n\n')
  }

  return `// 根节点需为 JSON 对象\ntype ${rootName} struct {}`
}

// 4. Rust Struct Generator
export function jsonToRust(json: unknown, rootName = 'Root'): string {
  const structs: string[] = []
  const usedNames = new Set<string>()

  function allocateName(base: string): string {
    let name = toPascalCase(base)
    if (!usedNames.has(name)) {
      usedNames.add(name)
      return name
    }
    let counter = 2
    while (usedNames.has(`${name}${counter}`)) {
      counter++
    }
    const unique = `${name}${counter}`
    usedNames.add(unique)
    return unique
  }

  function generateStruct(obj: Record<string, unknown>, name: string): string {
    const lines: string[] = []
    lines.push('#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]')
    lines.push('#[serde(rename_all = "camelCase")]')
    lines.push(`pub struct ${name} {`)

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toRustFieldName(key)
      const fieldType = getRustType(value, toPascalCase(key))
      if (fieldName !== key) {
        lines.push(`    #[serde(rename = "${key}")]`)
      }
      lines.push(`    pub ${fieldName}: ${fieldType},`)
    }

    lines.push('}')
    const res = lines.join('\n')
    structs.push(res)
    return name
  }

  function getRustType(val: unknown, keyContext: string): string {
    if (val === null) return 'Option<serde_json::Value>'
    if (typeof val === 'string') return 'String'
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'i64' : 'f64'
    }
    if (typeof val === 'boolean') return 'bool'
    if (Array.isArray(val)) {
      if (val.length === 0) return 'Vec<serde_json::Value>'
      const objects = val.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === 'object' && !Array.isArray(item)
      )
      if (objects.length > 0) {
        const structName = allocateName(keyContext + 'Item')
        generateStruct(objects[0], structName)
        return `Vec<${structName}>`
      }
      const inner = getRustType(val[0], keyContext + 'Item')
      return `Vec<${inner}>`
    }
    if (typeof val === 'object') {
      const structName = allocateName(keyContext)
      generateStruct(val as Record<string, unknown>, structName)
      return structName
    }
    return 'serde_json::Value'
  }

  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    usedNames.add(rootName)
    generateStruct(json as Record<string, unknown>, rootName)
    return `use serde::{Serialize, Deserialize};\n\n${structs.join('\n\n')}`
  }

  return `// 根节点需为 JSON 对象\npub struct ${rootName} {}`
}

// 5. Python Pydantic Generator
export function jsonToPython(json: unknown, rootName = 'RootModel'): string {
  const models: string[] = []
  const usedNames = new Set<string>()

  function allocateName(base: string): string {
    let name = toPascalCase(base)
    if (!usedNames.has(name)) {
      usedNames.add(name)
      return name
    }
    let counter = 2
    while (usedNames.has(`${name}${counter}`)) {
      counter++
    }
    const unique = `${name}${counter}`
    usedNames.add(unique)
    return unique
  }

  function generateModel(obj: Record<string, unknown>, name: string): string {
    const lines: string[] = []
    lines.push(`class ${name}(BaseModel):`)

    const entries = Object.entries(obj)
    if (entries.length === 0) {
      lines.push('    pass')
      const res = lines.join('\n')
      models.push(res)
      return name
    }

    for (const [key, value] of entries) {
      const fieldName = toPythonFieldName(key)
      const fieldType = getPythonType(value, toPascalCase(key))
      const isAlias = fieldName !== key
      const isNull = value === null

      if (isAlias) {
        if (isNull) {
          lines.push(`    ${fieldName}: ${fieldType} = Field(default=None, alias="${key}")`)
        } else {
          lines.push(`    ${fieldName}: ${fieldType} = Field(alias="${key}")`)
        }
      } else {
        if (isNull) {
          lines.push(`    ${fieldName}: ${fieldType} = None`)
        } else {
          lines.push(`    ${fieldName}: ${fieldType}`)
        }
      }
    }

    const res = lines.join('\n')
    models.push(res)
    return name
  }

  function generateModelFromObjects(arr: Record<string, unknown>[], name: string): string {
    const { keys, keyMap } = mergeArrayObjectProperties(arr)
    const merged: Record<string, unknown> = {}
    for (const k of keys) {
      const values = keyMap.get(k)!.values
      merged[k] = values.length > 0 ? values[0] : null
    }
    return generateModel(merged, name)
  }

  function getPythonType(val: unknown, keyContext: string): string {
    if (val === null) return 'Optional[Any]'
    if (typeof val === 'string') return 'str'
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'int' : 'float'
    }
    if (typeof val === 'boolean') return 'bool'
    if (Array.isArray(val)) {
      if (val.length === 0) return 'List[Any]'
      const objects = val.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === 'object' && !Array.isArray(item)
      )
      if (objects.length > 0) {
        const modelName = allocateName(keyContext + 'Item')
        generateModelFromObjects(objects, modelName)
        return `List[${modelName}]`
      }
      // 非空基础数组
      const inner = getPythonType(val[0], keyContext + 'Item')
      return `List[${inner}]`
    }
    if (typeof val === 'object') {
      const modelName = allocateName(keyContext)
      generateModel(val as Record<string, unknown>, modelName)
      return modelName
    }
    return 'Any'
  }

  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    usedNames.add(rootName)
    generateModel(json as Record<string, unknown>, rootName)
    return `from __future__ import annotations\nfrom typing import List, Optional, Any\nfrom pydantic import BaseModel, Field\n\n${models.join('\n\n')}`
  }

  return `# 根节点需为 JSON 对象\nclass ${rootName}(BaseModel):\n    pass`
}
