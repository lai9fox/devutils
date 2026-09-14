/**
 * 智能 JSON 修复工具
 * 自动修复常见的松散或非标准 JSON 语法：
 * 1. 单引号转双引号
 * 2. 未加引号的键名补全引号
 * 3. 移除末尾多余逗号 (trailing commas)
 * 4. 剔除 JavaScript 单行与多行注释
 * 5. 特殊常量替换 (undefined, NaN -> null)
 */

import { jsonrepair } from 'jsonrepair'
import { formatJson, isValidJson } from './json-format'

export interface RepairJsonResult {
  repaired: string
  changed: boolean
  success: boolean
  error?: string
}

export function repairJson(text: string): RepairJsonResult {
  const original = text.trim()
  if (!original) return { repaired: '', changed: false, success: true }

  // 若原文已是合法 JSON，原样保留
  if (isValidJson(original)) {
    return {
      repaired: original,
      changed: false,
      success: true
    }
  }

  try {
    const repairedRaw = jsonrepair(original)
    if (isValidJson(repairedRaw)) {
      const formatted = formatJson(repairedRaw, { indent: 2 })
      return {
        repaired: formatted,
        changed: formatted !== original,
        success: true
      }
    }
    return {
      repaired: original,
      changed: false,
      success: false,
      error: '修复结果未通过严格 JSON 校验'
    }
  } catch (err) {
    return {
      repaired: original,
      changed: false,
      success: false,
      error: (err as Error).message
    }
  }
}

export interface JsonStats {
  characters: number
  lines: number
  byteSize: number
  keysCount: number
  maxDepth: number
}

export function computeJsonStats(jsonObj: unknown, rawText: string): JsonStats {
  const characters = rawText.length
  const lines = rawText ? rawText.split(/\r\n|\r|\n/).length : 0
  const byteSize = new TextEncoder().encode(rawText).length

  let keysCount = 0
  let maxDepth = 0

  function traverse(val: unknown, currentDepth: number) {
    if (currentDepth > maxDepth) maxDepth = currentDepth

    if (val !== null && typeof val === 'object') {
      if (Array.isArray(val)) {
        for (const item of val) {
          traverse(item, currentDepth + 1)
        }
      } else {
        const keys = Object.keys(val as Record<string, unknown>)
        keysCount += keys.length
        for (const k of keys) {
          traverse((val as Record<string, unknown>)[k], currentDepth + 1)
        }
      }
    }
  }

  traverse(jsonObj, 0)

  return {
    characters,
    lines,
    byteSize,
    keysCount,
    maxDepth
  }
}
