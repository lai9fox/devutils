/**
 * JSON 转各种编程语言类型定义工具
 * 支持 TypeScript, Java, Go, Rust, Python
 */

function toPascalCase(str: string): string {
  return (
    str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('') || 'Item'
  )
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

// 1. TypeScript Generator
export function jsonToTypeScript(json: unknown, rootName = 'RootObject'): string {
  const interfaces: string[] = []

  function generateInterface(obj: Record<string, unknown>, name: string): string {
    const lines: string[] = []
    lines.push(`export interface ${name} {`)

    for (const [key, value] of Object.entries(obj)) {
      const typeStr = getType(value, toPascalCase(key))
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
      lines.push(`  ${safeKey}: ${typeStr};`)
    }

    lines.push('}')
    return lines.join('\n')
  }

  function getType(val: unknown, keyContext: string): string {
    if (val === null) return 'any'
    if (typeof val === 'string') return 'string'
    if (typeof val === 'number') return 'number'
    if (typeof val === 'boolean') return 'boolean'
    if (Array.isArray(val)) {
      if (val.length === 0) return 'any[]'
      const innerType = getType(val[0], keyContext + 'Item')
      return `${innerType}[]`
    }
    if (typeof val === 'object') {
      const subName = keyContext
      interfaces.push(generateInterface(val as Record<string, unknown>, subName))
      return subName
    }
    return 'any'
  }

  if (Array.isArray(json)) {
    if (json.length > 0 && typeof json[0] === 'object' && json[0] !== null) {
      interfaces.push(generateInterface(json[0] as Record<string, unknown>, rootName + 'Item'))
      return `${interfaces.reverse().join('\n\n')}\n\nexport type ${rootName} = ${rootName}Item[];`
    }
    return `export type ${rootName} = any[];`
  }

  if (typeof json === 'object' && json !== null) {
    interfaces.push(generateInterface(json as Record<string, unknown>, rootName))
    return interfaces.reverse().join('\n\n')
  }

  return `export type ${rootName} = ${typeof json};`
}

// 2. Java Generator (支持 POJO / Record / Lombok)
export type JavaStyle = 'pojo' | 'record' | 'lombok'

export function jsonToJava(json: unknown, rootName = 'Root', style: JavaStyle = 'pojo'): string {
  const classes: string[] = []
  let hasList = false

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
      const innerType = getJavaType(val[0], keyContext + 'Item')
      return `List<${innerType}>`
    }
    if (typeof val === 'object') {
      generateClass(val as Record<string, unknown>, keyContext)
      return keyContext
    }
    return 'Object'
  }

  function generateClass(obj: Record<string, unknown>, name: string) {
    const entries = Object.entries(obj)

    if (style === 'record') {
      const fieldList: string[] = []
      for (const [key, val] of entries) {
        const fieldName = toCamelCase(key)
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
        const fieldName = toCamelCase(key)
        const fieldType = getJavaType(val, toPascalCase(key))
        lines.push(`    @JsonProperty("${key}")`)
        lines.push(`    private ${fieldType} ${fieldName};`)
        lines.push('')
      }
      if (entries.length > 0) lines.pop() // 移除最后一个空行
      lines.push('}')
      classes.push(lines.join('\n'))
      return
    }

    // Default: Standard POJO
    const lines: string[] = [`public class ${name} {`]
    const fields: { key: string; name: string; type: string }[] = []

    for (const [key, val] of entries) {
      const fieldName = toCamelCase(key)
      const fieldType = getJavaType(val, toPascalCase(key))
      fields.push({ key, name: fieldName, type: fieldType })
      lines.push(`    @JsonProperty("${key}")`)
      lines.push(`    private ${fieldType} ${fieldName};`)
    }

    lines.push('')
    // 无参构造函数
    lines.push(`    public ${name}() {}`)
    lines.push('')

    // Getters and Setters
    for (const f of fields) {
      const pascal = f.name.charAt(0).toUpperCase() + f.name.slice(1)
      lines.push(`    public ${f.type} get${pascal}() {`)
      lines.push(`        return this.${f.name};`)
      lines.push(`    }`)
      lines.push('')
      lines.push(`    public void set${pascal}(${f.type} ${f.name}) {`)
      lines.push(`        this.${f.name} = ${f.name};`)
      lines.push(`    }`)
      lines.push('')
    }
    lines.pop() // 移除多余空行
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
    generateClass(json as Record<string, unknown>, rootName)
    if (hasList) {
      importList.unshift('import java.util.List;')
    }
    return `${importList.join('\n')}\n\n${classes.reverse().join('\n\n')}`
  }

  if (Array.isArray(json)) {
    if (json.length > 0 && typeof json[0] === 'object' && json[0] !== null) {
      generateClass(json[0] as Record<string, unknown>, rootName + 'Item')
      importList.unshift('import java.util.List;')
      return `${importList.join('\n')}\n\n${classes.reverse().join('\n\n')}\n\n// 根节点为列表: List<${rootName}Item>`
    }
    return `import java.util.List;\n\n// 根节点为列表: List<Object>`
  }

  return `// 根节点需为 JSON 对象\npublic class ${rootName} {}`
}

