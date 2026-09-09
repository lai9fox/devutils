<script setup lang="ts">
import { ref, computed } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import { repairJson, computeJsonStats, type JsonStats } from '../../utils/json-repair'
import {
  AlignLeft,
  Minimize2,
  Wrench,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Download,
  Trash2,
  FlaskConical,
  Info,
  ArrowRightLeft
} from '@lucide/vue'

const input = ref(`{
  name: 'DevUtils',
  version: 2.0,
  features: [
    "JSON Formatter",
    "JSON Validator",
    "JSON Viewer",
    "JSON Path",
    "JSON Converter",
    "JSON to Type"
  ],
  active: true,
}`)

const output = ref('')
const indentSize = ref<number | 'tab'>(2)
const statusMessage = ref<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
const copied = ref(false)

const stats = computed<JsonStats | null>(() => {
  if (!output.value.trim()) return null
  try {
    const parsed = JSON.parse(output.value)
    return computeJsonStats(parsed, output.value)
  } catch {
    return null
  }
})

function getIndent(): string | number {
  return indentSize.value === 'tab' ? '\t' : Number(indentSize.value)
}

function handleFormat() {
  statusMessage.value = null
  if (!input.value.trim()) {
    output.value = ''
    return
  }

  try {
    const parsed = JSON.parse(input.value)
    output.value = JSON.stringify(parsed, null, getIndent())
    statusMessage.value = { type: 'success', text: '格式化成功' }
  } catch (err) {
    // 尝试先自动修复
    const { repaired, changed } = repairJson(input.value)
    try {
      const parsed = JSON.parse(repaired)
      output.value = JSON.stringify(parsed, null, getIndent())
      statusMessage.value = {
        type: 'info',
        text: changed ? '检测到非标准语法，已自动容错修复并格式化' : '格式化成功'
      }
    } catch {
      statusMessage.value = {
        type: 'error',
        text: `解析错误: ${(err as Error).message}`
      }
    }
  }
}

function handleMinify() {
  statusMessage.value = null
  if (!input.value.trim()) {
    output.value = ''
    return
  }

  try {
    const parsed = JSON.parse(input.value)
    output.value = JSON.stringify(parsed)
    statusMessage.value = { type: 'success', text: '压缩成功' }
  } catch {
    const { repaired } = repairJson(input.value)
    try {
      const parsed = JSON.parse(repaired)
      output.value = JSON.stringify(parsed)
      statusMessage.value = { type: 'info', text: '已自动修复语法并完成单行压缩' }
    } catch (e) {
      statusMessage.value = { type: 'error', text: `压缩失败: ${(e as Error).message}` }
    }
  }
}

function handleRepair() {
  if (!input.value.trim()) return
  const { repaired, changed } = repairJson(input.value)
  output.value = repaired
  if (changed) {
    statusMessage.value = { type: 'success', text: '成功修复引号、尾逗号与非标准字符！' }
  } else {
    statusMessage.value = { type: 'info', text: '当前输入无需修复或已是标准 JSON' }
  }
}

function handleValidate() {
  statusMessage.value = null
  if (!input.value.trim()) return

  try {
    JSON.parse(input.value)
    statusMessage.value = { type: 'success', text: '验证通过：符合标准 RFC 8259 JSON 规范' }
  } catch (err) {
    statusMessage.value = { type: 'error', text: `验证失败: ${(err as Error).message}` }
  }
}

function handleSwap() {
  const temp = input.value
  input.value = output.value
  output.value = temp
}

function handleClear() {
  input.value = ''
  output.value = ''
  statusMessage.value = null
}

function handleLoadSample() {
  input.value = JSON.stringify({
    appName: "DevUtils",
    module: "JSON Toolkit",
    version: "2.0.0",
    stats: {
      speedMs: 1.2,
      clientSide: true,
      safe: true
    },
    tools: ["Formatter", "Validator", "Viewer", "JSONPath", "Converter", "Types"],
    author: {
      team: "fox9dev",
      openSource: true
    }
  }, null, 2)
  handleFormat()
}

async function handleCopy() {
  const text = output.value || input.value
  if (!text) return
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1800)
}

