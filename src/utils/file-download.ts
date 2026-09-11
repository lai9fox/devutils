/**
 * 文件下载与格式推断工具模块
 */

export interface DownloadFileInfo {
  filename: string
  mime: string
  extension: string
}

/**
 * 常见文件后缀与 MIME 类型映射表
 */
export const EXTENSION_MIME_MAP: Record<string, string> = {
  // 数据与标记语言
  json: 'application/json',
  jsonc: 'application/json',
  json5: 'application/json',
  jsonl: 'application/x-ndjson',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  xml: 'application/xml',
  html: 'text/html',
  htm: 'text/html',
  svg: 'image/svg+xml',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  toml: 'text/plain',
  ini: 'text/plain',
  properties: 'text/plain',
  env: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  sql: 'application/sql',
  graphql: 'application/graphql',
  gql: 'application/graphql',

  // 样式语言
  css: 'text/css',
  scss: 'text/x-scss',
  sass: 'text/x-sass',
  less: 'text/x-less',

  // 编程与脚本语言
  js: 'text/javascript',
  mjs: 'text/javascript',
  cjs: 'text/javascript',
  ts: 'text/plain',
  mts: 'text/plain',
  cts: 'text/plain',
  jsx: 'text/javascript',
  tsx: 'text/plain',
  vue: 'text/plain',
  py: 'text/x-python',
  pyw: 'text/x-python',
  java: 'text/x-java',
  kt: 'text/plain',
  kts: 'text/plain',
  go: 'text/plain',
  rs: 'text/plain',
  c: 'text/x-c',
  h: 'text/x-c',
  cpp: 'text/x-c',
  cc: 'text/x-c',
  cxx: 'text/x-c',
  hpp: 'text/x-c',
  cs: 'text/plain',
  php: 'text/x-php',
  rb: 'text/x-ruby',
  swift: 'text/plain',
  dart: 'text/plain',
  sh: 'application/x-sh',
  bash: 'application/x-sh',
  zsh: 'application/x-sh',
  lua: 'text/plain',
  proto: 'text/plain',
  dockerfile: 'text/plain',

  // 纯文本格式
  txt: 'text/plain',
  text: 'text/plain',
  log: 'text/plain'
}

/**
 * 常见代码语言标识符与格式映射
 */
export const LANGUAGE_TO_FORMAT: Record<string, { ext: string; mime: string }> = {
  // JSON
  json: { ext: 'json', mime: 'application/json' },
  jsonc: { ext: 'jsonc', mime: 'application/json' },
  json5: { ext: 'json5', mime: 'application/json' },
  jsonl: { ext: 'jsonl', mime: 'application/x-ndjson' },

  // YAML & XML
  yaml: { ext: 'yaml', mime: 'text/yaml' },
  yml: { ext: 'yaml', mime: 'text/yaml' },
  xml: { ext: 'xml', mime: 'application/xml' },

  // HTML & CSS
  html: { ext: 'html', mime: 'text/html' },
  htm: { ext: 'html', mime: 'text/html' },
  svg: { ext: 'svg', mime: 'image/svg+xml' },
  css: { ext: 'css', mime: 'text/css' },
  scss: { ext: 'scss', mime: 'text/x-scss' },
  sass: { ext: 'sass', mime: 'text/x-sass' },
  less: { ext: 'less', mime: 'text/x-less' },

  // JS & TS
  javascript: { ext: 'js', mime: 'text/javascript' },
  js: { ext: 'js', mime: 'text/javascript' },
  mjs: { ext: 'mjs', mime: 'text/javascript' },
  cjs: { ext: 'cjs', mime: 'text/javascript' },
  typescript: { ext: 'ts', mime: 'text/plain' },
  ts: { ext: 'ts', mime: 'text/plain' },
  mts: { ext: 'mts', mime: 'text/plain' },
  cts: { ext: 'cts', mime: 'text/plain' },
  jsx: { ext: 'jsx', mime: 'text/javascript' },
  tsx: { ext: 'tsx', mime: 'text/plain' },
  vue: { ext: 'vue', mime: 'text/plain' },

  // Data & Docs
  csv: { ext: 'csv', mime: 'text/csv' },
  tsv: { ext: 'tsv', mime: 'text/tab-separated-values' },
  toml: { ext: 'toml', mime: 'text/plain' },
  ini: { ext: 'ini', mime: 'text/plain' },
  markdown: { ext: 'md', mime: 'text/markdown' },
  md: { ext: 'md', mime: 'text/markdown' },
  sql: { ext: 'sql', mime: 'application/sql' },
  graphql: { ext: 'graphql', mime: 'application/graphql' },
  gql: { ext: 'graphql', mime: 'application/graphql' },

  // Programming languages
  python: { ext: 'py', mime: 'text/x-python' },
  py: { ext: 'py', mime: 'text/x-python' },
  java: { ext: 'java', mime: 'text/x-java' },
  kotlin: { ext: 'kt', mime: 'text/plain' },
  kt: { ext: 'kt', mime: 'text/plain' },
  go: { ext: 'go', mime: 'text/plain' },
  golang: { ext: 'go', mime: 'text/plain' },
  rust: { ext: 'rs', mime: 'text/plain' },
  rs: { ext: 'rs', mime: 'text/plain' },
  c: { ext: 'c', mime: 'text/x-c' },
  cpp: { ext: 'cpp', mime: 'text/x-c' },
  'c++': { ext: 'cpp', mime: 'text/x-c' },
  cc: { ext: 'cpp', mime: 'text/x-c' },
  csharp: { ext: 'cs', mime: 'text/plain' },
  cs: { ext: 'cs', mime: 'text/plain' },
  'c#': { ext: 'cs', mime: 'text/plain' },
  php: { ext: 'php', mime: 'text/x-php' },
  ruby: { ext: 'rb', mime: 'text/x-ruby' },
  rb: { ext: 'rb', mime: 'text/x-ruby' },
  swift: { ext: 'swift', mime: 'text/plain' },
  dart: { ext: 'dart', mime: 'text/plain' },
  shell: { ext: 'sh', mime: 'application/x-sh' },
  sh: { ext: 'sh', mime: 'application/x-sh' },
  bash: { ext: 'sh', mime: 'application/x-sh' },
  zsh: { ext: 'sh', mime: 'application/x-sh' },
  lua: { ext: 'lua', mime: 'text/plain' },
  proto: { ext: 'proto', mime: 'text/plain' },
  protobuf: { ext: 'proto', mime: 'text/plain' },
  dockerfile: { ext: 'dockerfile', mime: 'text/plain' },

  // Text
  plain: { ext: 'txt', mime: 'text/plain' },
  text: { ext: 'txt', mime: 'text/plain' },
  txt: { ext: 'txt', mime: 'text/plain' }
}

