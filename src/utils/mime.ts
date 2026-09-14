/**
 * 统一 MIME 类型与文件扩展名映射表
 */

export const EXT_TO_MIME_MAP: Record<string, string> = {
  // 图片类型
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  avif: 'image/avif',
  tiff: 'image/tiff',
  tif: 'image/tiff',

  // 音视频类型
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  aac: 'audio/aac',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',

  // 文档与归档
  pdf: 'application/pdf',
  zip: 'application/zip',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  '7z': 'application/x-7z-compressed',
  rar: 'application/vnd.rar',

  // 结构化数据
  json: 'application/json',
  jsonc: 'application/json',
  json5: 'application/json',
  jsonl: 'application/x-ndjson',
  ndjson: 'application/x-ndjson',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  xml: 'application/xml',
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

  // Web 前端与样式
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  scss: 'text/x-scss',
  sass: 'text/x-sass',
  less: 'text/x-less',
  js: 'text/javascript',
  mjs: 'text/javascript',
  cjs: 'text/javascript',
  ts: 'text/plain',
  mts: 'text/plain',
  cts: 'text/plain',
  jsx: 'text/javascript',
  tsx: 'text/plain',
  vue: 'text/plain',

  // 后端与其他编程语言
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

  // 纯文本
  txt: 'text/plain',
  text: 'text/plain',
  log: 'text/plain',
  bin: 'application/octet-stream'
}

/**
 * 常见代码语言标识符与格式映射
 */
export const LANGUAGE_TO_FORMAT: Record<string, { ext: string; mime: string }> = {
  json: { ext: 'json', mime: 'application/json' },
  jsonc: { ext: 'jsonc', mime: 'application/json' },
  json5: { ext: 'json5', mime: 'application/json' },
  jsonl: { ext: 'jsonl', mime: 'application/x-ndjson' },

  yaml: { ext: 'yaml', mime: 'text/yaml' },
  yml: { ext: 'yaml', mime: 'text/yaml' },
  xml: { ext: 'xml', mime: 'application/xml' },

  html: { ext: 'html', mime: 'text/html' },
  htm: { ext: 'html', mime: 'text/html' },
  svg: { ext: 'svg', mime: 'image/svg+xml' },
  css: { ext: 'css', mime: 'text/css' },
  scss: { ext: 'scss', mime: 'text/x-scss' },
  sass: { ext: 'sass', mime: 'text/x-sass' },
  less: { ext: 'less', mime: 'text/x-less' },

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

  csv: { ext: 'csv', mime: 'text/csv' },
  tsv: { ext: 'tsv', mime: 'text/tab-separated-values' },
  toml: { ext: 'toml', mime: 'text/plain' },
  ini: { ext: 'ini', mime: 'text/plain' },
  markdown: { ext: 'md', mime: 'text/markdown' },
  md: { ext: 'md', mime: 'text/markdown' },
  sql: { ext: 'sql', mime: 'application/sql' },
  graphql: { ext: 'graphql', mime: 'application/graphql' },
  gql: { ext: 'graphql', mime: 'application/graphql' },

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
  plain: { ext: 'txt', mime: 'text/plain' },
  text: { ext: 'txt', mime: 'text/plain' },
  txt: { ext: 'txt', mime: 'text/plain' }
}

export function getMimeTypeByExtension(ext: string, fallback = 'application/octet-stream'): string {
  const cleanExt = ext.replace(/^\./, '').toLowerCase().trim()
  return EXT_TO_MIME_MAP[cleanExt] || fallback
}