// 3. Go Struct Generator
export function jsonToGo(json: unknown, rootName = 'AutoGenerated'): string {
  const structs: string[] = []

  function generateStruct(obj: Record<string, unknown>, name: string): string {
    const lines: string[] = []
    lines.push(`type ${name} struct {`)

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toPascalCase(key)
      const fieldType = getGoType(value, fieldName)
      lines.push(`\t${fieldName} ${fieldType} \`json:"${key}"\``)
    }

    lines.push('}')
    return lines.join('\n')
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
      const innerType = getGoType(val[0], keyContext + 'Item')
      return `[]${innerType}`
    }
    if (typeof val === 'object') {
      structs.push(generateStruct(val as Record<string, unknown>, keyContext))
      return keyContext
    }
    return 'interface{}'
  }

  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    structs.push(generateStruct(json as Record<string, unknown>, rootName))
    return structs.reverse().join('\n\n')
  }

  return `// 根节点需为 JSON 对象\ntype ${rootName} struct {}`
}

// 4. Rust Struct Generator
export function jsonToRust(json: unknown, rootName = 'Root'): string {
  const structs: string[] = []

  function generateStruct(obj: Record<string, unknown>, name: string): string {
    const lines: string[] = []
    lines.push('#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]')
    lines.push('#[serde(rename_all = "camelCase")]')
    lines.push(`pub struct ${name} {`)

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toSnakeCase(key)
      const fieldType = getRustType(value, toPascalCase(key))
      if (fieldName !== key) {
        lines.push(`    #[serde(rename = "${key}")]`)
      }
      lines.push(`    pub ${fieldName}: ${fieldType},`)
    }

    lines.push('}')
    return lines.join('\n')
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
      const inner = getRustType(val[0], keyContext + 'Item')
      return `Vec<${inner}>`
    }
    if (typeof val === 'object') {
      structs.push(generateStruct(val as Record<string, unknown>, keyContext))
      return keyContext
    }
    return 'serde_json::Value'
  }

  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    structs.push(generateStruct(json as Record<string, unknown>, rootName))
    return `use serde::{Serialize, Deserialize};\n\n${structs.reverse().join('\n\n')}`
  }

  return `// 根节点需为 JSON 对象\npub struct ${rootName} {}`
}

// 5. Python Pydantic Generator
export function jsonToPython(json: unknown, rootName = 'RootModel'): string {
  const models: string[] = []

  function generateModel(obj: Record<string, unknown>, name: string): string {
    const lines: string[] = []
    lines.push(`class ${name}(BaseModel):`)

    const entries = Object.entries(obj)
    if (entries.length === 0) {
      lines.push('    pass')
      return lines.join('\n')
    }

    for (const [key, value] of entries) {
      const fieldName = toSnakeCase(key)
      const fieldType = getPythonType(value, toPascalCase(key))
      if (fieldName !== key) {
        lines.push(`    ${fieldName}: ${fieldType} = Field(alias="${key}")`)
      } else {
        lines.push(`    ${fieldName}: ${fieldType}`)
      }
    }

    return lines.join('\n')
  }

  function getPythonType(val: unknown, keyContext: string): string {
    if (val === null) return 'Optional[Any] = None'
    if (typeof val === 'string') return 'str'
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'int' : 'float'
    }
    if (typeof val === 'boolean') return 'bool'
    if (Array.isArray(val)) {
      if (val.length === 0) return 'List[Any]'
      const inner = getPythonType(val[0], keyContext + 'Item')
      return `List[${inner}]`
    }
    if (typeof val === 'object') {
      models.push(generateModel(val as Record<string, unknown>, keyContext))
      return keyContext
    }
    return 'Any'
  }

  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    models.push(generateModel(json as Record<string, unknown>, rootName))
    return `from typing import List, Optional, Any\nfrom pydantic import BaseModel, Field\n\n${models.reverse().join('\n\n')}`
  }

  return `# 根节点需为 JSON 对象\nclass ${rootName}(BaseModel):\n    pass`
}
