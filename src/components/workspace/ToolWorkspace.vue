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
  PanelLeft,
  ArrowUp
} from '@lucide/vue'
import { UiInput, UiButton } from '../ui'
import HeaderActions from '../common/HeaderActions.vue'

const props = defineProps<{
  initialToolId: string
}>()

const currentToolId = ref(props.initialToolId)
const isDesktop = ref(true)
const desktopExpanded = ref(true)
const mobileDrawerOpen = ref(false)
const searchFilter = ref('')

const isExpanded = computed(() => {
  return isDesktop.value ? desktopExpanded.value : true
})

function updateIsDesktop() {
  if (typeof window !== 'undefined') {
    const wasDesktop = isDesktop.value
    const isNowDesktop = window.innerWidth >= 1024
    isDesktop.value = isNowDesktop
    // 视口切换时强制关闭移动端抽屉，防止缩放时意外弹出蒙版
    if (!isNowDesktop && wasDesktop) {
      mobileDrawerOpen.value = false
    }
  }
}

function toggleSidebar() {
  if (isDesktop.value) {
    desktopExpanded.value = !desktopExpanded.value
    try {
      localStorage.setItem('devutils:sidebar-expanded', String(desktopExpanded.value))
    } catch {
      // ignore
    }
  } else {
    mobileDrawerOpen.value = !mobileDrawerOpen.value
  }
}

function closeMobileDrawer() {
  mobileDrawerOpen.value = false
}

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
  toggleSidebar()
}

function handlePopState() {
  const path = window.location.pathname.replace(/^\/|\/$/g, '')
  const matched = tools.find(t => t.id === path || t.path.replace(/^\/|\/$/g, '') === path)
  if (matched && matched.id !== currentToolId.value) {
    currentToolId.value = matched.id
  }
}

function handleCommandSelect(path: string) {
  const cleanPath = path.replace(/^\/|\/$/g, '')
  const matched = tools.find(t => t.id === cleanPath || t.path.replace(/^\/|\/$/g, '') === cleanPath)
  if (matched) {
    selectTool(matched)
  } else {
    window.location.href = path
  }
}

let mql: MediaQueryList | null = null
let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null

onMounted(() => {
  if (typeof window !== 'undefined') {
    isDesktop.value = window.innerWidth >= 1024
    try {
      const stored = localStorage.getItem('devutils:sidebar-expanded')
      if (stored !== null) {
        desktopExpanded.value = stored === 'true'
      }
    } catch {
      // ignore
    }
    window.addEventListener('resize', updateIsDesktop)

    mql = window.matchMedia('(min-width: 1024px)')
    mqlHandler = (e: MediaQueryListEvent) => {
      isDesktop.value = e.matches
      mobileDrawerOpen.value = false
    }
    mql.addEventListener('change', mqlHandler)
  }

  window.addEventListener('devutils:toggle-sidebar', handleToggleSidebarEvent)
  window.addEventListener('popstate', handlePopState)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateIsDesktop)
    if (mql && mqlHandler) {
      mql.removeEventListener('change', mqlHandler)
    }
  }
  window.removeEventListener('devutils:toggle-sidebar', handleToggleSidebarEvent)
  window.removeEventListener('popstate', handlePopState)
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

const workspaceScrollRef = ref<HTMLElement | null>(null)
const showBackToTop = ref(false)

function handleWorkspaceScroll() {
  if (!workspaceScrollRef.value) return
  showBackToTop.value = workspaceScrollRef.value.scrollTop > 180
}

