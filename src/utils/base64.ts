/**
 * Base64 核心工具函数库
 * 提供符合 RFC 4648 的标准 Base64 及 Base64URL 编解码、UTF-8/Unicode 支持、
 * 格式校验、MIME 识别与文件还原等高阶能力。
 */

import { getMimeTypeByExtension } from './mime'

export type Base64LineBreak = 'none' | 64 | 76

export interface EncodeOptions {
  urlSafe?: boolean
  padding?: boolean
  lineBreak?: Base64LineBreak
}

export interface DecodeOptions {
  urlSafe?: boolean
  handleUrlEncoding?: boolean
}

export interface DecodeResult {
  success: boolean
  text: string
  error?: string
  isUrlSafe?: boolean
  wasUrlEncoded?: boolean
  byteLength?: number
}

export interface Base64Inspection {
  isValid: boolean
  isBase64Url: boolean
  isDataUrl: boolean
  isHex: boolean
  hasPadding: boolean
  hasLineBreaks: boolean
  mimeType?: string
  pureBase64: string
  error?: string
}

/**
 * 格式化字节大小为可读文本 (如 12.4 KB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  if (isNaN(bytes) || bytes < 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const index = Math.min(i, sizes.length - 1)
  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(dm))} ${sizes[index]}`
}

/**
 * 将 Uint8Array 转换为 Base64 字符串（分块避免超大调用栈溢出）
 */
export function bytesToBase64(bytes: Uint8Array, options: EncodeOptions = {}): string {
  const { urlSafe = false, padding = true, lineBreak = 'none' } = options
  const CHUNK_SIZE = 0x8000 // 32768
  const chunks: string[] = []

  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE)
    chunks.push(String.fromCharCode.apply(null, chunk as unknown as number[]))
  }

  let b64 = btoa(chunks.join(''))

  if (urlSafe) {
    b64 = b64.replace(/\+/g, '-').replace(/\//g, '_')
  }

  if (!padding) {
    b64 = b64.replace(/=+$/, '')
  }

  if (lineBreak !== 'none') {
    const limit = typeof lineBreak === 'number' ? lineBreak : 64
    const regex = new RegExp(`.{1,${limit}}`, 'g')
    b64 = (b64.match(regex) || []).join('\n')
  }

  return b64
}

/**
 * 将 UTF-8 文本编码为 Base64
 */
export function textToBase64(text: string, options: EncodeOptions = {}): string {
  if (!text) return ''
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  return bytesToBase64(bytes, options)
}

/**
 * 将 Base64 字符串清洗并还原为 Uint8Array
 */
export function base64ToBytes(input: string): {
  bytes: Uint8Array
  wasUrlEncoded: boolean
  isUrlSafe: boolean
} {
  let clean = input.trim()
  let wasUrlEncoded = false
  let isUrlSafe = false

  // 1. 如果包含 Data URL 前缀（如 data:image/png;base64,...），提取真实数据
  const commaIndex = clean.indexOf(',')
  if (clean.startsWith('data:') && commaIndex !== -1) {
    clean = clean.slice(commaIndex + 1).trim()
  }

  // 2. 检查并兼容 URL 编码（如 %2B, %2F, %3D, %20 等）
  if (/%[0-9a-fA-F]{2}/.test(clean)) {
    try {
      clean = decodeURIComponent(clean)
      wasUrlEncoded = true
    } catch {
      // ignore
    }
  }

  // 3. 去除所有空字符、换行与空白
  clean = clean.replace(/[\r\n\t\s]/g, '')

  // 4. 检查是否为 Base64URL 字符（包含 - 或 _）
  if (clean.includes('-') || clean.includes('_')) {
    isUrlSafe = true
    clean = clean.replace(/-/g, '+').replace(/_/g, '/')
  }

  // 5. 补齐尾部丢失的 '=' 填充符
  while (clean.length % 4 !== 0) {
    clean += '='
  }

  // 6. 校验字符集合法性 (A-Z, a-z, 0-9, +, /, =)
  if (!/^[A-Za-z0-9+/=]+$/.test(clean)) {
    throw new Error('包含非法 Base64 字符')
  }

  const binStr = atob(clean)
  const len = binStr.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binStr.charCodeAt(i)
  }

  return { bytes, wasUrlEncoded, isUrlSafe }
}

/**
 * 将 Base64 解码为 UTF-8 文本
 */
export function base64ToText(input: string): DecodeResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { success: true, text: '', byteLength: 0 }
  }

  try {
    const { bytes, wasUrlEncoded, isUrlSafe } = base64ToBytes(trimmed)

    // 使用 fatal: true 确保严格检测非法 UTF-8 字节序列
    const decoder = new TextDecoder('utf-8', { fatal: true })
    const text = decoder.decode(bytes)

    return {
      success: true,
      text,
      isUrlSafe,
      wasUrlEncoded,
      byteLength: bytes.length
    }
  } catch (err: unknown) {
    const msg = (err as Error)?.message || '解码失败'
    return {
      success: false,
      text: '',
      error: msg.includes('URI malformed')
        ? 'URL 编码解析错误'
        : msg.includes('The encoded data was not valid') || msg.includes('fatal')
          ? '数据不是有效的 UTF-8 文本序列（可能为二进制图片/文件或加密数据）'
          : `Base64 解码失败: ${msg}`
    }
  }
}

/**
 * 十六进制 Hex 转 Base64
 */
export function hexToBase64(hex: string, options: EncodeOptions = {}): string {
  const cleanHex = hex.replace(/(^|[^a-fA-F0-9])0x/gi, '$1').replace(/[\s,:\-_]/g, '')
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Hex 字符串长度必须为偶数')
  }
  if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
    throw new Error('包含非法 Hex 字符')
  }

  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16)
  }

  return bytesToBase64(bytes, options)
}

