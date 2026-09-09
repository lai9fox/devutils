<script setup lang="ts">
import { ref, computed } from 'vue'
import CodeEditor, { type CodeLanguage } from '../editor/CodeEditor.vue'
import YAML from 'yaml'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import Papa from 'papaparse'
import {
  ArrowLeftRight,
  ArrowRight,
  FlaskConical,
  Copy,
  Check,
  Download,
  Trash2,
  AlertCircle
} from '@lucide/vue'

type Format = 'yaml' | 'xml' | 'csv'
type Direction = 'json-to-format' | 'format-to-json'

const selectedFormat = ref<Format>('yaml')
const direction = ref<Direction>('json-to-format')

const sourceContent = ref(`{
  "project": "DevUtils",
  "framework": "Astro",
  "language": "TypeScript",
  "open_source": true,
  "stars": 1280
}`)

const targetContent = ref('')
const errorMessage = ref<string | null>(null)
const copied = ref(false)

const sourceLanguage = computed<CodeLanguage>(() => {
  if (direction.value === 'json-to-format') return 'json'
  if (selectedFormat.value === 'yaml') return 'yaml'
  if (selectedFormat.value === 'xml') return 'xml'
  return 'plain'
})

const targetLanguage = computed<CodeLanguage>(() => {
  if (direction.value === 'format-to-json') return 'json'
  if (selectedFormat.value === 'yaml') return 'yaml'
  if (selectedFormat.value === 'xml') return 'xml'
  return 'plain'
})

function runConversion() {
  errorMessage.value = null
  const input = sourceContent.value.trim()
  if (!input) {
    targetContent.value = ''
    return
  }

  try {
    if (direction.value === 'json-to-format') {
      const parsed = JSON.parse(input)

      if (selectedFormat.value === 'yaml') {
        targetContent.value = YAML.stringify(parsed)
      } else if (selectedFormat.value === 'xml') {
        const builder = new XMLBuilder({
          ignoreAttributes: false,
          format: true,
          indentBy: '  '
        })
        const wrapped = typeof parsed === 'object' && !Array.isArray(parsed) ? { root: parsed } : { root: { item: parsed } }
        targetContent.value = builder.build(wrapped)
      } else if (selectedFormat.value === 'csv') {
        const dataArr = Array.isArray(parsed) ? parsed : [parsed]
        targetContent.value = Papa.unparse(dataArr)
      }
    } else {
      // format-to-json
      if (selectedFormat.value === 'yaml') {
        const parsed = YAML.parse(input)
        targetContent.value = JSON.stringify(parsed, null, 2)
      } else if (selectedFormat.value === 'xml') {
        const parser = new XMLParser({ ignoreAttributes: false })
        const parsed = parser.parse(input)
        targetContent.value = JSON.stringify(parsed, null, 2)
      } else if (selectedFormat.value === 'csv') {
        const parsed = Papa.parse(input, { header: true, skipEmptyLines: true })
        targetContent.value = JSON.stringify(parsed.data, null, 2)
      }
    }
  } catch (err) {
    errorMessage.value = `转换异常: ${(err as Error).message}`
  }
}

function handleSwapDirection() {
  direction.value = direction.value === 'json-to-format' ? 'format-to-json' : 'json-to-format'
  const temp = sourceContent.value
  sourceContent.value = targetContent.value
  runConversion()
}

function handleClear() {
  sourceContent.value = ''
  targetContent.value = ''
  errorMessage.value = null
}

function handleLoadSample() {
  if (selectedFormat.value === 'csv') {
    sourceContent.value = JSON.stringify([
      { id: 1, name: "Alice", role: "Developer" },
      { id: 2, name: "Bob", role: "Designer" },
      { id: 3, name: "Charlie", role: "Manager" }
    ], null, 2)
  } else {
    sourceContent.value = JSON.stringify({
      app: "DevUtils",
      modules: ["Format", "Diff", "Schema"],
      version: 2.0,
      config: {
        theme: "system",
        offline: true
      }
    }, null, 2)
  }
  direction.value = 'json-to-format'
  runConversion()
}

async function handleCopy() {
  if (!targetContent.value) return
  await navigator.clipboard.writeText(targetContent.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1800)
}

function handleDownload() {
  if (!targetContent.value) return
  const ext = direction.value === 'json-to-format' ? selectedFormat.value : 'json'
  const blob = new Blob([targetContent.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `devutils-converted.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

// 自动初次转换
runConversion()
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 工具栏 -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
      <div class="flex flex-wrap items-center gap-2">
        <!-- 格式选择 -->
        <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <button
            v-for="fmt in (['yaml', 'xml', 'csv'] as Format[])"
            :key="fmt"
            class="px-3 py-1 text-xs font-medium uppercase rounded-md transition-all cursor-pointer"
            :class="selectedFormat === fmt ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            @click="selectedFormat = fmt; runConversion()"
          >
            {{ fmt }}
          </button>
        </div>

        <!-- 转换方向切换 -->
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
          @click="handleSwapDirection"
        >
          <ArrowLeftRight class="w-3.5 h-3.5 text-emerald-500" />
          <span class="flex items-center gap-1.5">
            <span>{{ direction === 'json-to-format' ? 'JSON' : selectedFormat.toUpperCase() }}</span>
            <ArrowRight class="w-3 h-3 text-zinc-400" />
            <span>{{ direction === 'json-to-format' ? selectedFormat.toUpperCase() : 'JSON' }}</span>
          </span>
        </button>

        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
          @click="runConversion"
        >
          立即转换
        </button>
      </div>

      <div class="flex items-center gap-2">
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
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="errorMessage"
      class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
    >
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 双栏工作台 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
          输入源 ({{ direction === 'json-to-format' ? 'JSON' : selectedFormat.toUpperCase() }})
        </span>
        <CodeEditor
          v-model="sourceContent"
          :language="sourceLanguage"
          :rows="18"
          placeholder="在此粘贴待转换的内容..."
          @update:model-value="runConversion"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
          转换输出 ({{ direction === 'json-to-format' ? selectedFormat.toUpperCase() : 'JSON' }})
        </span>
        <CodeEditor
          :model-value="targetContent"
          :language="targetLanguage"
          :rows="18"
          readonly
          placeholder="转换结果将在此展示..."
        />
      </div>
    </div>
  </div>
</template>
