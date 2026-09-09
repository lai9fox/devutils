<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import JsonTreeNode from './JsonTreeNode.vue'
import {
  Search,
  Columns2,
  Square,
  Upload,
  FlaskConical,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  X
} from '@lucide/vue'

const sampleJson = JSON.stringify({
  application: "DevUtils",
  version: "2.0.0",
  environment: "production",
  systemStatus: {
    online: true,
    uptimeSeconds: 864000,
    cpuUsagePercent: 12.4,
    memory: {
      totalMb: 16384,
      usedMb: 4210,
      freeMb: 12174
    }
  },
  services: [
    {
      id: "srv-json-formatter",
      name: "JSON Formatter",
      status: "active",
      endpoints: ["/format", "/minify", "/repair"],
      tags: ["format", "clean"]
    },
    {
      id: "srv-json-validator",
      name: "JSON Validator",
      status: "active",
      endpoints: ["/validate", "/locate-error"],
      tags: ["linter", "rfc-8259"]
    },
    {
      id: "srv-json-viewer",
      name: "JSON Viewer",
      status: "active",
      endpoints: ["/tree", "/search", "/collapse"],
      tags: ["large-json", "inspector"]
    },
    {
      id: "srv-json-path",
      name: "JSON Path",
      status: "active",
      endpoints: ["/query", "/extract"],
      tags: ["rfc-9535"]
    },
    {
      id: "srv-json-converter",
      name: "JSON Converter",
      status: "active",
      endpoints: ["/yaml", "/xml", "/csv"],
      tags: ["convert"]
    },
    {
      id: "srv-json-to-types",
      name: "JSON to Type",
      status: "active",
      endpoints: ["/typescript", "/java", "/go"],
      tags: ["codegen"]
    }
  ],
  maintainers: [
    {
      name: "Evan",
      role: "Lead Maintainer",
      contacts: {
        email: "evan@example.com",
        github: "https://github.com/lai9fox"
      }
    }
  ]
}, null, 2)

const rawInput = ref(sampleJson)
const searchQuery = ref('')
const viewMode = ref<'split' | 'tree'>('split')
const currentPath = ref<string>('$')
const currentValue = ref<unknown>(null)
const copied = ref(false)
const copiedPath = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 跟踪展开的节点路径 Set
const expandedSet = ref<Set<string>>(new Set(['$']))

// 解析后的 JSON
const parseResult = computed(() => {
  const trimmed = rawInput.value.trim()
  if (!trimmed) {
    return { valid: false, data: null, error: '输入内容为空' }
  }
  try {
    const parsed = JSON.parse(trimmed)
    return { valid: true, data: parsed, error: null }
  } catch (err) {
    return { valid: false, data: null, error: (err as Error).message }
  }
})

// 递归收集所有包含关键词的路径
const searchMatches = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q || !parseResult.value.valid || parseResult.value.data === null) {
    return []
  }

  const matches: string[] = []

  function search(node: unknown, path: string) {
    if (node === null) {
      if ('null'.includes(q)) matches.push(path)
      return
    }

    if (typeof node !== 'object') {
      if (String(node).toLowerCase().includes(q)) {
        matches.push(path)
      }
      return
    }

    if (Array.isArray(node)) {
      node.forEach((item, idx) => {
        const itemPath = `${path}[${idx}]`
        search(item, itemPath)
      })
    } else {
      for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
        const keyPath = `${path}.${key}`
        if (key.toLowerCase().includes(q)) {
          matches.push(keyPath)
        }
        search(val, keyPath)
      }
    }
  }

  search(parseResult.value.data, '$')
  return matches
})

// 搜索匹配项与导航
const currentMatchIndex = ref(0)

