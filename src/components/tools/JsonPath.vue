<script setup lang="ts">
import { ref, computed } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import { JSONPath } from 'jsonpath-plus'
import {
  Filter,
  Trash2,
  Copy,
  Check,
  Search,
  CheckCircle2,
  AlertCircle
} from '@lucide/vue'

const jsonInput = ref(`{
  "store": {
    "books": [
      { "category": "fiction", "title": "The Great Gatsby", "price": 12.99, "inStock": true },
      { "category": "fiction", "title": "1984", "price": 9.99, "inStock": true },
      { "category": "technology", "title": "Designing Data-Intensive Apps", "price": 38.50, "inStock": false }
    ],
    "bicycle": {
      "color": "red",
      "price": 199.95
    }
  }
}`)

const pathExpression = ref('$.store.books[*].title')
const copied = ref(false)

interface PathResult {
  matches: unknown[]
  paths: string[]
  error: string | null
}

const evaluated = computed<PathResult>(() => {
  const rawJson = jsonInput.value.trim()
  const expr = pathExpression.value.trim()

  if (!rawJson || !expr) {
    return { matches: [], paths: [], error: null }
  }

  try {
    const parsed = JSON.parse(rawJson)
    const matches = JSONPath({ path: expr, json: parsed, resultType: 'value' })
    const paths = JSONPath({ path: expr, json: parsed, resultType: 'path' })

    return {
      matches: Array.isArray(matches) ? matches : [matches],
      paths: Array.isArray(paths) ? paths : [paths],
      error: null
    }
  } catch (err) {
    return {
      matches: [],
      paths: [],
      error: (err as Error).message
    }
  }
})

const outputFormatted = computed(() => {
  if (!evaluated.value.matches.length) return ''
  return JSON.stringify(
    evaluated.value.matches.length === 1 ? evaluated.value.matches[0] : evaluated.value.matches,
    null,
    2
  )
})

const presets = [
  { label: '所有书籍标题', path: '$.store.books[*].title' },
  { label: '价格低于 20 的书籍', path: '$.store.books[?(@.price < 20)]' },
  { label: '递归查找所有 price', path: '$..price' },
  { label: '前两本书', path: '$.store.books[0:2]' },
  { label: '自行车信息', path: '$.store.bicycle' }
]

function applyPreset(p: string) {
  pathExpression.value = p
}

async function handleCopy() {
  if (!outputFormatted.value) return
  await navigator.clipboard.writeText(outputFormatted.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1800)
}

function handleClear() {
  jsonInput.value = ''
  pathExpression.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- JSONPath 表达式栏 -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
      <div class="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
        <Filter class="w-4 h-4 text-emerald-500" />
        <span>JSONPath 表达式:</span>
      </div>

      <div class="relative flex-1">
        <input
          v-model="pathExpression"
          type="text"
          placeholder="例如 $.store.books[*].title"
          class="w-full h-8 pl-3 pr-8 text-xs font-mono rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-xs transition-colors"
        >
        <Search class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
      </div>

      <!-- 预设速查菜单 -->
      <div class="flex items-center gap-1.5 overflow-x-auto">
        <span class="text-[11px] text-zinc-400 shrink-0">速选:</span>
        <button
          v-for="(item, idx) in presets"
          :key="idx"
          class="shrink-0 px-2 py-1 text-[11px] font-mono rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          @click="applyPreset(item.path)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="flex items-center gap-1.5 shrink-0 border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 pt-2 sm:pt-0 sm:pl-2">
        <button
          class="inline-flex items-center gap-1 px-2.5 h-8 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          :class="copied ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200'"
          @click="handleCopy"
        >
          <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-600" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span>{{ copied ? '已复制' : '复制' }}</span>
        </button>

        <button
          class="inline-flex items-center gap-1 px-2.5 h-8 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
          @click="handleClear"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>清空</span>
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="evaluated.error"
      class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
    >
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>表达式解析错误: {{ evaluated.error }}</span>
    </div>

    <!-- 匹配状态指示 -->
    <div
      v-else-if="pathExpression && jsonInput"
      class="flex items-center justify-between text-xs text-zinc-500 px-1"
    >
      <span>找到 <strong class="text-emerald-600 dark:text-emerald-400">{{ evaluated.matches.length }}</strong> 个匹配节点</span>
      <span>支持 RFC 9535 规范与 jsonpath-plus 扩展</span>
    </div>

    <!-- 双栏工作台 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">数据源 JSON</span>
        <CodeEditor
          v-model="jsonInput"
          language="json"
          :rows="16"
          placeholder="粘贴数据源 JSON..."
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">提取结果 (Matches)</span>
        <CodeEditor
          :model-value="outputFormatted"
          language="json"
          :rows="16"
          readonly
          placeholder="匹配出的数据将在此格式化输出..."
        />
      </div>
    </div>

    <!-- 匹配路径列表 -->
    <div
      v-if="evaluated.paths.length > 0"
      class="flex flex-col gap-1.5"
    >
      <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">匹配节点绝对路径清单</span>
      <div class="flex flex-wrap gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono">
        <span
          v-for="(path, idx) in evaluated.paths"
          :key="idx"
          class="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-800"
        >
          {{ path }}
        </span>
      </div>
    </div>
  </div>
</template>