/**
 * 判断指定后缀是否为已知合法文件扩展名
 */
export function isKnownExtension(ext: string): boolean {
  if (!ext) return false
  const cleanExt = ext.trim().toLowerCase().replace(/^\./, '')
  return Boolean(EXTENSION_MIME_MAP[cleanExt])
}

/**
 * 根据语言或内容尝试推导格式
 * 如果无法识别，返回文本格式 (txt, text/plain)
 */
export function getFormatFromLanguageOrContent(
  language?: string,
  content?: string
): { ext: string; mime: string } {
  const langKey = (language || '').trim().toLowerCase()
  if (langKey && LANGUAGE_TO_FORMAT[langKey]) {
    return LANGUAGE_TO_FORMAT[langKey]
  }

  // 若语言未匹配，尝试由内容特征识别 JSON 或 XML
  if (content) {
    const trimmed = content.trim()
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        JSON.parse(trimmed)
        return { ext: 'json', mime: 'application/json' }
      } catch {
        // 不是标准合法 JSON
      }
    }
    if (
      trimmed.startsWith('<') &&
      trimmed.endsWith('>') &&
      (trimmed.startsWith('<?xml') || trimmed.includes('</'))
    ) {
      return { ext: 'xml', mime: 'application/xml' }
    }
  }

  // 无法识别后缀，统一按文本格式 (.txt) 处理
  return { ext: 'txt', mime: 'text/plain' }
}

/**
 * 解析下载文件名、后缀与 MIME 类型
 * 核心规则：如果无法识别后缀，下载为文本格式 (.txt)
 */
export function resolveDownloadFileInfo(
  customFilename?: string,
  language?: string,
  title?: string,
  content?: string
): DownloadFileInfo {
  const rawTarget = (customFilename || '').trim()

  // 1. 如果调用方传递了具体的文件名
  if (rawTarget) {
    const lastDot = rawTarget.lastIndexOf('.')
    if (lastDot > 0 && lastDot < rawTarget.length - 1) {
      const extCandidate = rawTarget.slice(lastDot + 1).toLowerCase()
      const baseName = rawTarget.slice(0, lastDot)

      if (isKnownExtension(extCandidate)) {
        return {
          filename: rawTarget,
          mime: `${EXTENSION_MIME_MAP[extCandidate]};charset=utf-8`,
          extension: extCandidate
        }
      } else {
        // 后缀无法识别，下载为文本格式 (.txt)
        return {
          filename: `${baseName}.txt`,
          mime: 'text/plain;charset=utf-8',
          extension: 'txt'
        }
      }
    } else {
      // 文件名无后缀，根据语言或内容推断后缀
      const format = getFormatFromLanguageOrContent(language, content)
      return {
        filename: `${rawTarget}.${format.ext}`,
        mime: `${format.mime};charset=utf-8`,
        extension: format.ext
      }
    }
  }

  // 2. 未指定具体文件名时，检查标题是否自带已知扩展名 (如 config.json, schema.yaml)
  const cleanTitle = (title || '').trim()
  if (cleanTitle) {
    const lastDot = cleanTitle.lastIndexOf('.')
    if (
      lastDot > 0 &&
      lastDot < cleanTitle.length - 1 &&
      !cleanTitle.includes('/') &&
      !cleanTitle.includes('\\')
    ) {
      const extCandidate = cleanTitle.slice(lastDot + 1).toLowerCase()
      const baseName = cleanTitle.slice(0, lastDot)
      if (isKnownExtension(extCandidate)) {
        return {
          filename: cleanTitle,
          mime: `${EXTENSION_MIME_MAP[extCandidate]};charset=utf-8`,
          extension: extCandidate
        }
      } else {
        // 标题中含有不可识别后缀，下载为文本格式
        return {
          filename: `${baseName}.txt`,
          mime: 'text/plain;charset=utf-8',
          extension: 'txt'
        }
      }
    }
  }

  // 3. 根据语言类型或内容推导后缀与格式
  const format = getFormatFromLanguageOrContent(language, content)
  const safeBaseName = cleanTitle ? cleanTitle.replace(/[\\/:*?"<>|]/g, '_').trim() : 'code'

  return {
    filename: `${safeBaseName || 'code'}.${format.ext}`,
    mime: `${format.mime};charset=utf-8`,
    extension: format.ext
  }
}

/**
 * 触发浏览器文件下载
 */
export function triggerFileDownload(
  content: string,
  filename: string,
  mime: string = 'text/plain;charset=utf-8'
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  try {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch (err) {
    console.error('Failed to trigger file download', err)
    return false
  }
}