/**
 * Base64 转十六进制 Hex
 */
export function base64ToHex(input: string, uppercase = false): string {
  const { bytes } = base64ToBytes(input)
  const hexParts: string[] = []
  for (let i = 0; i < bytes.length; i++) {
    const h = bytes[i].toString(16).padStart(2, '0')
    hexParts.push(uppercase ? h.toUpperCase() : h)
  }
  return hexParts.join(' ')
}

/**
 * 解析 Data URL (如 data:image/png;base64,xxxx)
 */
export function parseDataUrl(
  url: string
): { mimeType: string; isBase64: boolean; data: string } | null {
  const match = url.trim().match(/^data:([^;,]+)?(;charset=[^;,]+)?(;base64)?,(.*)$/i)
  if (!match) return null

  const mimeType = match[1] || 'text/plain'
  const isBase64 = Boolean(match[3])
  const data = match[4] || ''

  return { mimeType, isBase64, data }
}

/**
 * 构建标准 Data URL
 */
export function buildDataUrl(mimeType: string, base64Data: string): string {
  const cleanBase64 = base64Data.replace(/[\r\n\s]/g, '')
  return `data:${mimeType || 'application/octet-stream'};base64,${cleanBase64}`
}

/**
 * 诊断检测输入的字符串类型
 */
export function inspectBase64(input: string): Base64Inspection {
  const str = input.trim()
  if (!str) {
    return {
      isValid: false,
      isBase64Url: false,
      isDataUrl: false,
      isHex: false,
      hasPadding: false,
      hasLineBreaks: false,
      pureBase64: ''
    }
  }

  const isDataUrl = str.startsWith('data:')
  let pure = str

  let mimeType: string | undefined
  if (isDataUrl) {
    const parsed = parseDataUrl(str)
    if (parsed) {
      mimeType = parsed.mimeType
      pure = parsed.data
    }
  }

  const hasLineBreaks = /[\r\n]/.test(pure)
  const unspaced = pure.replace(/[\r\n\t\s]/g, '')
  const hasPadding = unspaced.endsWith('=')
  const isBase64Url = unspaced.includes('-') || unspaced.includes('_')

  // 检查是否纯 Hex (全是 16 进制字符且无 base64 特殊字符)
  const isHex =
    /^[0-9a-fA-F\s]+$/.test(str) && !str.includes('=') && str.replace(/\s/g, '').length % 2 === 0

  let isValid = false
  let error: string | undefined

  try {
    base64ToBytes(pure)
    isValid = true
  } catch (err: unknown) {
    error = (err as Error)?.message || '非法 Base64'
  }

  return {
    isValid,
    isBase64Url,
    isDataUrl,
    isHex,
    hasPadding,
    hasLineBreaks,
    mimeType,
    pureBase64: unspaced,
    error
  }
}

/**
 * 根据文件头特征字节 (Magic Number) 推断常见文件的真实 MIME 类型
 */
export function detectMimeFromBytes(
  bytes: Uint8Array,
  filename = ''
): { mime: string; ext: string } {
  const extFromFilename = filename.includes('.')
    ? filename.split('.').pop()?.toLowerCase() || ''
    : ''

  if (bytes.length >= 8) {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return { mime: 'image/png', ext: 'png' }
    }
  }

  if (bytes.length >= 3) {
    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { mime: 'image/jpeg', ext: 'jpg' }
    }
    // GIF: GIF87a or GIF89a (47 49 46)
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return { mime: 'image/gif', ext: 'gif' }
    }
  }

  if (bytes.length >= 12) {
    // WebP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { mime: 'image/webp', ext: 'webp' }
    }
  }

  if (bytes.length >= 4) {
    // PDF: %PDF (25 50 44 46)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return { mime: 'application/pdf', ext: 'pdf' }
    }
    // ZIP / DOCX / XLSX / APK: PK.. (50 4B 03 04)
    if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
      if (['docx', 'xlsx', 'pptx', 'jar', 'apk'].includes(extFromFilename)) {
        return { mime: 'application/zip', ext: extFromFilename }
      }
      return { mime: 'application/zip', ext: 'zip' }
    }
    // GZIP: 1F 8B
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      return { mime: 'application/gzip', ext: 'gz' }
    }
  }

  // 尝试检查是否是 SVG (前 256 字节包含 <svg 或 <?xml)
  const headerSlice = bytes.subarray(0, Math.min(bytes.length, 256))
  const headerText = String.fromCharCode
    .apply(null, headerSlice as unknown as number[])
    .toLowerCase()
  if (
    headerText.includes('<svg') ||
    (headerText.includes('<?xml') && headerText.includes('<svg'))
  ) {
    return { mime: 'image/svg+xml', ext: 'svg' }
  }

  // 按照文件名后缀兜底推断
  if (extFromFilename) {
    const mime = getMimeTypeByExtension(extFromFilename, '')
    if (mime) {
      return { mime, ext: extFromFilename }
    }
  }

  return { mime: 'application/octet-stream', ext: 'bin' }
}

/**
 * 根据原始大小计算 Base64 膨胀比
 */
export function calculateExpansionRatio(
  originalBytes: number,
  base64Length: number
): { ratio: number; diff: number } {
  if (originalBytes <= 0 || base64Length <= 0) {
    return { ratio: 0, diff: 0 }
  }
  const diff = base64Length - originalBytes
  const ratio = (diff / originalBytes) * 100
  return {
    ratio: Math.round(ratio * 10) / 10,
    diff
  }
}
