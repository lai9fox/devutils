import type { ToolCategory, ToolCategoryId, ToolMeta } from '../types/tool'

export const toolCategories = [
  {
    id: 'data-format',
    icon: 'lucide:braces',
    name: '数据与格式化',
    description: '结构化数据的格式化、校验、解析与转换'
  },
  {
    id: 'encoding',
    icon: 'lucide:binary',
    name: '编码与解码',
    description: '常见 Web 编码、转义、Data URI 与字符信息'
  },
  {
    id: 'text-regex',
    icon: 'lucide:text-cursor-input',
    name: '文本与正则',
    description: '文本处理、差异对比、命名转换和正则测试'
  },
  {
    id: 'time-number',
    icon: 'lucide:calculator',
    name: '时间与数值',
    description: '时间、颜色、CSS 单位、进制和调度表达式'
  },
  {
    id: 'security-id',
    icon: 'lucide:shield-check',
    name: '安全与标识',
    description: 'Hash、JWT、密码和 UUID 等本地安全辅助'
  }
] as const satisfies ToolCategory[]

export const tools = [
  {
    id: 'json-formatter',
    path: '/json-formatter',
    category: 'data-format',
    icon: 'lucide:braces',
    name: 'JSON 格式化',
    description: 'JSON 格式化、压缩、校验与美化',
    keywords: ['json', 'format', 'minify', 'validate', '格式化', '压缩', '校验', '美化', 'json formatter'],
    seoTitle: 'JSON 格式化 - 在线JSON格式化压缩校验工具',
    seoDescription: '免费在线 JSON 格式化工具，支持美化、压缩、校验 JSON。本地运行，隐私安全。',
    featured: true,
    order: 10,
    relatedIds: ['yaml-formatter', 'json-schema-validator', 'json-path-extractor']
  },
  {
    id: 'base64-codec',
    path: '/base64-codec',
    category: 'encoding',
    icon: 'lucide:binary',
    name: 'Base64 编解码',
    description: 'Base64 编码与解码，支持文本转换',
    keywords: ['base64', 'encode', 'decode', '编码', '解码', 'base64 encoder', 'base64 decoder', '在线Base64'],
    seoTitle: 'Base64 编解码 - 在线Base64编码解码工具',
    seoDescription: '免费在线 Base64 编解码工具，支持文本 Base64 编码与解码。本地运行，隐私安全。',
    featured: true,
    order: 20,
    relatedIds: ['url-codec', 'data-uri-codec', 'html-entity-codec']
  },
  {
    id: 'url-codec',
    path: '/url-codec',
    category: 'encoding',
    icon: 'lucide:link',
    name: 'URL 编解码',
    description: 'URL 编码与解码，支持 encodeURI 和 encodeURIComponent',
    keywords: ['url', 'encode', 'decode', 'uri', 'percent', '百分号编码', 'url encoder', 'url decoder', '免费URL编码解码'],
    seoTitle: 'URL 编解码 - 在线URL编码解码工具',
    seoDescription: '免费在线 URL 编解码工具，支持 encodeURI 和 encodeURIComponent 两种模式，URL 编码与解码一键转换。本地运行，隐私安全。',
    featured: true,
    order: 30,
    relatedIds: ['url-query-parser', 'base64-codec', 'html-entity-codec']
  },
  {
    id: 'jwt-decoder',
    path: '/jwt-decoder',
    category: 'security-id',
    icon: 'lucide:shield-check',
    name: 'JWT 解码器',
    description: '解析 JWT Token，查看 Header 和 Payload，检查过期时间',
    keywords: ['jwt', 'token', 'decode', '解码', 'json web token', 'bearer', '令牌', 'jwt decoder'],
    seoTitle: 'JWT 解码器 - 在线JWT Token解析工具',
    seoDescription: '免费在线 JWT 解码器，解析 Header 和 Payload，检查过期时间。本地运行，隐私安全。',
    featured: true,
    order: 40,
    relatedIds: ['hash-digest', 'password-generator', 'json-formatter']
  },
  {
    id: 'hash-digest',
    path: '/hash-digest',
    category: 'security-id',
    icon: 'lucide:hash',
    name: 'Hash 摘要',
    description: '计算文本或文件的 MD5、SHA-1、SHA-256、SHA-384、SHA-512 摘要',
    keywords: ['hash', 'md5', 'sha1', 'sha256', 'sha384', 'sha512', '摘要', '校验', 'checksum', '哈希', '摘要工具'],
    seoTitle: 'Hash 摘要 - 在线 MD5/SHA 哈希计算工具',
    seoDescription: '免费在线 Hash 摘要工具，支持 MD5、SHA-1、SHA-256、SHA-384、SHA-512，可对文本或文件计算十六进制摘要。本地运行，隐私安全。',
    featured: true,
    order: 50,
    relatedIds: ['jwt-decoder', 'password-generator', 'uuid-generator']
  },
  {
    id: 'timestamp-converter',
    path: '/timestamp-converter',
    category: 'time-number',
    icon: 'lucide:clock',
    name: '时间戳转换',
    description: 'Unix 时间戳与日期时间互转，支持秒/毫秒',
    keywords: ['timestamp', 'unix', '时间戳', '日期', '时间', '转换', 'timestamp converter', 'unix time'],
    seoTitle: '时间戳转换 - Unix时间戳与日期互转工具',
    seoDescription: '免费在线时间戳转换工具，Unix 时间戳与日期时间互转，支持秒和毫秒。本地运行，隐私安全。',
    featured: true,
    order: 60,
    relatedIds: ['cron-parser', 'number-base-converter']
  },
  {
    id: 'regex-tester',
    path: '/regex-tester',
    category: 'text-regex',
    icon: 'lucide:regex',
    name: '正则测试器',
    description: '实时测试正则表达式，高亮匹配结果，展示捕获组',
    keywords: ['regex', 'regexp', '正则', '正则表达式', '匹配', 'regular expression', 'pattern', '测试'],
    seoTitle: '正则测试器 - 在线正则表达式测试工具',
    seoDescription: '免费在线正则表达式测试工具，实时匹配高亮，展示捕获组。本地运行，隐私安全。',
    featured: true,
    order: 70,
    relatedIds: ['text-diff', 'text-counter', 'case-converter']
  },
  {
    id: 'text-diff',
    path: '/text-diff',
    category: 'text-regex',
    icon: 'lucide:file-diff',
    name: '文本对比',
    description: '对比两段文本差异并高亮显示，支持逐字、逐词、逐行模式',
    keywords: ['diff', 'compare', '对比', '差异', '文本对比', 'text diff', '文本比较'],
    seoTitle: '文本对比 - 在线文本差异对比工具',
    seoDescription: '免费在线文本对比工具，支持逐字、逐词、逐行对比两段文本差异，增删内容高亮显示。本地运行，隐私安全。',
    order: 80,
    relatedIds: ['regex-tester', 'text-counter', 'case-converter']
  },
  {
    id: 'password-generator',
    path: '/password-generator',
    category: 'security-id',
    icon: 'lucide:key-round',
    name: '密码生成器',
    description: '生成强随机密码，可配置长度与字符类型（大小写、数字、符号）',
    keywords: ['password', '密码', '随机密码', '强密码', 'password generator', '安全密码', '随机字符串'],
    seoTitle: '密码生成器 - 在线强随机密码生成工具',
    seoDescription: '免费在线密码生成器，可配置长度、大小写、数字、符号，使用加密安全随机数生成。本地运行，隐私安全。',
    order: 90,
    relatedIds: ['uuid-generator', 'hash-digest']
  },
  {
    id: 'uuid-generator',
    path: '/uuid-generator',
    category: 'security-id',
    icon: 'lucide:fingerprint',
    name: 'UUID 生成器',
    description: '生成各版本 UUID（v1/v3/v4/v5/v6/v7），支持批量生成',
    keywords: ['uuid', 'guid', 'v1', 'v3', 'v4', 'v5', 'v6', 'v7', '唯一标识', '随机ID', 'uuid generator', '免费UUID生成'],
    seoTitle: 'UUID 生成器 - 在线UUID/GUID生成工具',
    seoDescription: '免费在线 UUID 生成器，支持 v1/v3/v4/v5/v6/v7 各版本 UUID 生成，支持批量生成、大写、无连字符等选项。本地运行，隐私安全。',
    order: 100,
    relatedIds: ['password-generator', 'hash-digest']
  },
  {
    id: 'yaml-formatter',
    path: '/yaml-formatter',
    category: 'data-format',
    icon: 'lucide:file-json-2',
    name: 'YAML 格式化',
    description: 'YAML 格式化、压缩、校验与 YAML / JSON 互转',
    keywords: ['yaml', 'yml', 'json', 'format', 'validate', 'convert', '格式化', '校验', '互转', 'yaml formatter'],
    seoTitle: 'YAML 格式化 - 在线YAML格式化校验与JSON互转工具',
    seoDescription: '免费在线 YAML 格式化工具，支持 YAML 美化、压缩、校验，以及 YAML 与 JSON 双向转换。本地运行，隐私安全。',
    order: 110,
    relatedIds: ['json-formatter', 'xml-formatter']
  },
  {
    id: 'xml-formatter',
    path: '/xml-formatter',
    category: 'data-format',
    icon: 'lucide:file-code-2',
    name: 'XML 格式化',
    description: 'XML 格式化、压缩、校验与 XML 转 JSON',
    keywords: ['xml', 'format', 'minify', 'validate', 'json', '格式化', '压缩', '校验', 'XML转JSON', 'xml formatter'],
    seoTitle: 'XML 格式化 - 在线 XML 格式化压缩校验工具',
    seoDescription: '免费在线 XML 格式化工具，支持 XML 美化、压缩、校验和 XML 转 JSON。本地运行，隐私安全。',
    order: 120,
    relatedIds: ['json-formatter', 'yaml-formatter']
  },
  {
    id: 'json-schema-validator',
    path: '/json-schema-validator',
    category: 'data-format',
    icon: 'lucide:shield-check',
    name: 'JSON Schema 校验',
    description: '使用 JSON Schema 校验 JSON 数据，支持 format、本地 $ref、$defs 与 definitions',
    keywords: ['json schema', 'schema', 'ajv', 'validate', 'validation', 'json', '校验', '验证', '$ref', '$defs', 'definitions'],
    seoTitle: 'JSON Schema 校验 - 在线 JSON Schema Validator',
    seoDescription: '免费在线 JSON Schema 校验工具，使用 Ajv 在本地校验 JSON 数据，支持 format、本地 $ref、$defs 与 definitions。',
    order: 130,
    relatedIds: ['json-formatter', 'json-path-extractor']
  },
  {
    id: 'csv-tsv-converter',
    path: '/csv-tsv-converter',
    category: 'data-format',
    icon: 'lucide:table',
    name: 'CSV / TSV 转换',
    description: '解析 CSV、TSV、分号或竖线分隔文本，并转换为 JSON、Markdown、CSV、TSV',
    keywords: ['csv', 'tsv', 'table', 'json', 'markdown', 'delimiter', '表格', '转换', '逗号分隔', '制表符', 'csv converter'],
    seoTitle: 'CSV / TSV 转换 - 在线表格数据转换工具',
    seoDescription: '免费在线 CSV / TSV 转换工具，支持自动或手动分隔符、表头开关，并输出 JSON、Markdown、CSV、TSV。本地运行，隐私安全。',
    order: 140,
    relatedIds: ['json-formatter', 'yaml-formatter']
  },
  {
    id: 'json-path-extractor',
    path: '/json-path-extractor',
    category: 'data-format',
    icon: 'lucide:list-tree',
    name: 'JSON 路径提取',
    description: '用轻量 JSON 路径表达式从 JSON 中提取字段或数组元素',
    keywords: ['json path', 'jsonpath', 'json', 'extract', '路径', '提取', '字段', 'JSON路径'],
    seoTitle: 'JSON 路径提取 - 在线 JSON 字段提取工具',
    seoDescription: '免费在线 JSON 路径提取工具，支持 $.a.b、items[0]、items[*].id、["key-with-dash"] 等轻量路径。本地运行，隐私安全。',
    order: 150,
    relatedIds: ['json-formatter', 'json-schema-validator']
  },
  {
    id: 'url-query-parser',
    path: '/url-query-parser',
    category: 'data-format',
    icon: 'lucide:route',
    name: 'URL / Query 解析',
    description: '解析 URL 组成部分与 Query 参数，保留重复 key 并可重建查询串',
    keywords: ['url', 'query', 'search params', 'parser', '解析', '参数', 'URL解析', 'query string'],
    seoTitle: 'URL / Query 解析 - 在线 URL 参数解析工具',
    seoDescription: '免费在线 URL / Query 解析工具，支持完整 URL、相对 URL 和 query string，保留重复参数并输出 JSON。本地运行，隐私安全。',
    order: 160,
    relatedIds: ['url-codec', 'json-formatter']
  },
  {
    id: 'html-entity-codec',
    path: '/html-entity-codec',
    category: 'encoding',
    icon: 'lucide:code-xml',
    name: 'HTML 实体编解码',
    description: '将特殊字符转义为 HTML 实体或反向还原',
    keywords: ['html', 'entity', 'encode', 'decode', 'escape', '转义', 'HTML实体', '编码', '解码', '特殊字符'],
    seoTitle: 'HTML 实体编解码 - 在线 HTML 转义工具',
    seoDescription: '免费在线 HTML 实体编解码工具，支持命名实体和数字实体模式，将特殊字符转为 HTML 实体或还原。本地运行，隐私安全。',
    order: 170,
    relatedIds: ['url-codec', 'base64-codec']
  },
  {
    id: 'data-uri-codec',
    path: '/data-uri-codec',
    category: 'encoding',
    icon: 'lucide:file-code-2',
    name: 'Data URI 编解码',
    description: '将文本或文件编码为 Data URI，或解析 Data URI 的 MIME、大小与内容',
    keywords: ['data uri', 'data url', 'base64', 'mime', '编码', '解码', 'DataURI', 'data url encoder'],
    seoTitle: 'Data URI 编解码 - 在线 Data URL 转换工具',
    seoDescription: '免费在线 Data URI 编解码工具，支持文本和文件编码、Data URI 解析、图片预览与文本预览。本地运行，隐私安全。',
    order: 180,
    relatedIds: ['base64-codec', 'url-codec']
  },
  {
    id: 'unicode-lookup',
    path: '/unicode-lookup',
    category: 'encoding',
    icon: 'lucide:binary',
    name: 'Unicode 查询',
    description: '查看字符的 Unicode 码点、UTF-8 / UTF-16 编码信息',
    keywords: ['unicode', 'ascii', '码点', 'code point', 'utf-8', 'utf-16', '字符', 'character', '编码'],
    seoTitle: 'Unicode 查询 - 在线字符编码信息查询工具',
    seoDescription: '免费在线 Unicode 查询工具，输入字符查看码点、UTF-8 / UTF-16 字节序列等详细编码信息。本地运行，隐私安全。',
    order: 190,
    relatedIds: ['html-entity-codec', 'base64-codec']
  },
  {
    id: 'text-counter',
    path: '/text-counter',
    category: 'text-regex',
    icon: 'lucide:calculator',
    name: '文本统计',
    description: '实时统计字符数、单词数、行数、段落数、阅读时间',
    keywords: ['字数统计', '字符数', '单词数', '行数', 'word count', 'character count', 'text counter', '文本统计'],
    seoTitle: '文本统计 - 在线字数字符统计工具',
    seoDescription: '免费在线文本统计工具，实时统计字符数、单词数、行数、段落数和预计阅读时间。本地运行，隐私安全。',
    order: 200,
    relatedIds: ['text-diff', 'case-converter']
  },
  {
    id: 'case-converter',
    path: '/case-converter',
    category: 'text-regex',
    icon: 'lucide:case-sensitive',
    name: '大小写转换',
    description: '在 camelCase、snake_case、kebab-case 等常见命名风格间转换',
    keywords: ['case', 'camelcase', 'snake_case', 'kebab-case', 'pascalcase', '大小写', '命名转换', 'case converter'],
    seoTitle: '大小写转换 - 在线命名风格转换工具',
    seoDescription: '免费在线大小写转换工具，支持 camelCase、PascalCase、snake_case、kebab-case、CONSTANT_CASE 等命名风格。本地运行，隐私安全。',
    order: 210,
    relatedIds: ['text-counter', 'regex-tester']
  },
  {
    id: 'lorem-generator',
    path: '/lorem-generator',
    category: 'text-regex',
    icon: 'lucide:text',
    name: 'Lorem 生成器',
    description: '生成 Lorem Ipsum 占位文本，按段落/句子/单词',
    keywords: ['lorem', 'ipsum', '占位文本', '假文', 'placeholder', 'dummy text', 'lorem generator'],
    seoTitle: 'Lorem 生成器 - 在线Lorem Ipsum占位文本生成工具',
    seoDescription: '免费在线 Lorem Ipsum 生成器，按段落、句子、单词生成占位文本。本地运行，隐私安全。',
    order: 220,
    relatedIds: ['text-counter', 'case-converter']
  },
  {
    id: 'cron-parser',
    path: '/cron-parser',
    category: 'time-number',
    icon: 'lucide:timer',
    name: 'Cron 解析器',
    description: '解析 Cron 表达式为自然语言描述，计算下次执行时间',
    keywords: ['cron', '定时任务', 'crontab', '计划任务', 'schedule', 'cron parser', 'cron表达式'],
    seoTitle: 'Cron 解析器 - 在线 Cron 表达式解析工具',
    seoDescription: '免费在线 Cron 表达式解析工具，将 cron 表达式翻译为中文自然语言描述，并计算接下来多次执行时间。本地运行，隐私安全。',
    order: 230,
    relatedIds: ['timestamp-converter']
  },
  {
    id: 'number-base-converter',
    path: '/number-base-converter',
    category: 'time-number',
    icon: 'lucide:hash',
    name: '进制转换',
    description: '二进制、八进制、十进制、十六进制数字互转',
    keywords: ['进制', '二进制', '八进制', '十进制', '十六进制', 'binary', 'octal', 'decimal', 'hex', 'base converter', 'radix'],
    seoTitle: '进制转换 - 在线数字进制转换工具',
    seoDescription: '免费在线进制转换工具，二进制、八进制、十进制、十六进制互转。本地运行，隐私安全。',
    order: 240,
    relatedIds: ['css-unit-converter', 'timestamp-converter']
  },
  {
    id: 'css-unit-converter',
    path: '/css-unit-converter',
    category: 'time-number',
    icon: 'lucide:ruler',
    name: 'CSS 单位转换',
    description: 'px、rem、em、pt、vw、vh 等 CSS 单位互转',
    keywords: ['css', 'px', 'rem', 'em', 'pt', 'vw', 'vh', '单位', '转换', 'css unit', '像素', 'pixel'],
    seoTitle: 'CSS 单位转换 - 在线 px/rem/em/pt 互转工具',
    seoDescription: '免费在线 CSS 单位转换工具，支持 px、rem、em、pt、vw、vh 互转，可配置基准字号和视口尺寸。本地运行，隐私安全。',
    order: 250,
    relatedIds: ['color-converter', 'number-base-converter']
  },
  {
    id: 'color-converter',
    path: '/color-converter',
    category: 'time-number',
    icon: 'lucide:palette',
    name: '颜色转换',
    description: '在 HEX、HEX8、RGB、HSL、HSV、CMYK 间互转，并输出 OKLCH，实时预览',
    keywords: ['color', 'hex', 'hex8', 'rgb', 'hsl', 'hsv', 'cmyk', 'oklch', '颜色', '转换', '色值', 'color converter', '颜色转换'],
    seoTitle: '颜色转换 - 在线 HEX/RGB/HSL 颜色互转工具',
    seoDescription: '免费在线颜色转换工具，支持 HEX、HEX8、RGB、HSL、HSV、CMYK 互转，并输出 OKLCH，实时预览颜色。本地运行，隐私安全。',
    order: 260,
    relatedIds: ['css-unit-converter']
  }
] as const satisfies ToolMeta[]

export const reservedToolIds = [
  'robots.txt',
  'sitemap.xml',
  'favicon.svg'
] as const

export const toolsByCategory = toolCategories.map(category => ({
  ...category,
  tools: tools.filter(tool => tool.category === category.id)
}))

export function getToolById(id: string): ToolMeta | undefined {
  return tools.find(tool => tool.id === id)
}

export function getCategoryById(id: ToolCategoryId): ToolCategory | undefined {
  return toolCategories.find(category => category.id === id)
}

export function isReservedToolId(id: string): boolean {
  return reservedToolIds.includes(id as typeof reservedToolIds[number])
}