// 当搜索关键字变化时，自动展开匹配节点的所有上级路径
watch(searchQuery, (newQ) => {
  currentMatchIndex.value = 0
  if (!newQ.trim() || searchMatches.value.length === 0) return

  const newExpanded = new Set(expandedSet.value)
  for (const matchPath of searchMatches.value) {
    // 将路径分割并把所有父级路径加入展开集合
    // 例如 $.systemStatus.memory.totalMb
    const segments = matchPath.split(/\.|(?=\[)/)
    let current = ''
    for (const seg of segments) {
      current = current ? (seg.startsWith('[') ? `${current}${seg}` : `${current}.${seg}`) : seg
      newExpanded.add(current)
    }
  }
  expandedSet.value = newExpanded
})

function nextMatch() {
  if (searchMatches.value.length === 0) return
  currentMatchIndex.value = (currentMatchIndex.value + 1) % searchMatches.value.length
  scrollToMatch(searchMatches.value[currentMatchIndex.value])
}

function prevMatch() {
  if (searchMatches.value.length === 0) return
  currentMatchIndex.value = (currentMatchIndex.value - 1 + searchMatches.value.length) % searchMatches.value.length
  scrollToMatch(searchMatches.value[currentMatchIndex.value])
}

function scrollToMatch(path: string) {
  currentPath.value = path
}

// 展开/折叠全部
function expandAll() {
  if (!parseResult.value.valid || parseResult.value.data === null) return
  const allPaths = new Set<string>()

  function collect(node: unknown, path: string) {
    if (node === null || typeof node !== 'object') return
    allPaths.add(path)
    if (Array.isArray(node)) {
      node.forEach((item, idx) => collect(item, `${path}[${idx}]`))
    } else {
      for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
        collect(val, `${path}.${key}`)
      }
    }
  }

  collect(parseResult.value.data, '$')
  expandedSet.value = allPaths
}

function collapseAll() {
  expandedSet.value = new Set()
}

function expandToLevel(level: number) {
  if (!parseResult.value.valid || parseResult.value.data === null) return
  const targetPaths = new Set<string>()

  function collect(node: unknown, path: string, currentDepth: number) {
    if (node === null || typeof node !== 'object') return
    if (currentDepth <= level) {
      targetPaths.add(path)
    }
    if (Array.isArray(node)) {
      node.forEach((item, idx) => collect(item, `${path}[${idx}]`, currentDepth + 1))
    } else {
      for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
        collect(val, `${path}.${key}`, currentDepth + 1)
      }
    }
  }

  collect(parseResult.value.data, '$', 1)
  expandedSet.value = targetPaths
}

// 节点交互
function handleToggleExpand(path: string) {
  const next = new Set(expandedSet.value)
  if (next.has(path)) {
    next.delete(path)
  } else {
    next.add(path)
  }
  expandedSet.value = next
}

function handleSelectPath(path: string, val: unknown) {
  currentPath.value = path
  currentValue.value = val
}

async function copyText(text: string) {
  if (!text) return
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1500)
}

async function handleCopyCurrentPath() {
  await copyText(currentPath.value)
  copiedPath.value = true
  setTimeout(() => {
    copiedPath.value = false
  }, 1500)
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    if (content) {
      rawInput.value = content
      expandToLevel(2)
    }
  }
  reader.readAsText(file)
}

function handleClear() {
  rawInput.value = ''
  searchQuery.value = ''
  expandedSet.value = new Set()
}

function handleLoadSample() {
  rawInput.value = sampleJson
  expandToLevel(2)
}