function handleDownload() {
  const content = output.value || input.value
  if (!content) return
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'devutils-formatted.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 首次自动格式化
handleFormat()
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 操作工具条 -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
      <div class="flex flex-wrap items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
          @click="handleFormat"
        >
          <AlignLeft class="w-3.5 h-3.5" />
          格式化
        </button>

        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
          @click="handleMinify"
        >
          <Minimize2 class="w-3.5 h-3.5" />
          压缩单行
        </button>

        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/50 transition-colors cursor-pointer"
          title="自动补全未加引号的 key、去掉尾逗号、修复单引号"
          @click="handleRepair"
        >
          <Wrench class="w-3.5 h-3.5" />
          智能修复
        </button>

        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
          @click="handleValidate"
        >
          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          严格校验
        </button>

        <!-- 缩进选项 -->
        <div class="flex items-center gap-1 ml-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>缩进:</span>
          <select
            v-model="indentSize"
            class="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-8 px-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-xs transition-colors cursor-pointer"
            @change="handleFormat"
          >
            <option :value="2">2 空格</option>
            <option :value="4">4 空格</option>
            <option value="tab">Tab 字符</option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="交换输入与输出"
          @click="handleSwap"
        >
          <ArrowRightLeft class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">交换</span>
        </button>

        <button
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          @click="handleLoadSample"
        >
          <FlaskConical class="w-3.5 h-3.5 text-emerald-500" />
          <span class="hidden sm:inline">示例</span>
        </button>

        <button
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          @click="handleDownload"
        >
          <Download class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">下载</span>
        </button>

        <button
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          :class="copied ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200'"
          @click="handleCopy"
        >
          <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-600" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span>{{ copied ? '已复制' : '复制结果' }}</span>
        </button>

        <button
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
          @click="handleClear"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">清空</span>
        </button>
      </div>
    </div>

    <!-- 状态反馈提示 -->
    <div
      v-if="statusMessage"
      class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
      :class="{
        'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50': statusMessage.type === 'success',
        'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50': statusMessage.type === 'error',
        'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50': statusMessage.type === 'info',
      }"
    >
      <CheckCircle2 v-if="statusMessage.type === 'success'" class="w-4 h-4 shrink-0" />
      <XCircle v-else-if="statusMessage.type === 'error'" class="w-4 h-4 shrink-0" />
      <Info v-else class="w-4 h-4 shrink-0" />
      <span>{{ statusMessage.text }}</span>
    </div>

    <!-- 核心编辑器双栏 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
          <span>原始输入 (支持非严格 JSON)</span>
          <span>{{ input.length }} 字符</span>
        </div>
        <CodeEditor
          v-model="input"
          language="json"
          :rows="18"
          placeholder="在此粘贴或输入 JSON 代码..."
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
          <span>输出结果</span>
          <span>{{ output.length }} 字符</span>
        </div>
        <CodeEditor
          :model-value="output"
          language="json"
          :rows="18"
          readonly
          placeholder="格式化或修复后的结果将在此展示..."
        />
      </div>
    </div>

    <!-- 度量指标统计条 -->
    <div
      v-if="stats"
      class="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl text-xs"
    >
      <div class="flex flex-col">
        <span class="text-zinc-400">总行数</span>
        <span class="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">{{ stats.lines }} 行</span>
      </div>
      <div class="flex flex-col">
        <span class="text-zinc-400">字节大小</span>
        <span class="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">{{ (stats.byteSize / 1024).toFixed(2) }} KB</span>
      </div>
      <div class="flex flex-col">
        <span class="text-zinc-400">键数量 (Keys)</span>
        <span class="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">{{ stats.keysCount }} 个</span>
      </div>
      <div class="flex flex-col">
        <span class="text-zinc-400">最大嵌套层级</span>
        <span class="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">{{ stats.maxDepth }} 层</span>
      </div>
      <div class="flex flex-col col-span-2 sm:col-span-1">
        <span class="text-zinc-400">数据规范性</span>
        <span class="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">符合 RFC 8259</span>
      </div>
    </div>
  </div>
</template>
