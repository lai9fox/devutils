<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, Moon, Sun, Command, Terminal } from '@lucide/vue'
import { UiButton } from '../ui'
import CommandPalette from './CommandPalette.vue'
import { useTheme } from '../../composables/useTheme'
import { useCommandPalette } from '../../composables/useCommandPalette'
import { isMac } from '../../utils/platform'

const props = withDefaults(
  defineProps<{
    variant?: 'header' | 'workspace'
  }>(),
  {
    variant: 'header'
  }
)

const emit = defineEmits<{
  'select-tool': [path: string]
}>()

const isMacPlatform = ref(false)
const { isDark, toggleTheme } = useTheme()
const { open: openCommandPalette } = useCommandPalette()

onMounted(() => {
  isMacPlatform.value = isMac()
})

function handlePaletteSelect(path: string) {
  if (props.variant === 'workspace') {
    emit('select-tool', path)
  } else {
    window.location.href = path
  }
}
</script>

<template>
  <!-- 工作台模式：紧凑且将所有操作聚合在工具名称右侧 -->
  <div v-if="variant === 'workspace'" class="flex shrink-0 items-center gap-1.5 sm:gap-2">
    <!-- 搜索工具快捷键图标 (移动端展示放大镜图标，桌面端展示快捷键) -->
    <button
      type="button"
      class="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-100/70 px-2 font-mono text-xs font-medium text-zinc-600 shadow-none transition-all duration-200 ease-out hover:bg-zinc-200/70 hover:text-zinc-900 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      style="view-transition-name: devutils-search-trigger"
      :title="isMacPlatform ? '快速搜索工具 (⌘K)' : '快速搜索工具 (Ctrl+K)'"
      aria-label="快速搜索工具快捷键"
      @click="openCommandPalette"
    >
      <Search class="h-4 w-4 shrink-0 text-zinc-500 sm:hidden dark:text-zinc-400" />
      <span class="hidden shrink-0 items-center sm:inline-flex">
        <span class="shortcut-mac items-center gap-1">
          <Command class="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          <span class="text-[11px] font-semibold">K</span>
        </span>
        <span class="shortcut-win items-center">
          <span class="text-[11px] font-semibold">Ctrl K</span>
        </span>
      </span>
    </button>

    <!-- 网站图标 (返回首页，无色、与操作图标统一) -->
    <a
      href="/"
      class="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      title="返回 DevUtils 首页"
      aria-label="返回首页"
    >
      <Terminal class="h-4 w-4" />
    </a>

    <!-- 主题切换 -->
    <UiButton
      variant="ghost"
      size="icon"
      class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      style="view-transition-name: devutils-theme-toggle"
      :title="isDark ? '切换至明亮模式' : '切换至暗色模式'"
      aria-label="切换主题"
      @click="toggleTheme"
    >
      <Sun class="hidden h-4 w-4 text-amber-400 dark:block" />
      <Moon class="block h-4 w-4 text-zinc-600 dark:hidden dark:text-zinc-400" />
    </UiButton>

    <!-- GitHub 仓库 -->
    <UiButton
      as="a"
      variant="ghost"
      size="icon"
      class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      style="view-transition-name: devutils-github-link"
      href="https://github.com/lai9fox/devutils"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub Repository"
    >
      <svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    </UiButton>

    <!-- 快捷命令弹窗 -->
    <CommandPalette @select="handlePaletteSelect" />
  </div>

  <!-- 顶部 Header 模式：经典输入框与操作项布局 -->
  <div v-else class="flex shrink-0 items-center gap-1.5 sm:gap-2">
    <!-- 搜索触发快捷键 (输入框胶囊样式) -->
    <UiButton
      variant="outline"
      size="sm"
      class="inline-flex items-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      style="view-transition-name: devutils-search-trigger"
      :title="isMacPlatform ? '快速搜索工具 (⌘K)' : '快速搜索工具 (Ctrl+K)'"
      @click="openCommandPalette"
    >
      <Search class="h-3.5 w-3.5" />
      <span class="hidden sm:inline">搜索工具...</span>
      <kbd
        class="ml-1 hidden items-center rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 sm:ml-2 sm:inline-flex dark:bg-zinc-800 dark:text-zinc-400"
      >
        <span class="shortcut-mac items-center gap-0.5">
          <Command class="h-2.5 w-2.5" />
          <span>K</span>
        </span>
        <span class="shortcut-win items-center">
          <span>Ctrl K</span>
        </span>
      </kbd>
    </UiButton>

    <!-- 主题切换 -->
    <UiButton
      variant="ghost"
      size="icon"
      class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      style="view-transition-name: devutils-theme-toggle"
      :title="isDark ? '切换至明亮模式' : '切换至暗色模式'"
      aria-label="切换主题"
      @click="toggleTheme"
    >
      <Sun class="hidden h-4 w-4 text-amber-400 dark:block" />
      <Moon class="block h-4 w-4 text-zinc-600 dark:hidden dark:text-zinc-400" />
    </UiButton>

    <!-- GitHub 仓库 -->
    <UiButton
      as="a"
      variant="ghost"
      size="icon"
      class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      style="view-transition-name: devutils-github-link"
      href="https://github.com/lai9fox/devutils"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub Repository"
    >
      <svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    </UiButton>

    <!-- 快捷命令弹窗 -->
    <CommandPalette @select="handlePaletteSelect" />
  </div>
</template>