// 默认展开到第 2 层
expandToLevel(2)
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 顶部操作工具栏 -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
      <div class="flex flex-wrap items-center gap-2">
        <!-- 搜索输入框与导航 -->
        <div class="relative flex items-center">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索节点键名或数值..."
            class="w-56 sm:w-64 h-8 pl-8 pr-16 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-xs transition-colors"
          >
          <Search class="w-3.5 h-3.5 absolute left-2.5 text-zinc-400 pointer-events-none" />

          <!-- 搜索匹配计数与翻页 -->
          <div
            v-if="searchQuery.trim()"
            class="absolute right-1.5 flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded"
          >
            <span v-if="searchMatches.length > 0">
              {{ currentMatchIndex + 1 }}/{{ searchMatches.length }}
            </span>
            <span v-else>0</span>

            <button
              class="hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              title="上一个匹配"
              @click="prevMatch"
            >
              <ArrowUp class="w-2.5 h-2.5" />
            </button>
            <button
              class="hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              title="下一个匹配"
              @click="nextMatch"
            >
              <ArrowDown class="w-2.5 h-2.5" />
            </button>
            <button
              class="hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer ml-0.5"
              @click="searchQuery = ''"
            >
              <X class="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        <!-- 展开与折叠控制组 -->
        <div class="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs">
          <button
            class="px-2 py-0.5 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="全部展开"
            @click="expandAll"
          >
            展开全部
          </button>
          <button
            class="px-2 py-0.5 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="全部折叠"
            @click="collapseAll"
          >
            全部折叠
          </button>
          <span class="w-px h-3 bg-zinc-300 dark:bg-zinc-700" />
          <button
            class="px-1.5 py-0.5 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="展开至 1 层"
            @click="expandToLevel(1)"
          >
            L1
          </button>
          <button
            class="px-1.5 py-0.5 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="展开至 2 层"
            @click="expandToLevel(2)"
          >
            L2
          </button>
          <button
            class="px-1.5 py-0.5 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="展开至 3 层"
            @click="expandToLevel(3)"
          >
            L3
          </button>
        </div>

        <!-- 视图切换：双栏对照 vs 全宽树形 -->
        <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs">
          <button
            class="flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="viewMode === 'split' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            @click="viewMode = 'split'"
          >
            <Columns2 class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">双栏模式</span>
          </button>
          <button
            class="flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="viewMode === 'tree' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            @click="viewMode = 'tree'"
          >
            <Square class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">纯树形</span>
          </button>
        </div>
      </div>

      <!-- 右侧辅助工具 -->
      <div class="flex items-center gap-2">
        <!-- 导入本地大型 JSON 文件 -->
        <input
          ref="fileInputRef"
          type="file"
          accept=".json,application/json"
          class="hidden"
          @change="handleFileUpload"
        >
        <button
          class="inline-flex items-center gap-1 px-2.5 h-8 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="上传打开本地大型 JSON 文件"
          @click="fileInputRef?.click()"
        >
          <Upload class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">打开文件</span>
        </button>

        <button
          class="inline-flex items-center gap-1 px-2.5 h-8 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          @click="handleLoadSample"
        >
          <FlaskConical class="w-3.5 h-3.5 text-emerald-500" />
          <span class="hidden sm:inline">示例</span>
        </button>

        <button
          class="inline-flex items-center gap-1 px-2.5 h-8 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
          @click="handleClear"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 主展示工作区 -->
    <div
      class="grid gap-4"
      :class="viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'"
    >
      <!-- 左侧源 JSON 编辑器 (仅在 split 双栏模式显示) -->
      <div v-if="viewMode === 'split'" class="lg:col-span-5 flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
          <span>原始 JSON 文本</span>
          <span class="font-mono">{{ rawInput.length }} 字符</span>
        </div>
        <CodeEditor
          v-model="rawInput"
          language="json"
          :rows="22"
          placeholder="在此粘贴任意标准或大型 JSON 代码..."
        />
      </div>

      <!-- 右侧交互树形视图 (或单栏全宽树形) -->
      <div
        class="flex flex-col gap-1.5"
        :class="viewMode === 'split' ? 'lg:col-span-7' : 'w-full'"
      >
        <div class="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
          <div class="flex items-center gap-2">
            <span>交互式结构树</span>
            <span v-if="searchMatches.length > 0" class="text-emerald-600 dark:text-emerald-400">
              (匹配到 {{ searchMatches.length }} 个节点)
            </span>
          </div>
          <span class="text-zinc-400 text-[11px]">点击节点可快速选中路径</span>
        </div>

        <!-- 树容器面板 -->
        <div class="relative w-full min-h-[500px] max-h-[700px] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs">
          <!-- 语法错误提示 -->
          <div
            v-if="!parseResult.valid"
            class="flex flex-col items-center justify-center py-20 text-center"
          >
            <AlertCircle class="w-10 h-10 text-amber-500 mb-3" />
            <h4 class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              无法解析为有效 JSON 结构树
            </h4>
            <p class="text-xs text-zinc-400 mt-1.5 max-w-md font-mono">
              {{ parseResult.error }}
            </p>
          </div>

          <!-- 树结构根节点渲染 -->
          <div v-else class="min-w-fit">
            <JsonTreeNode
              :value="parseResult.data"
              path="$"
              :depth="0"
              :search-query="searchQuery"
              :expanded-set="expandedSet"
              @select-path="handleSelectPath"
              @toggle-expand="handleToggleExpand"
              @copy-text="copyText"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部路径面包屑与节点详情栏 -->
    <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs shadow-xs">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-zinc-400 font-semibold shrink-0">当前选中节点:</span>
        <code class="font-mono text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/50 truncate">
          {{ currentPath }}
        </code>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          :class="copiedPath ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200'"
          @click="handleCopyCurrentPath"
        >
          <Check v-if="copiedPath" class="w-3.5 h-3.5 text-emerald-600" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span>{{ copiedPath ? '已复制路径' : '复制 JSONPath' }}</span>
        </button>

        <button
          v-if="currentValue !== null"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg transition-colors cursor-pointer"
          @click="copyText(typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue))"
        >
          <Copy class="w-3.5 h-3.5" />
          <span>复制节点值</span>
        </button>
      </div>
    </div>
  </div>
</template>
