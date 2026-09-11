<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import JsonTreeNode from './JsonTreeNode.vue'
import { Columns2, ListTree, AlertCircle, UnfoldVertical, FoldVertical, Layers } from '@lucide/vue'
import { UiSegmented, message } from '../ui'

const rawInput = ref('')
const viewMode = ref<'split' | 'tree'>('split')
const currentPath = ref<string>('$')
const currentValue = ref<unknown>(null)

// 跟踪展开的节点路径 Set
const expandedSet = ref<Set<string>>(new Set(['$']))
const activeLevel = ref<number | 'all' | 0 | null>(null)

// 拖拽宽度调整
const splitPercent = ref(50)
const isDragging = ref(false)
const splitPaneRef = ref<HTMLElement | null>(null)
const isDesktop = ref(true)

function updateIsDesktop() {
  if (typeof window !== 'undefined') {
    isDesktop.value = window.innerWidth >= 1024
  }
}

function startResize(e: MouseEvent) {
  e.preventDefault()
  isDragging.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!splitPaneRef.value) return
    const rect = splitPaneRef.value.getBoundingClientRect()
    const offsetX = moveEvent.clientX - rect.left
    const percent = (offsetX / rect.width) * 100
    splitPercent.value = Math.min(80, Math.max(20, Math.round(percent * 10) / 10))
  }

  const onMouseUp = () => {
    isDragging.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

onMounted(() => {
  updateIsDesktop()
  window.addEventListener('resize', updateIsDesktop)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsDesktop)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
})

// 解析后的 JSON
const parseResult = computed(() => {
  const trimmed = rawInput.value.trim()
  if (!trimmed) {
    return { valid: false, data: null, error: null, empty: true }
  }
  try {
    const parsed = JSON.parse(trimmed)
    return { valid: true, data: parsed, error: null, empty: false }
  } catch (err) {
    return { valid: false, data: null, error: (err as Error).message, empty: false }
  }
})

// 展开/折叠全部
function expandAll() {
  activeLevel.value = 'all'
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
  activeLevel.value = 0
  expandedSet.value = new Set()
}

function expandToLevel(level: number) {
  activeLevel.value = level
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
  activeLevel.value = null
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

async function copyText(text: string, type: 'path' | 'value' = 'path') {
  if (!text) return
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    message.success(type === 'value' ? '已复制节点值' : '已复制节点路径')
  } catch {
    message.error('复制失败')
  }
}
</script>

