<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { tools, toolCategories, type ToolMeta } from '../../data/tools'
import JsonFormatter from '../tools/JsonFormatter.vue'
import JsonViewer from '../tools/JsonViewer.vue'
import JsonValidator from '../tools/JsonValidator.vue'
import JsonPath from '../tools/JsonPath.vue'
import JsonConverter from '../tools/JsonConverter.vue'
import JsonToTypes from '../tools/JsonToTypes.vue'
import {
  AlignLeft,
  FolderTree,
  ShieldCheck,
  Filter,
  ArrowLeftRight,
  FileType,
  Search,
  PanelLeftClose,
  PanelLeft
} from '@lucide/vue'

const props = defineProps<{
  initialToolId: string
}>()

const currentToolId = ref(props.initialToolId)
const sidebarOpen = ref(true)
const searchFilter = ref('')

const currentTool = computed(() => {
  return tools.find(t => t.id === currentToolId.value) || tools[0]
})

const filteredTools = computed(() => {
  const q = searchFilter.value.trim().toLowerCase()
  if (!q) return tools
  return tools.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q)
  )
})

const categoriesWithTools = computed(() => {
  return toolCategories
    .map(cat => ({
      ...cat,
      tools: filteredTools.value.filter(t => t.category === cat.id)
    }))
    .filter(cat => cat.tools.length > 0)
})

const hoveredTool = ref<{ name: string; top: number } | null>(null)

function handleToolHover(tool: ToolMeta, e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  hoveredTool.value = {
    name: tool.name,
    top: rect.top + rect.height / 2
  }
}

function handleToolLeave() {
  hoveredTool.value = null
}

function handleToggleSidebarEvent() {
  sidebarOpen.value = !sidebarOpen.value
}

onMounted(() => {
  window.addEventListener('devutils:toggle-sidebar', handleToggleSidebarEvent)
})

onUnmounted(() => {
  window.removeEventListener('devutils:toggle-sidebar', handleToggleSidebarEvent)
})

function getToolComponent(id: string) {
  switch (id) {
    case 'json-formatter': return JsonFormatter
    case 'json-viewer': return JsonViewer
    case 'json-validator': return JsonValidator
    case 'json-path': return JsonPath
    case 'json-converter': return JsonConverter
    case 'json-to-types': return JsonToTypes
    default: return JsonFormatter
  }
}

function getIconComponent(icon: string) {
  switch (icon) {
    case 'AlignLeft': return AlignLeft
    case 'FolderTree': return FolderTree
    case 'ShieldCheck': return ShieldCheck
    case 'Filter': return Filter
    case 'ArrowLeftRight': return ArrowLeftRight
    case 'FileType': return FileType
    default: return AlignLeft
  }
}

function selectTool(tool: ToolMeta) {
  currentToolId.value = tool.id
  // 更新浏览器 URL，保持前进后退历史
  window.history.pushState({}, '', tool.path)
}
</script>

