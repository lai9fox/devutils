<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import {
  ArrowLeftRight,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trash2
} from '@lucide/vue'
import { UiButton, UiSegmented, UiCheckbox, UiSplitPane } from '../ui'
import {
  textToBase64,
  base64ToText,
  hexToBase64,
  base64ToHex,
  formatBytes,
  calculateExpansionRatio,
  type Base64LineBreak
} from '../../utils/base64'

type CodecMode = 'auto' | 'encode' | 'decode' | 'hex'

import { getToolDraft, setToolDraft } from '../../utils/toolDrafts'

const mode = ref<CodecMode>(getToolDraft('base64-text:mode', 'auto'))
const urlSafe = ref(getToolDraft('base64-text:urlSafe', false))
const padding = ref(getToolDraft('base64-text:padding', true))
const lineBreak = ref<Base64LineBreak>(getToolDraft('base64-text:lineBreak', 'none'))
const hexUppercase = ref(getToolDraft('base64-text:hexUppercase', false))

const sourceContent = ref(getToolDraft('base64-text:source', ''))
const targetContent = ref('')
const detectedType = ref<string>('')
const errorMessage = ref<string>('')
const wasUrlDecoded = ref(false)

watch(mode, (val) => setToolDraft('base64-text:mode', val))
watch(urlSafe, (val) => setToolDraft('base64-text:urlSafe', val))
watch(padding, (val) => setToolDraft('base64-text:padding', val))
watch(lineBreak, (val) => setToolDraft('base64-text:lineBreak', val))
watch(hexUppercase, (val) => setToolDraft('base64-text:hexUppercase', val))
watch(sourceContent, (val) => setToolDraft('base64-text:source', val))

let debounceTimer: ReturnType<typeof setTimeout> | null = null

// 统计
const inputByteLength = computed(() => {
  if (!sourceContent.value) return 0
  return new TextEncoder().encode(sourceContent.value).length
})

const outputByteLength = computed(() => {
  if (!targetContent.value) return 0
  return new TextEncoder().encode(targetContent.value).length
})

const expansionStats = computed(() => {
  if (!sourceContent.value || !targetContent.value || errorMessage.value) {
    return null
  }
  return calculateExpansionRatio(inputByteLength.value, outputByteLength.value)
})

// 判断输入是否疑似 Base64
function isProbableBase64(input: string): boolean {
  const clean = input.trim()
  if (clean.length < 2) return false

  // 包含空格或换行等，先清洗
  const stripped = clean.replace(/[\r\n\t\s]/g, '')
  if (stripped.length % 4 !== 0 && !stripped.includes('-') && !stripped.includes('_')) {
    // 若不是 4 的倍数且无 URL safe 字符，大概率不是标准 Base64，但可能是没带 padding 的 Base64
    if (stripped.length % 4 === 1) return false
  }

  // 包含常见 Base64 字符
  const base64Regex = /^[A-Za-z0-9+/_-]+={0,2}$/
  if (!base64Regex.test(stripped)) return false

  // 尝试试探性解码
  const res = base64ToText(clean)
  return res.success && res.text.length > 0
}

const isInputHex = computed(() => {
  const input = sourceContent.value.trim()
  return /^[0-9a-fA-F\s]+$/.test(input) && !input.includes('=') && input.length >= 2
})

