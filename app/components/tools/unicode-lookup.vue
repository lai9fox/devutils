<script setup lang="ts">
/**
 * Unicode 查询工具
 * 输入字符查看 Unicode 码点、UTF-8/UTF-16 编码等信息
 */

type LookupMode = 'char' | 'codepoint'
const mode = ref<LookupMode>('char')
const input = ref('')
const codepointInput = ref('')

interface CharInfo {
  char: string
  codePoint: number
  hex: string
  decimal: number
  utf8Bytes: string
  utf16Units: string
  htmlEntity: string
  name: string
}

// 获取 UTF-8 字节序列
function getUtf8Bytes(char: string): number[] {
  return Array.from(new TextEncoder().encode(char))
}

// 获取 UTF-16 代码单元
function getUtf16Units(char: string): number[] {
  const units: number[] = []
  for (let i = 0; i < char.length; i++) {
    units.push(char.charCodeAt(i))
  }
  return units
}

// 获取 Unicode 字符名称（简化版）
function getCharCategory(codePoint: number): string {
  if (codePoint <= 0x1F || codePoint === 0x7F) return '控制字符'
  if (codePoint >= 0x20 && codePoint <= 0x2F) return '标点/符号'
  if (codePoint >= 0x30 && codePoint <= 0x39) return '数字'
  if (codePoint >= 0x41 && codePoint <= 0x5A) return '大写拉丁字母'
  if (codePoint >= 0x61 && codePoint <= 0x7A) return '小写拉丁字母'
  if (codePoint >= 0x3B && codePoint <= 0x40) return '标点/符号'
  if (codePoint >= 0x5B && codePoint <= 0x60) return '标点/符号'
  if (codePoint >= 0x7B && codePoint <= 0x7E) return '标点/符号'
  if (codePoint >= 0x80 && codePoint <= 0xFF) return 'Latin-1 补充'
  if (codePoint >= 0x2000 && codePoint <= 0x206F) return '通用标点'
  if (codePoint >= 0x3000 && codePoint <= 0x303F) return 'CJK 符号'
  if (codePoint >= 0x4E00 && codePoint <= 0x9FFF) return 'CJK 统一汉字'
  if (codePoint >= 0x3400 && codePoint <= 0x4DBF) return 'CJK 统一汉字扩展A'
  if (codePoint >= 0xAC00 && codePoint <= 0xD7AF) return '韩文音节'
  if (codePoint >= 0x3040 && codePoint <= 0x309F) return '平假名'
  if (codePoint >= 0x30A0 && codePoint <= 0x30FF) return '片假名'
  if (codePoint >= 0xFF00 && codePoint <= 0xFFEF) return '全角/半角字符'
  if (codePoint >= 0x1F600 && codePoint <= 0x1F64F) return 'Emoji 表情'
  if (codePoint >= 0x1F300 && codePoint <= 0x1F5FF) return 'Emoji 符号'
  if (codePoint >= 0x1F680 && codePoint <= 0x1F6FF) return 'Emoji 交通'
  if (codePoint >= 0x1F900 && codePoint <= 0x1F9FF) return 'Emoji 补充'
  if (codePoint >= 0x0400 && codePoint <= 0x04FF) return '西里尔字母'
  if (codePoint >= 0x0600 && codePoint <= 0x06FF) return '阿拉伯文'
  if (codePoint >= 0x0900 && codePoint <= 0x097F) return '天城文'
  if (codePoint >= 0x0E00 && codePoint <= 0x0E7F) return '泰文'
  return '其他'
}

