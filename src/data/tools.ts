import type { ToolCategory, ToolMeta } from '../types/tool'
export type { ToolCategory, ToolCategoryId, ToolMeta } from '../types/tool'

export const toolCategories: ToolCategory[] = [
  {
    id: 'format-view',
    name: '格式化与阅读',
    description: 'JSON 缩进格式化、单行压缩、树形折叠展开与大型数据检索',
    icon: 'AlignLeft'
  },
  {
    id: 'validate-query',
    name: '校验与检索',
    description: 'JSON RFC 8259 规范校验、精确定位语法错误行列、JSONPath 提取',
    icon: 'ShieldCheck'
  },
  {
    id: 'convert-types',
    name: '转换与代码生成',
    description: 'TypeScript / Java / Go 类型生成、YAML / XML / CSV 多格式双向互转',
    icon: 'Code2'
  }
]

export const tools: ToolMeta[] = [
  {
    id: 'json-formatter',
    path: '/json-formatter',
    category: 'format-view',
    icon: 'AlignLeft',
    name: 'JSON Formatter',
    shortName: '格式化与压缩',
    description: '支持 2/4/Tab 缩进美化、单行紧凑压缩，具备容错智能修复（未加引号 key、单引号、尾随逗号）与字符统计',
    keywords: ['json', 'format', 'minify', 'repair', 'beautify', '格式化', '压缩', '修复', '美化'],
    tags: ['缩进美化', '单行压缩', '智能容错'],
    seoTitle: 'JSON Formatter - 格式化 / 美化 / 压缩 JSON - DevUtils',
    seoDescription: '免费在线 JSON 格式化与压缩工具，支持 2/4/Tab 缩进、单行压缩与智能容错修复，纯本地运行，保护数据隐私。',
    featured: true,
    order: 10
  },
  {
    id: 'json-viewer',
    path: '/json-viewer',
    category: 'format-view',
    icon: 'FolderTree',
    name: 'JSON Viewer',
    shortName: '树形阅读与搜索',
    description: '交互式阅读、层级展开折叠大型 JSON，支持全文搜索高亮、匹配导航、节点 JSONPath 一键提取与双栏对照',
    keywords: ['json viewer', 'tree view', 'search json', 'large json', '树形查看', '折叠', '搜索', '大型 json'],
    tags: ['大型 JSON', '树形折叠', '全文搜索'],
    seoTitle: 'JSON Viewer - 阅读、折叠、搜索大型 JSON - DevUtils',
    seoDescription: '专为大型 JSON 打造的交互式树形阅读器，支持多级折叠展开、即时搜索与高亮导航、一键复制节点路径。',
    featured: true,
    order: 20
  },
  {
    id: 'json-validator',
    path: '/json-validator',
    category: 'validate-query',
    icon: 'ShieldCheck',
    name: 'JSON Validator',
    shortName: '语法校验与定位',
    description: '检查 JSON 是否符合 RFC 8259 规范，精确定位错误行号与列号，提供代码上下文指针、诊断建议与一键修复',
    keywords: ['json validator', 'validate', 'json lint', 'syntax error', '校验', '合法性检查', '错误定位'],
    tags: ['RFC 8259', '行列定位', '错误诊断'],
    seoTitle: 'JSON Validator - 检查 JSON 是否合法并精确定位错误 - DevUtils',
    seoDescription: '精准定位 JSON 语法错误的在线校验工具，支持行号列号指针指示、单引号与尾逗号中文排错建议。',
    featured: true,
    order: 30
  },
  {
    id: 'json-path',
    path: '/json-path',
    category: 'validate-query',
    icon: 'Filter',
    name: 'JSON Path',
    shortName: 'JSONPath 提取',
    description: '交互式测试 JSONPath 提取表达式（支持通配符、过滤器、切片与多层级遍历），内置常用语法速查',
    keywords: ['jsonpath', 'json path', 'extract', 'query', '提取', '过滤', '表达式测试'],
    tags: ['RFC 9535', '路径检索', '切片过滤'],
    seoTitle: 'JSON Path - 查询 / 提取 JSON 数据 - DevUtils',
    seoDescription: '交互式 JSONPath 提取工具，支持完整 JSONPath 标准语法，实时显示匹配节点与路径清单。',
    featured: true,
    order: 40
  },
  {
    id: 'json-converter',
    path: '/json-converter',
    category: 'convert-types',
    icon: 'ArrowLeftRight',
    name: 'JSON Converter',
    shortName: '格式互转',
    description: '支持 JSON 与 YAML、XML、CSV / TSV 之间的无缝双向互转，保持结构完整并提供格式化输出',
    keywords: ['json to yaml', 'yaml to json', 'json to xml', 'json to csv', '格式转换', '互转'],
    tags: ['YAML / XML / CSV', '双向互转', '无损格式'],
    seoTitle: 'JSON Converter - JSON ↔ YAML / XML / CSV 互转工具 - DevUtils',
    seoDescription: '免费在线转换器，支持 JSON 与 YAML、XML、CSV、TSV 双向快速转换，本地安全计算。',
    featured: true,
    order: 50
  },
  {
    id: 'json-to-types',
    path: '/json-to-types',
    category: 'convert-types',
    icon: 'FileType',
    name: 'JSON to Type',
    shortName: '转代码模型',
    description: '根据 JSON 自动推断并生成 TypeScript (interface/type)、Java (POJO/Record/Lombok)、Go Struct 等类型定义',
    keywords: ['json to ts', 'json to java', 'json to go', 'json to typescript', '类型生成', '代码模型'],
    tags: ['TS / Java / Go', '模型推导', '一键导出'],
    seoTitle: 'JSON to Type - JSON → TypeScript / Java / Go 类型定义 - DevUtils',
    seoDescription: '一键将 JSON 数据转换为强类型代码模型，支持 TypeScript、Java POJO / Record / Lombok、Go Struct。',
    featured: true,
    order: 60
  }
]

export const toolsByCategory = toolCategories.map(category => ({
  ...category,
  tools: tools.filter(tool => tool.category === category.id)
}))

export function getToolById(id: string): ToolMeta | undefined {
  return tools.find(tool => tool.id === id)
}

export function getAllTools(): ToolMeta[] {
  return tools
}

export function searchTools(query: string): ToolMeta[] {
  const q = query.trim().toLowerCase()
  if (!q) return tools
  return tools.filter(tool =>
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.keywords.some(k => k.toLowerCase().includes(q))
  )
}