// 动态推断左侧（输入）类型与视觉徽标
const currentInputInfo = computed(() => {
  const input = sourceContent.value.trim()
  if (!input) {
    if (mode.value === 'auto') {
      return {
        title: '输入内容',
        typeLabel: '自动检测',
        badgeClass:
          'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
      }
    }
    if (mode.value === 'encode') {
      return {
        title: '输入文本 (UTF-8)',
        typeLabel: 'UTF-8 文本',
        badgeClass:
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
      }
    }
    if (mode.value === 'decode') {
      return {
        title: '待解码 Base64',
        typeLabel: 'Base64 密文',
        badgeClass:
          'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
      }
    }
    return {
      title: '输入源 (Hex 或 Base64)',
      typeLabel: 'Hex / Base64',
      badgeClass:
        'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
    }
  }

  if (mode.value === 'auto') {
    if (isProbableBase64(input)) {
      const isUrlSafe = input.includes('-') || input.includes('_')
      return {
        title: '输入 Base64',
        typeLabel: isUrlSafe ? 'Base64URL' : 'Base64 密文',
        badgeClass:
          'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
      }
    }
    return {
      title: '输入文本',
      typeLabel: 'UTF-8 文本',
      badgeClass:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
    }
  }

  if (mode.value === 'encode') {
    return {
      title: '输入文本',
      typeLabel: 'UTF-8 文本',
      badgeClass:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
    }
  }

  if (mode.value === 'decode') {
    const isUrlSafe = input.includes('-') || input.includes('_')
    return {
      title: '待解码 Base64',
      typeLabel: isUrlSafe ? 'Base64URL' : 'Base64 密文',
      badgeClass:
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
    }
  }

  // hex 模式
  if (isInputHex.value) {
    return {
      title: '输入 Hex',
      typeLabel: 'Hex 十六进制',
      badgeClass:
        'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
    }
  }
  return {
    title: '输入 Base64',
    typeLabel: 'Base64 密文',
    badgeClass:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
  }
})

// 动态推断右侧（输出）类型与视觉徽标
const currentOutputInfo = computed(() => {
  const input = sourceContent.value.trim()
  if (!input) {
    return {
      title: '转换输出',
      typeLabel: '',
      badgeClass: ''
    }
  }

  if (mode.value === 'auto') {
    if (isProbableBase64(input)) {
      return {
        title: '解码结果',
        typeLabel: 'UTF-8 文本',
        badgeClass:
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
      }
    }
    return {
      title: 'Base64 结果',
      typeLabel: urlSafe.value ? 'Base64URL' : 'Base64 密文',
      badgeClass:
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
    }
  }

  if (mode.value === 'encode') {
    return {
      title: 'Base64 结果',
      typeLabel: urlSafe.value ? 'Base64URL' : 'Base64 密文',
      badgeClass:
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
    }
  }

  if (mode.value === 'decode') {
    return {
      title: '解码结果',
      typeLabel: 'UTF-8 文本',
      badgeClass:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
    }
  }

  // hex 模式
  if (isInputHex.value) {
    return {
      title: 'Base64 结果',
      typeLabel: urlSafe.value ? 'Base64URL' : 'Base64 密文',
      badgeClass:
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
    }
  }
  return {
    title: 'Hex 结果',
    typeLabel: 'Hex 十六进制',
    badgeClass:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
  }
})

function executeConversion() {
  const input = sourceContent.value.trim()
  errorMessage.value = ''
  detectedType.value = ''
  wasUrlDecoded.value = false

  if (!input) {
    targetContent.value = ''
    return
  }

  try {
    if (mode.value === 'auto') {
      // 智能自动检测
      if (isProbableBase64(input)) {
        const decoded = base64ToText(input)
        if (decoded.success) {
          targetContent.value = decoded.text
          detectedType.value = decoded.isUrlSafe
            ? '已识别 Base64URL ➔ 解码为文本'
            : '已识别 Base64 ➔ 解码为文本'
          wasUrlDecoded.value = Boolean(decoded.wasUrlEncoded)
          return
        }
      }
      // 默认按文本编码
      targetContent.value = textToBase64(sourceContent.value, {
        urlSafe: urlSafe.value,
        padding: padding.value,
        lineBreak: lineBreak.value
      })
      detectedType.value = urlSafe.value ? '文本 ➔ 编码为 Base64URL' : '文本 ➔ 编码为 Base64'
    } else if (mode.value === 'encode') {
      targetContent.value = textToBase64(sourceContent.value, {
        urlSafe: urlSafe.value,
        padding: padding.value,
        lineBreak: lineBreak.value
      })
      detectedType.value = urlSafe.value ? '文本 ➔ Base64URL' : '文本 ➔ Base64'
    } else if (mode.value === 'decode') {
      const decoded = base64ToText(input)
      if (decoded.success) {
        targetContent.value = decoded.text
        wasUrlDecoded.value = Boolean(decoded.wasUrlEncoded)
        detectedType.value = decoded.isUrlSafe ? 'Base64URL ➔ 解码文本' : 'Base64 ➔ 解码文本'
      } else {
        targetContent.value = ''
        errorMessage.value = decoded.error || '非法 Base64 格式'
      }
    } else if (mode.value === 'hex') {
      // 十六进制模式
      const isHex = isInputHex.value
      if (isHex) {
        // Hex -> Base64
        targetContent.value = hexToBase64(input, {
          urlSafe: urlSafe.value,
          padding: padding.value,
          lineBreak: lineBreak.value
        })
        detectedType.value = 'Hex → Base64'
      } else {
        // Base64 -> Hex
        targetContent.value = base64ToHex(input, hexUppercase.value)
        detectedType.value = 'Base64 → Hex'
      }
    }
  } catch (err: unknown) {
    targetContent.value = ''
    errorMessage.value = (err as Error)?.message || '转换错误'
  }
}