// 字符 → 信息
function analyzeChar(char: string): CharInfo {
  const codePoint = char.codePointAt(0)!
  const utf8 = getUtf8Bytes(char)
  const utf16 = getUtf16Units(char)

  return {
    char,
    codePoint,
    hex: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
    decimal: codePoint,
    utf8Bytes: utf8.map(b => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`).join(' '),
    utf16Units: utf16.map(u => `0x${u.toString(16).toUpperCase().padStart(4, '0')}`).join(' '),
    htmlEntity: `&#${codePoint};`,
    name: getCharCategory(codePoint)
  }
}

// 按字符输入分析
const charResults = computed<CharInfo[]>(() => {
  if (mode.value !== 'char' || !input.value) return []
  // 使用 Array.from 正确处理 emoji 等多字节字符
  const chars = Array.from(input.value)
  return chars.map(ch => analyzeChar(ch))
})

// 按码点输入反查
const codepointResults = computed<CharInfo[]>(() => {
  if (mode.value !== 'codepoint' || !codepointInput.value.trim()) return []

  const results: CharInfo[] = []
  // 支持多种输入格式：U+XXXX, 0xXXXX, 十进制数字，逗号或空格分隔
  const parts = codepointInput.value.split(/[,\s]+/).filter(Boolean)

  for (const part of parts) {
    let cp: number
    const trimmed = part.trim()
    if (trimmed.startsWith('U+') || trimmed.startsWith('u+')) {
      cp = Number.parseInt(trimmed.slice(2), 16)
    } else if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
      cp = Number.parseInt(trimmed.slice(2), 16)
    } else if (/^\d+$/.test(trimmed)) {
      cp = Number.parseInt(trimmed)
    } else {
      continue
    }

    if (!Number.isNaN(cp) && cp >= 0 && cp <= 0x10FFFF) {
      try {
        const char = String.fromCodePoint(cp)
        results.push(analyzeChar(char))
      } catch {
        // 无效码点，跳过
      }
    }
  }

  return results
})

const displayResults = computed(() => mode.value === 'char' ? charResults.value : codepointResults.value)

function clear() {
  input.value = ''
  codepointInput.value = ''
}

function loadSample() {
  if (mode.value === 'char') {
    input.value = 'Hello 你好 🌍 ©'
  } else {
    codepointInput.value = 'U+0048 U+4F60 U+1F30D'
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="输入字符查看码点和编码信息，或输入码点反查字符（支持 U+XXXX / 0xXXXX / 十进制）。" />

    <!-- 模式切换 -->
    <div>
      <SegmentControl
        v-model="mode"
        :options="[
          { label: '字符 → 码点', value: 'char' as LookupMode },
          { label: '码点 → 字符', value: 'codepoint' as LookupMode }
        ]"
      />
    </div>

    <!-- 输入 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">
        {{ mode === 'char' ? '输入字符' : '输入码点' }}
      </label>
      <UInput
        v-if="mode === 'char'"
        v-model="input"
        placeholder="Hello 你好 🌍"
        class="font-mono"
      />
      <UInput
        v-else
        v-model="codepointInput"
        placeholder="U+0048 U+4F60 U+1F30D (空格或逗号分隔)"
        class="font-mono"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        icon="lucide:file-text"
        variant="ghost"
        color="secondary"
        @click="loadSample"
      >
        加载示例
      </UButton>
      <UButton
        variant="ghost"
        color="error"
        icon="lucide:trash-2"
        @click="clear"
      >
        清空
      </UButton>
    </div>

    <!-- 结果表格 -->
    <div
      v-if="displayResults.length > 0"
      class="flex flex-col gap-2"
    >
      <label class="text-sm font-medium text-muted">
        查询结果（共 {{ displayResults.length }} 个字符）
      </label>
      <div class="overflow-x-auto rounded-lg border border-default">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-elevated text-muted">
              <th class="px-3 py-2 text-left font-medium">
                字符
              </th>
              <th class="px-3 py-2 text-left font-medium">
                码点
              </th>
              <th class="px-3 py-2 text-left font-medium">
                十进制
              </th>
              <th class="px-3 py-2 text-left font-medium">
                UTF-8
              </th>
              <th class="px-3 py-2 text-left font-medium">
                UTF-16
              </th>
              <th class="px-3 py-2 text-left font-medium">
                HTML
              </th>
              <th class="px-3 py-2 text-left font-medium">
                类别
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(info, idx) in displayResults"
              :key="idx"
              class="border-t border-default hover:bg-elevated/50"
            >
              <td class="px-3 py-2 text-center text-2xl">
                {{ info.char }}
              </td>
              <td class="px-3 py-2 font-mono text-primary-600 dark:text-primary-400">
                {{ info.hex }}
              </td>
              <td class="px-3 py-2 font-mono text-default">
                {{ info.decimal }}
              </td>
              <td class="px-3 py-2 font-mono text-xs text-muted whitespace-nowrap">
                {{ info.utf8Bytes }}
              </td>
              <td class="px-3 py-2 font-mono text-xs text-muted whitespace-nowrap">
                {{ info.utf16Units }}
              </td>
              <td class="px-3 py-2 font-mono text-default">
                {{ info.htmlEntity }}
              </td>
              <td class="px-3 py-2 text-muted text-xs whitespace-nowrap">
                {{ info.name }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