<template>
  <div class="flex flex-1 w-full overflow-hidden min-h-[calc(100vh-3.5rem)]">
    <!-- 移动端遮罩 -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-zinc-950/40 backdrop-blur-xs lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- 左侧工具列表边栏 (自由工作台导航) -->
    <aside
      class="border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col shrink-0 relative overflow-hidden transition-[width] duration-200 ease-in-out z-30 select-none will-change-[width]"
      :class="[
        sidebarOpen
          ? 'w-64 fixed lg:static inset-y-14 left-0 shadow-xl lg:shadow-none'
          : 'hidden lg:flex lg:w-14 lg:static'
      ]"
      style="transform: translateZ(0); -webkit-font-smoothing: antialiased;"
    >
      <!-- 边栏顶部：高度与右侧工作区顶栏 h-14 严格对齐 -->
      <div class="h-14 flex items-center px-2.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0 relative overflow-hidden">
        <!-- 搜索框容器：定宽 194px，收起时原地平滑淡出，不压缩宽度、不位移、不抖动 -->
        <div
          class="w-[194px] transition-opacity duration-150 shrink-0"
          :class="sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'"
        >
          <div class="relative w-full">
            <input
              v-model="searchFilter"
              type="text"
              placeholder="搜索工具..."
              class="w-full h-8 pl-8 pr-2.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-xs transition-colors"
            >
            <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>

        <!-- 展开/折叠切换按钮：始终定位于右侧 10px，随边栏右边界平滑滑移，收起态正好在 56px 内绝对居中 -->
        <button
          class="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer shrink-0 z-10"
          :title="sidebarOpen ? '收起侧边栏' : '展开侧边栏'"
          @click="sidebarOpen = !sidebarOpen"
        >
          <PanelLeftClose v-if="sidebarOpen" class="w-4 h-4" />
          <PanelLeft v-else class="w-4 h-4" />
        </button>
      </div>

      <!-- 单一工具列表：展开与收起复用同一套 DOM，收起时分类完全折叠不占位，所有图标等距排列 -->
      <div class="flex-1 overflow-y-auto px-2.5 py-2">
        <!-- 无搜索结果提示 -->
        <div
          v-if="categoriesWithTools.length === 0"
          class="py-8 px-2 text-center text-xs text-zinc-400 whitespace-nowrap"
        >
          未找到匹配工具
        </div>

        <div
          v-for="(cat, catIndex) in categoriesWithTools"
          :key="cat.id"
          class="transition-[margin] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
          :class="sidebarOpen ? (catIndex > 0 ? 'mt-3.5' : 'mt-0') : (catIndex > 0 ? 'mt-0.5' : 'mt-0')"
        >
          <!-- 分类标题容器：使用 CSS Grid 1fr -> 0fr 驱动纯物理高度坍塌，零延迟零顿挫 -->
          <div
            class="grid transition-[grid-template-rows,opacity,margin] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] select-none"
            :class="sidebarOpen
              ? 'grid-rows-[1fr] opacity-100 mb-1'
              : 'grid-rows-[0fr] opacity-0 mb-0 pointer-events-none'"
          >
            <div class="overflow-hidden min-h-0">
              <div
                class="h-6 flex items-center justify-between px-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase whitespace-nowrap transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              >
                <span class="truncate">{{ cat.name }}</span>
                <span class="text-[9px] text-zinc-400 font-mono shrink-0 ml-1">{{ cat.tools.length }}</span>
              </div>
            </div>
          </div>

          <!-- 工具按钮项 -->
          <div class="space-y-0.5">
            <button
              v-for="tool in cat.tools"
              :key="tool.id"
              class="w-full h-9 flex items-center px-2.5 rounded-lg text-left transition-colors cursor-pointer group whitespace-nowrap relative select-none"
              :class="tool.id === currentToolId
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'"
              :title="sidebarOpen ? tool.name : undefined"
              @mouseenter="(e) => !sidebarOpen && handleToolHover(tool, e)"
              @mouseleave="handleToolLeave"
              @click="selectTool(tool); handleToolLeave()"
            >
              <!-- 图标：固定 16x16，轴心对齐，无位移 -->
              <component
                :is="getIconComponent(tool.icon)"
                class="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
                :class="tool.id === currentToolId ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'"
              />

              <!-- 文字标签：展开时往右侧展开，收起时往左侧收缩淡出 -->
              <div
                class="flex-1 min-w-0 overflow-hidden transition-[opacity,max-width,transform,margin] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                :class="sidebarOpen
                  ? 'max-w-44 opacity-100 ml-2.5'
                  : 'max-w-0 opacity-0 pointer-events-none ml-0'"
              >
                <span class="text-xs truncate block whitespace-nowrap" :title="tool.name">{{ tool.name }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧工具主体内容 -->
    <main
      class="flex-1 flex flex-col min-w-0 bg-zinc-50/50 dark:bg-zinc-950 overflow-y-auto"
      style="transform: translateZ(0); -webkit-font-smoothing: antialiased;"
    >
      <!-- 工具顶栏 Header：高度 h-14，与左侧边栏顶部严格水平对齐 -->
      <div class="h-14 flex items-center px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xs shrink-0">
        <div class="flex items-center gap-3">
          <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <component :is="getIconComponent(currentTool.icon)" class="w-4.5 h-4.5" />
          </span>

          <h1 class="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {{ currentTool.name }}
          </h1>
        </div>
      </div>

      <!-- 工具交互组件挂载区 -->
      <div class="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        <component :is="getToolComponent(currentTool.id)" />
      </div>
    </main>

    <!-- 收起侧边栏时的悬停 Tooltip -->
    <Teleport to="body">
      <div
        v-if="!sidebarOpen && hoveredTool"
        class="fixed z-50 pointer-events-none transition-opacity duration-150"
        :style="{ left: '62px', top: `${hoveredTool.top}px`, transform: 'translateY(-50%)' }"
      >
        <div class="relative px-2.5 py-1 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium shadow-md whitespace-nowrap">
          {{ hoveredTool.name }}
          <div class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-900 dark:border-r-zinc-100" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