<template>
  <div class="flex h-full min-h-0 min-h-full w-full flex-1 flex-col gap-2.5">
    <!-- 顶部操作工具栏：宽屏下紧凑居左排列，移动端自适应换行且背景仅包裹文本 -->
    <div
      class="flex shrink-0 flex-col gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-xs sm:flex-row sm:items-center sm:gap-3 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <!-- 视图切换：双栏对照 vs 纯树形 -->
      <div class="flex shrink-0 items-center gap-2.5">
        <UiSegmented
          v-model="viewMode"
          :options="[
            { label: '双栏对照', value: 'split', icon: Columns2 },
            { label: '纯树形', value: 'tree', icon: ListTree }
          ]"
        />
        <span class="hidden h-4 w-px shrink-0 bg-zinc-200 sm:inline-block dark:bg-zinc-800" />
      </div>

      <!-- 选中节点信息 (宽屏下紧跟在视图切换右侧，小屏下换行；背景包裹文本不拉伸；点击调用 message 提示) -->
      <div class="flex max-w-full min-w-0 items-center gap-1.5">
        <span class="shrink-0 text-xs font-medium text-zinc-400 select-none">选中节点:</span>
        <code
          class="inline-block w-fit max-w-full cursor-pointer truncate rounded border border-emerald-200/50 bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-600 transition-colors select-all hover:bg-emerald-100/60 sm:max-w-[420px] md:max-w-[560px] dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
          :title="`${currentPath} (点击复制路径)`"
          @click="copyText(currentPath)"
        >
          {{ currentPath }}
        </code>
      </div>
    </div>

    <!-- 主展示工作区：小屏模式下上下两栏平分剩余高度 (flex-1) -->
    <div
      ref="splitPaneRef"
      class="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-2.5 lg:flex-row lg:gap-0"
      :class="{ 'select-none': isDragging }"
    >
      <!-- 左侧源 JSON 编辑器 (仅在 split 双栏模式显示，小屏平分高度) -->
      <div
        v-if="viewMode === 'split'"
        class="flex min-h-[160px] min-w-0 flex-1 flex-col lg:h-full lg:min-h-0 lg:flex-none"
        :style="isDesktop ? { width: `calc(${splitPercent}% - 5px)` } : {}"
        :class="{ 'pointer-events-none': isDragging }"
      >
        <CodeEditor
          v-model="rawInput"
          title="JSON 源码"
          language="json"
          filename="devutils-data.json"
          clearable
          placeholder="在此粘贴或输入 JSON 代码..."
        />
      </div>

      <!-- 分割拖拽条 (仅双栏模式且在桌面端显示) -->
      <div
        v-if="viewMode === 'split'"
        class="group relative z-10 hidden w-2.5 shrink-0 cursor-col-resize items-center justify-center transition-colors select-none hover:bg-emerald-500/10 active:bg-emerald-500/20 lg:flex"
        :class="{ 'bg-emerald-500/20': isDragging }"
        title="拖拽调整两栏宽度 (双击恢复 50%)"
        @mousedown="startResize"
        @dblclick="splitPercent = 50"
      >
        <div
          class="h-8 w-1 rounded-full bg-zinc-300 transition-all group-hover:bg-emerald-500 group-active:bg-emerald-500 dark:bg-zinc-700"
          :class="{ 'h-12 bg-emerald-500': isDragging }"
        />
      </div>

      <!-- 右侧交互树形视图 (或单栏全宽树形，小屏平分高度) -->
      <div
        class="flex h-full min-h-[160px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs lg:min-h-0 dark:border-zinc-800 dark:bg-[#121215]"
        :class="{ 'pointer-events-none': isDragging }"
      >
        <!-- 树形顶部工具栏 (全部换成图标，无冗余文字文案，高度与编辑器头部严格一致 h-[42px]) -->
        <div
          class="box-border flex h-[42px] shrink-0 items-center justify-between gap-2 border-b border-zinc-200/80 bg-zinc-50/80 px-2.5 backdrop-blur-xs select-none sm:px-3 dark:border-zinc-800/80 dark:bg-[#18181d]"
        >
          <!-- 左侧：标题 -->
          <div
            class="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200"
          >
            <ListTree class="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span class="truncate">交互式结构树</span>
          </div>

          <!-- 右侧：展开全部、全部折叠与展开层级快捷操作 (纯图标按钮组) -->
          <div class="flex items-center gap-1.5">
            <!-- 展开 / 折叠图标按钮组 -->
            <div
              class="inline-flex items-center rounded-lg border border-zinc-200/60 bg-zinc-200/60 p-0.5 dark:border-zinc-700/60 dark:bg-zinc-800/80"
            >
              <button
                type="button"
                class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors"
                :class="
                  activeLevel === 'all'
                    ? 'bg-white text-emerald-600 shadow-xs dark:bg-zinc-700 dark:text-emerald-400'
                    : 'text-zinc-600 hover:bg-white hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white'
                "
                title="全部展开"
                @click="expandAll"
              >
                <UnfoldVertical class="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors"
                :class="
                  activeLevel === 0
                    ? 'bg-white text-emerald-600 shadow-xs dark:bg-zinc-700 dark:text-emerald-400'
                    : 'text-zinc-600 hover:bg-white hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white'
                "
                title="全部折叠"
                @click="collapseAll"
              >
                <FoldVertical class="h-3.5 w-3.5" />
              </button>
            </div>

            <!-- 层级快捷展开控制 (纯图标与纯数字，无文字文案) -->
            <div
              class="inline-flex items-center rounded-lg border border-zinc-200/60 bg-zinc-200/60 p-0.5 dark:border-zinc-700/60 dark:bg-zinc-800/80"
            >
              <div
                class="flex items-center justify-center p-1 text-zinc-400 dark:text-zinc-500"
                title="展开至指定层级"
              >
                <Layers class="h-3.5 w-3.5" />
              </div>
              <button
                v-for="lvl in [1, 2, 3, 4]"
                :key="lvl"
                type="button"
                class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md font-mono text-xs font-semibold transition-colors"
                :class="
                  activeLevel === lvl
                    ? 'bg-white text-emerald-600 shadow-xs dark:bg-zinc-700 dark:text-emerald-400'
                    : 'text-zinc-600 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-white'
                "
                :title="`展开至第 ${lvl} 层`"
                @click="expandToLevel(lvl)"
              >
                {{ lvl }}
              </button>
            </div>
          </div>
        </div>

        <!-- 树容器面板：撑满高度并自适应滚动 -->
        <div class="relative min-h-0 w-full flex-1 overflow-auto p-3 sm:p-4">
          <!-- 空状态提示 -->
          <div
            v-if="parseResult.empty"
            class="flex h-full min-h-[160px] flex-col items-center justify-center py-12 text-center text-zinc-400"
          >
            <ListTree class="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p class="text-xs">暂无 JSON 数据，请在编辑器中输入或粘贴 JSON 代码</p>
          </div>

          <!-- 语法错误提示 -->
          <div
            v-else-if="!parseResult.valid"
            class="flex h-full min-h-[160px] flex-col items-center justify-center py-12 text-center"
          >
            <AlertCircle class="mb-2 h-8 w-8 text-amber-500" />
            <h4 class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              无法解析为有效 JSON 结构树
            </h4>
            <p class="mt-1 max-w-md font-mono text-xs text-zinc-400">
              {{ parseResult.error }}
            </p>
          </div>

          <!-- 树结构根节点渲染 -->
          <div v-else class="min-w-fit">
            <JsonTreeNode
              :value="parseResult.data"
              path="$"
              :depth="0"
              :expanded-set="expandedSet"
              @select-path="handleSelectPath"
              @toggle-expand="handleToggleExpand"
              @copy-text="copyText"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