function runConversion(immediate = false) {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  if (immediate) {
    executeConversion()
  } else {
    debounceTimer = setTimeout(() => {
      executeConversion()
    }, 100)
  }
}

function handleSwap() {
  if (!targetContent.value && !sourceContent.value) return
  const temp = targetContent.value
  sourceContent.value = temp
  if (mode.value === 'encode') {
    mode.value = 'decode'
  } else if (mode.value === 'decode') {
    mode.value = 'encode'
  }
  runConversion(true)
}

function handleClear() {
  sourceContent.value = ''
  targetContent.value = ''
  errorMessage.value = ''
  detectedType.value = ''
}

function loadSample() {
  if (mode.value === 'decode') {
    sourceContent.value = '5L2g5aW977yM5LiW55WM77yB8J+agA=='
  } else if (mode.value === 'hex') {
    sourceContent.value = 'e4 bd a0 e5 a5 bd ef bc 8c e4 b8 96 e7 95 8c ef bc 81 f0 9f 9a 80'
  } else {
    sourceContent.value = '你好，世界！Hello DevUtils 🚀✨'
  }
  runConversion(true)
}

watch(sourceContent, () => {
  runConversion(false)
})

watch([mode, urlSafe, padding, lineBreak, hexUppercase], () => {
  runConversion(true)
})

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
})
</script>

