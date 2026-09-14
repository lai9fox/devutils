<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { tools, toolCategories, searchTools, type ToolMeta } from '../../data/tools'
import JsonFormatter from '../tools/JsonFormatter.vue'
import JsonViewer from '../tools/JsonViewer.vue'
import JsonValidator from '../tools/JsonValidator.vue'
import JsonPath from '../tools/JsonPath.vue'
import JsonConverter from '../tools/JsonConverter.vue'
import JsonToTypes from '../tools/JsonToTypes.vue'
import Base64Codec from '../tools/Base64Codec.vue'
import Base64Image from '../tools/Base64Image.vue'
import Base64File from '../tools/Base64File.vue'
import {
  AlignLeft,
  FolderTree,
  ShieldCheck,
  Filter,
  ArrowLeftRight,
  FileType,
  Binary,
  Image,
  FileDigit,
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
  return tools.find((t) => t.id === currentToolId.value) || tools[0]
})

const filteredTools = computed(() => {
  return searchTools(searchFilter.value)
})

const categoriesWithTools = computed(() => {
  return toolCategories
    .map((cat) => ({
      ...cat,
      tools: filteredTools.value.filter((t) => t.category === cat.id)
    }))
    .filter((cat) => cat.tools.length > 0)
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
  const matched = tools.find((t) => t.id === path || t.path.replace(/^\/|\/$/g, '') === path)
  if (matched && matched.id !== currentToolId.value) {
    currentToolId.value = matched.id
    if (typeof document !== 'undefined') {
      document.title = `${matched.name} - DevUtils`
    }
  }
}

function handleCommandSelect(path: string) {
  const cleanPath = path.replace(/^\/|\/$/g, '')
  const matched = tools.find(
    (t) => t.id === cleanPath || t.path.replace(/^\/|\/$/g, '') === cleanPath
  )
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

const toolComponents: Record<string, any> = {
  'json-formatter': JsonFormatter,
  'json-viewer': JsonViewer,
  'json-validator': JsonValidator,
  'json-path': JsonPath,
  'json-converter': JsonConverter,
  'json-to-types': JsonToTypes,
  'base64-text': Base64Codec,
  'base64-image': Base64Image,
  'base64-file': Base64File
}

function getToolComponent(id: string) {
  return toolComponents[id] || JsonFormatter
}

function getIconComponent(icon: string) {
  switch (icon) {
    case 'AlignLeft':
      return AlignLeft
    case 'FolderTree':
      return FolderTree
    case 'ShieldCheck':
      return ShieldCheck
    case 'Filter':
      return Filter
    case 'ArrowLeftRight':
      return ArrowLeftRight
    case 'FileType':
      return FileType
    case 'Binary':
      return Binary
    case 'Image':
      return Image
    case 'FileDigit':
      return FileDigit
    default:
      return AlignLeft
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
  if (typeof document !== 'undefined') {
    document.title = `${tool.name} - DevUtils`
  }
  workspaceScrollRef.value?.scrollTo({ top: 0 })
  showBackToTop.value = false
  if (!isDesktop.value) {
    mobileDrawerOpen.value = false
  }
}

function handleToolClick(tool: ToolMeta, e?: MouseEvent) {
  if (e) {
    // 允许用户使用修饰键（Cmd/Ctrl/Shift）或鼠标中键在新标签页中打开
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      return
    }
    e.preventDefault()
  }
  selectTool(tool)
  handleToolLeave()
}
</script>

<template>
  <div class="flex h-full min-h-0 w-full flex-1 overflow-hidden">
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
      class="fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-white transition-all duration-200 ease-in-out will-change-[transform,width] select-none lg:static lg:z-auto lg:shadow-none dark:border-zinc-800 dark:bg-[#0c0c0f]"
      :class="[
        // 移动端/小屏：Off-canvas 抽屉滑入滑出，关闭时强制 shadow-none 与 invisible 杜绝阴影泄漏
        mobileDrawerOpen
          ? 'visible w-72 max-w-[85vw] translate-x-0 shadow-2xl'
          : 'pointer-events-none invisible w-72 max-w-[85vw] -translate-x-full shadow-none lg:visible',
        // 桌面端：常驻文档流并平滑切换展开/图标导轨
        'lg:pointer-events-auto lg:translate-x-0 lg:shadow-none',
        desktopExpanded ? 'lg:w-64' : 'lg:w-14'
      ]"
      style="transform: translateZ(0); -webkit-font-smoothing: antialiased"
    >
      <!-- 边栏顶部：高度与右侧工作区顶栏 h-14 严格对齐 -->
      <div
        class="relative flex h-14 shrink-0 items-center overflow-hidden border-b border-zinc-200 px-2.5 dark:border-zinc-800"
      >
        <!-- 搜索框容器：在移动端抽屉或桌面展开时展示 -->
        <div
          class="mr-10 flex-1 shrink-0 transition-[width,opacity] duration-200 lg:mr-0 lg:w-[194px] lg:flex-none"
          :class="isExpanded ? 'opacity-100' : 'pointer-events-none opacity-0'"
        >
          <UiInput v-model="searchFilter" placeholder="搜索工具..." class="w-full">
            <template #prefix>
              <Search class="h-3.5 w-3.5" />
            </template>
          </UiInput>
        </div>

        <!-- 展开/折叠切换按钮：始终定位于右侧 14px -->
        <button
          type="button"
          class="absolute top-1/2 right-3.5 z-10 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          :title="isDesktop ? (desktopExpanded ? '收起侧边栏' : '展开侧边栏') : '关闭侧边栏'"
          :aria-label="isDesktop ? (desktopExpanded ? '收起侧边栏' : '展开侧边栏') : '关闭侧边栏'"
          @click="toggleSidebar"
        >
          <component
            :is="isDesktop ? (desktopExpanded ? PanelLeftClose : PanelLeft) : PanelLeftClose"
            class="h-4 w-4 transition-transform hover:scale-110"
          />
        </button>
      </div>

      <!-- 单一工具列表：展开与收起复用同一套 DOM，收起时分类完全折叠不占位，所有图标等距排列 -->
      <div class="flex-1 overflow-y-auto px-2.5 py-2">
        <!-- 无搜索结果提示 -->
        <div
          v-if="categoriesWithTools.length === 0"
          class="px-2 py-8 text-center text-xs whitespace-nowrap text-zinc-400"
        >
          未找到匹配工具
        </div>

        <div
          v-for="(cat, catIndex) in categoriesWithTools"
          :key="cat.id"
          class="transition-[margin] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
          :class="
            isExpanded ? (catIndex > 0 ? 'mt-3.5' : 'mt-0') : catIndex > 0 ? 'mt-0.5' : 'mt-0'
          "
        >
          <!-- 分类标题容器：使用 CSS Grid 1fr -> 0fr 驱动纯物理高度坍塌，零延迟零顿挫 -->
          <div
            class="grid transition-[grid-template-rows,opacity,margin] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] select-none"
            :class="
              isExpanded
                ? 'mb-1 grid-rows-[1fr] opacity-100'
                : 'pointer-events-none mb-0 grid-rows-[0fr] opacity-0'
            "
          >
            <div class="min-h-0 overflow-hidden">
              <div
                class="flex h-6 items-center justify-between px-1 text-[10px] font-semibold tracking-wider whitespace-nowrap text-zinc-400 uppercase transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              >
                <span class="truncate">{{ cat.name }}</span>
                <span class="ml-1 shrink-0 font-mono text-[9px] text-zinc-400">{{
                  cat.tools.length
                }}</span>
              </div>
            </div>
          </div>

          <!-- 工具超链接导航项 (符合搜索引擎爬虫友好抓取的标准语义 a 标签) -->
          <div class="space-y-0.5">
            <a
              v-for="tool in cat.tools"
              :key="tool.id"
              :href="tool.path"
              class="group relative flex h-9 w-full cursor-pointer items-center rounded-lg border px-2.5 text-left font-medium whitespace-nowrap transition-all duration-150 select-none active:scale-[0.98]"
              :class="
                tool.id === currentToolId
                  ? 'border-emerald-200/50 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'border-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100'
              "
              :title="isExpanded ? tool.name : undefined"
              @mouseenter="(e) => isDesktop && !desktopExpanded && handleToolHover(tool, e)"
              @mouseleave="handleToolLeave"
              @click="handleToolClick(tool, $event)"
            >
              <!-- 图标：固定 16x16，轴心对齐，无位移 -->
              <component
                :is="getIconComponent(tool.icon)"
                class="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
                :class="
                  tool.id === currentToolId
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-400'
                "
              />

              <!-- 文字标签：展开时往右侧展开，收起时往左侧收缩淡出 -->
              <div
                class="min-w-0 flex-1 overflow-hidden transition-[opacity,max-width,transform,margin] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                :class="
                  isExpanded
                    ? 'ml-2.5 max-w-44 opacity-100'
                    : 'pointer-events-none ml-0 max-w-0 opacity-0'
                "
              >
                <span class="block truncate text-xs whitespace-nowrap" :title="tool.name">{{
                  tool.name
                }}</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧工具主体内容 -->
    <main
      class="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-50/50 dark:bg-zinc-950"
      style="transform: translateZ(0); -webkit-font-smoothing: antialiased"
    >
      <!-- 工具顶栏 Header：高度 h-14，与左侧边栏顶部严格水平对齐 -->
      <div
        class="z-10 flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/70 px-3.5 backdrop-blur-xs transition-[padding] duration-200 ease-out sm:px-5 dark:border-zinc-800 dark:bg-[#0c0c0f]/90"
      >
        <div class="mr-2 flex min-w-0 flex-1 items-center gap-2.5">
          <!-- 移动端侧边栏切换按钮 -->
          <UiButton
            variant="ghost"
            size="icon"
            class="-ml-1 flex shrink-0 text-zinc-600 transition-transform hover:text-zinc-900 active:scale-95 lg:hidden dark:text-zinc-400 dark:hover:text-zinc-100"
            :aria-label="mobileDrawerOpen ? '收起侧边栏' : '展开侧边栏'"
            :title="mobileDrawerOpen ? '收起侧边栏' : '展开侧边栏'"
            @click="mobileDrawerOpen = !mobileDrawerOpen"
          >
            <PanelLeftClose v-if="mobileDrawerOpen" class="h-4 w-4" />
            <PanelLeft v-else class="h-4 w-4" />
          </UiButton>

          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-400"
          >
            <component :is="getIconComponent(currentTool.icon)" class="h-4.5 w-4.5" />
          </span>

          <h1
            class="min-w-0 truncate text-sm font-bold tracking-tight text-zinc-900 transition-colors sm:text-sm md:text-base dark:text-zinc-100"
          >
            {{ currentTool.name }}
          </h1>
        </div>

        <!-- 右侧：全局 Header 迁移过来的功能区 (搜索组合键、网站图标返回首页、主题切换、GitHub) -->
        <HeaderActions variant="workspace" @select-tool="handleCommandSelect" />
      </div>

      <!-- 工具交互组件挂载区：滚动条只出现在此工作区内 -->
      <div
        ref="workspaceScrollRef"
        class="flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto scroll-smooth p-2.5 sm:p-3"
        @scroll="handleWorkspaceScroll"
      >
        <component
          :is="getToolComponent(currentTool.id)"
          :key="currentTool.id"
          class="animate-fade-in flex h-full min-h-full w-full min-w-0 flex-1 flex-col"
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
          class="group absolute right-5 bottom-5 z-20 flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200/90 bg-white/95 px-3 py-2 text-xs font-medium text-zinc-700 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-emerald-300 hover:text-emerald-600 hover:shadow-xl active:scale-95 dark:border-zinc-700/90 dark:bg-zinc-800/95 dark:text-zinc-200 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
          title="回到顶部"
          aria-label="回到顶部"
          @click="scrollToTop"
        >
          <ArrowUp
            class="h-4 w-4 text-zinc-500 transition-colors group-hover:text-emerald-600 dark:text-zinc-400 dark:group-hover:text-emerald-400"
          />
          <span class="hidden sm:inline">回到顶部</span>
        </button>
      </Transition>
    </main>

    <!-- 收起侧边栏时的悬停 Tooltip -->
    <Teleport to="body">
      <div
        v-if="isDesktop && !desktopExpanded && hoveredTool"
        class="pointer-events-none fixed z-50 transition-opacity duration-150"
        :style="{ left: '62px', top: `${hoveredTool.top}px`, transform: 'translateY(-50%)' }"
      >
        <div
          class="relative rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900"
        >
          {{ hoveredTool.name }}
          <div
            class="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-zinc-900 dark:border-r-zinc-100"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