function scrollToTop() {
  workspaceScrollRef.value?.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

function selectTool(tool: ToolMeta) {
  if (currentToolId.value === tool.id) {
    if (!isDesktop.value) {
      mobileDrawerOpen.value = false
    }
    return
  }
  currentToolId.value = tool.id
  // 更新浏览器 URL，保持前进后退历史
  window.history.pushState({}, '', tool.path)
  workspaceScrollRef.value?.scrollTo({ top: 0 })
  showBackToTop.value = false
  if (!isDesktop.value) {
    mobileDrawerOpen.value = false
  }
}
</script>

<template>
  <div class="flex flex-1 w-full overflow-hidden h-full min-h-0">
    <!-- 移动端抽屉遮罩 (仅在移动端抽屉激活时出现，平滑淡入淡出，桌面端绝对不渲染) -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="!isDesktop && mobileDrawerOpen"
        class="fixed inset-0 z-30 bg-zinc-950/50 backdrop-blur-xs lg:hidden"
        aria-hidden="true"
        @click="closeMobileDrawer"
      />
    </Transition>

    <!-- 左侧工具列表边栏 (自由工作台导航：桌面端常驻，移动端抽屉) -->
    <aside
      class="border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] flex flex-col shrink-0 select-none will-change-[transform,width] z-40 lg:z-auto fixed lg:static inset-y-0 left-0 lg:shadow-none transition-all duration-200 ease-in-out overflow-hidden"
      :class="[
        // 移动端/小屏：Off-canvas 抽屉滑入滑出，关闭时强制 shadow-none 与 invisible 杜绝阴影泄漏
        mobileDrawerOpen
          ? 'translate-x-0 w-72 max-w-[85vw] shadow-2xl visible'
          : '-translate-x-full pointer-events-none w-72 max-w-[85vw] shadow-none invisible lg:visible',
        // 桌面端：常驻文档流并平滑切换展开/图标导轨
        'lg:translate-x-0 lg:pointer-events-auto lg:shadow-none',
        desktopExpanded ? 'lg:w-64' : 'lg:w-14'
      ]"
      style="transform: translateZ(0); -webkit-font-smoothing: antialiased;"
    >
      <!-- 边栏顶部：高度与右侧工作区顶栏 h-14 严格对齐 -->
      <div class="h-14 flex items-center px-2.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0 relative overflow-hidden">
        <!-- 搜索框容器：在移动端抽屉或桌面展开时展示 -->
        <div
          class="flex-1 mr-10 lg:mr-0 lg:w-[194px] lg:flex-none transition-[width,opacity] duration-200 shrink-0"
          :class="isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'"
        >
          <UiInput
            v-model="searchFilter"
            placeholder="搜索工具..."
            class="w-full"
          >
            <template #prefix>
              <Search class="w-3.5 h-3.5" />
            </template>
          </UiInput>
        </div>

        <!-- 展开/折叠切换按钮：始终定位于右侧 14px -->
        <button
          type="button"
          class="w-7 h-7 flex items-center justify-center rounded-lg absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer z-10"
          :title="isDesktop ? (desktopExpanded ? '收起侧边栏' : '展开侧边栏') : '关闭侧边栏'"
          :aria-label="isDesktop ? (desktopExpanded ? '收起侧边栏' : '展开侧边栏') : '关闭侧边栏'"
          @click="toggleSidebar"
        >
          <component
            :is="isDesktop ? (desktopExpanded ? PanelLeftClose : PanelLeft) : PanelLeftClose"
            class="w-4 h-4 transition-transform hover:scale-110"
          />
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
          :class="isExpanded ? (catIndex > 0 ? 'mt-3.5' : 'mt-0') : (catIndex > 0 ? 'mt-0.5' : 'mt-0')"
        >
          <!-- 分类标题容器：使用 CSS Grid 1fr -> 0fr 驱动纯物理高度坍塌，零延迟零顿挫 -->
          <div
            class="grid transition-[grid-template-rows,opacity,margin] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] select-none"
            :class="isExpanded
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
              class="w-full h-9 flex items-center px-2.5 rounded-lg text-left transition-all duration-150 active:scale-[0.98] cursor-pointer group whitespace-nowrap relative select-none font-medium border"
              :class="tool.id === currentToolId
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100'"
              :title="isExpanded ? tool.name : undefined"
              @mouseenter="(e) => isDesktop && !desktopExpanded && handleToolHover(tool, e)"
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
                :class="isExpanded
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
      class="flex-1 flex flex-col min-w-0 bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden relative"
      style="transform: translateZ(0); -webkit-font-smoothing: antialiased;"
    >
      <!-- 工具顶栏 Header：高度 h-14，与左侧边栏顶部严格水平对齐 -->
      <div class="h-14 flex items-center justify-between px-3.5 sm:px-5 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-[#0c0c0f]/90 backdrop-blur-xs shrink-0 z-10 transition-[padding] duration-200 ease-out">
        <div class="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <!-- 移动端侧边栏切换按钮 -->
          <UiButton
            variant="ghost"
            size="icon"
            class="flex lg:hidden shrink-0 -ml-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-95 transition-transform"
            :aria-label="mobileDrawerOpen ? '收起侧边栏' : '展开侧边栏'"
            :title="mobileDrawerOpen ? '收起侧边栏' : '展开侧边栏'"
            @click="mobileDrawerOpen = !mobileDrawerOpen"
          >
            <PanelLeftClose v-if="mobileDrawerOpen" class="w-4 h-4" />
            <PanelLeft v-else class="w-4 h-4" />
          </UiButton>

          <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <component :is="getIconComponent(currentTool.icon)" class="w-4.5 h-4.5" />
          </span>

          <h1 class="text-sm sm:text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate min-w-0 transition-colors">
            {{ currentTool.name }}
          </h1>
        </div>

        <!-- 右侧：全局 Header 迁移过来的功能区 (搜索组合键、网站图标返回首页、主题切换、GitHub) -->
        <HeaderActions
          variant="workspace"
          @select-tool="handleCommandSelect"
        />
      </div>

      <!-- 工具交互组件挂载区：滚动条只出现在此工作区内 -->
      <div
        ref="workspaceScrollRef"
        class="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 w-full p-2.5 sm:p-3 scroll-smooth"
        @scroll="handleWorkspaceScroll"
      >
        <component
          :is="getToolComponent(currentTool.id)"
          :key="currentTool.id"
          class="h-full min-h-full flex-1 flex flex-col min-w-0 w-full animate-fade-in"
        />
      </div>

      <!-- 回到顶部悬浮按钮 -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-90"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-2 scale-90"
      >
        <button
          v-if="showBackToTop"
          type="button"
          class="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/95 dark:bg-zinc-800/95 text-zinc-700 dark:text-zinc-200 border border-zinc-200/90 dark:border-zinc-700/90 shadow-lg hover:shadow-xl hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 active:scale-95 cursor-pointer text-xs font-medium backdrop-blur-md group"
          title="回到顶部"
          aria-label="回到顶部"
          @click="scrollToTop"
        >
          <ArrowUp class="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          <span class="hidden sm:inline">回到顶部</span>
        </button>
      </Transition>
    </main>

    <!-- 收起侧边栏时的悬停 Tooltip -->
    <Teleport to="body">
      <div
        v-if="isDesktop && !desktopExpanded && hoveredTool"
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