<template>
  <div class="flex h-full min-h-0 min-h-full w-full flex-1 flex-col gap-2.5">
    <!-- 操作工具条 -->
    <div
      class="flex shrink-0 flex-wrap items-center justify-between gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-xs dark:border-zinc-800 dark:bg-[#121215]"
    >
      <div class="flex flex-wrap items-center gap-2">
        <!-- 转换模式 -->
        <UiSegmented
          v-model="mode"
          :options="[
            { label: '智能检测', value: 'auto' },
            { label: '文本 → Base64', value: 'encode' },
            { label: 'Base64 → 文本', value: 'decode' },
            { label: 'Hex 互转', value: 'hex' }
          ]"
        />

        <!-- 交换方向 -->
        <UiButton
          variant="secondary"
          class="shrink-0"
          title="交换两边内容"
          :disabled="!sourceContent && !targetContent"
          @click="handleSwap"
        >
          <template #prefix>
            <ArrowLeftRight class="h-3.5 w-3.5 text-emerald-500" />
          </template>
          交换
        </UiButton>

        <!-- 示例数据 -->
        <UiButton variant="secondary" title="载入示例数据" @click="loadSample">
          <template #prefix>
            <Sparkles class="h-3.5 w-3.5 text-emerald-500" />
          </template>
          示例
        </UiButton>

        <!-- 清空按钮 -->
        <UiButton
          variant="danger-hover"
          :disabled="!sourceContent && !targetContent"
          title="清空所有输入与输出"
          @click="handleClear"
        >
          <template #prefix>
            <Trash2
              class="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-rose-500 dark:group-hover:text-rose-400"
            />
          </template>
          清空
        </UiButton>

        <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

        <!-- Base64URL 安全字符控制 -->
        <UiCheckbox
          v-if="mode !== 'decode'"
          v-model="urlSafe"
          size="sm"
          title="将 + 替换为 -，将 / 替换为 _，适用于 URL 与 JWT 场景"
          class="box-border h-8 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-xs whitespace-nowrap text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/60 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          Base64URL (-_)
        </UiCheckbox>

        <!-- Padding 填充符控制 -->
        <UiCheckbox
          v-if="mode !== 'decode'"
          v-model="padding"
          size="sm"
          title="末尾保留 '=' 补齐填充符。如取消勾选将去除尾部所有的 '='"
          class="box-border h-8 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-xs whitespace-nowrap text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/60 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          保留填充符 (=)
        </UiCheckbox>

        <!-- 换行格式化控制 -->
        <div
          v-if="mode !== 'decode'"
          class="flex h-8 items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
        >
          <span class="shrink-0 select-none">分行:</span>
          <UiSegmented
            v-model="lineBreak"
            size="sm"
            :options="[
              { label: '单行', value: 'none' },
              { label: 'PEM (64)', value: 64 },
              { label: 'MIME (76)', value: 76 }
            ]"
          />
        </div>

        <!-- Hex 大写控制 -->
        <UiCheckbox
          v-if="mode === 'hex'"
          v-model="hexUppercase"
          size="sm"
          class="box-border h-8 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-xs whitespace-nowrap text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/60 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          大写 Hex
        </UiCheckbox>
      </div>

      <!-- 右侧：无错误时展示极简体积对比 -->
      <div
        v-if="expansionStats && !errorMessage"
        class="hidden items-center gap-2 font-mono text-[11px] text-zinc-400 sm:flex dark:text-zinc-500"
      >
        <span>{{ formatBytes(inputByteLength) }}</span>
        <ArrowRight class="h-3 w-3 text-zinc-300 dark:text-zinc-600" />
        <span>{{ formatBytes(outputByteLength) }}</span>
        <span
          class="rounded px-1.5 py-0.5 text-[10px] font-semibold"
          :class="
            expansionStats.ratio > 0
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
          "
        >
          {{ expansionStats.ratio > 0 ? `+${expansionStats.ratio}%` : `${expansionStats.ratio}%` }}
        </span>
      </div>
    </div>

    <!-- 双栏工作台：高度撑满，双侧清晰呈现当前类型标签，彻底避免混淆 -->
    <UiSplitPane>
      <!-- 左栏：输入源与自适应类型指示 -->
      <template #left>
        <CodeEditor
          v-model="sourceContent"
          :title="currentInputInfo.title"
          language="plain"
          filename="base64-input.txt"
          placeholder="在此输入或粘贴需要处理的内容，支持中文、Emoji 与特殊字符..."
        >
          <template #header-left>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                {{ currentInputInfo.title }}
              </span>
              <span
                class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                :class="currentInputInfo.badgeClass"
              >
                {{ currentInputInfo.typeLabel }}
              </span>
            </div>
          </template>
        </CodeEditor>
      </template>

      <!-- 右栏：转换输出与自适应类型指示 -->
      <template #right>
        <CodeEditor
          :model-value="targetContent"
          :title="currentOutputInfo.title"
          language="plain"
          filename="base64-output.txt"
          readonly
          :lint="false"
          :placeholder="errorMessage || '转换结果将在此实时呈现...'"
        >
          <template #header-left>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                {{ currentOutputInfo.title }}
              </span>

              <!-- 输出类型 Badge -->
              <span
                v-if="!errorMessage && currentOutputInfo.typeLabel"
                class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                :class="currentOutputInfo.badgeClass"
              >
                {{ currentOutputInfo.typeLabel }}
              </span>

              <!-- 错误告警 Badge -->
              <span
                v-if="errorMessage"
                class="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"
                :title="errorMessage"
              >
                <AlertCircle class="h-3 w-3 shrink-0" />
                <span class="max-w-44 truncate">{{ errorMessage }}</span>
              </span>

              <!-- 转换动作说明 Badge -->
              <span
                v-else-if="detectedType && sourceContent"
                class="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <CheckCircle2 class="h-3 w-3 shrink-0 text-emerald-500" />
                <span class="max-w-48 truncate">{{ detectedType }}</span>
              </span>
            </div>
          </template>
        </CodeEditor>
      </template>
    </UiSplitPane>
  </div>
</template>
