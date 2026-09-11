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

const mode = ref<CodecMode>('auto')
const urlSafe = ref(false)
const padding = ref(true)
const lineBreak = ref<Base64LineBreak>('none')
const hexUppercase = ref(false)

const sourceContent = ref('')
const targetContent = ref('')
const detectedType = ref<string>('')
const errorMessage = ref<string>('')
const wasUrlDecoded = ref(false)

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
            ? '已自动识别为 Base64URL 并解码'
            : '已自动识别为 Base64 并解码'
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
      detectedType.value = '自动作为 UTF-8 文本编码为 Base64'
    } else if (mode.value === 'encode') {
      targetContent.value = textToBase64(sourceContent.value, {
        urlSafe: urlSafe.value,
        padding: padding.value,
        lineBreak: lineBreak.value
      })
    } else if (mode.value === 'decode') {
      const decoded = base64ToText(input)
      if (decoded.success) {
        targetContent.value = decoded.text
        wasUrlDecoded.value = Boolean(decoded.wasUrlEncoded)
      } else {
        targetContent.value = ''
        errorMessage.value = decoded.error || '非法 Base64 格式'
      }
    } else if (mode.value === 'hex') {
      // 十六进制模式
      const isHexInput = /^[0-9a-fA-F\s]+$/.test(input) && !input.includes('=')
      if (isHexInput) {
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
          title="交换输入输出内容"
          :disabled="!sourceContent && !targetContent"
          @click="handleSwap"
        >
          <template #prefix>
            <ArrowLeftRight class="h-3.5 w-3.5 text-emerald-500" />
          </template>
          交换
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

      <div class="flex items-center gap-1.5">
        <!-- 示例数据 -->
        <UiButton variant="ghost" size="sm" @click="loadSample">
          <template #prefix>
            <Sparkles class="h-3.5 w-3.5 text-emerald-500" />
          </template>
          示例
        </UiButton>

        <!-- 清空 -->
        <UiButton variant="ghost" size="sm" :disabled="!sourceContent" @click="handleClear">
          <template #prefix>
            <Trash2 class="h-3.5 w-3.5 text-zinc-400" />
          </template>
          清空
        </UiButton>
      </div>
    </div>

    <!-- 诊断提示条 (错误/智能检测通知/URL转义提示) -->
    <div
      v-if="errorMessage"
      class="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
    >
      <AlertCircle class="h-4 w-4 shrink-0" />
      <span class="font-medium">{{ errorMessage }}</span>
    </div>

    <div
      v-else-if="detectedType || wasUrlDecoded"
      class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-1.5 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>{{ detectedType }}</span>
        <span
          v-if="wasUrlDecoded"
          class="rounded bg-emerald-100/80 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200"
        >
          已兼容还原 URL 转义字符 (%2B, %2F, %3D)
        </span>
      </div>

      <!-- 体积与膨胀比微型统计 -->
      <div v-if="expansionStats" class="flex items-center gap-2 font-mono text-[11px] opacity-85">
        <span>输入: {{ formatBytes(inputByteLength) }}</span>
        <ArrowRight class="h-3 w-3" />
        <span>输出: {{ formatBytes(outputByteLength) }}</span>
        <span
          class="rounded px-1 text-[10px]"
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

    <!-- 双栏工作台 -->
    <UiSplitPane>
      <template #left>
        <CodeEditor
          v-model="sourceContent"
          :title="
            mode === 'decode'
              ? '待解码 Base64'
              : mode === 'hex'
                ? '输入源 (Hex 或 Base64)'
                : '输入文本 (UTF-8)'
          "
          language="plain"
          filename="base64-input.txt"
          clearable
          placeholder="在此输入或粘贴需要处理的内容，支持中文、Emoji 与特殊字符..."
        />
      </template>

      <template #right>
        <CodeEditor
          :model-value="targetContent"
          :title="mode === 'decode' ? '解码文本' : mode === 'hex' ? '转换输出' : 'Base64 结果'"
          language="plain"
          filename="base64-output.txt"
          readonly
          :lint="false"
          placeholder="转换结果将在此实时呈现..."
        />
      </template>
    </UiSplitPane>
  </div>
</template>
