<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Terminal,
  Search,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
  Command
} from '@lucide/vue'
import CommandPalette from './CommandPalette.vue'

defineProps<{
  activeToolId?: string
  sidebarOpen?: boolean
}>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const isDark = ref(false)
const searchModalOpen = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})

function toggleTheme() {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
    <div class="flex h-14 items-center justify-between px-4 sm:px-6">
      <!-- 品牌与侧边栏折叠按钮 -->
      <div class="flex items-center gap-3">
        <button
          v-if="activeToolId"
          class="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="切换侧边栏"
          @click="emit('toggle-sidebar'); typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('devutils:toggle-sidebar'))"
        >
          <PanelLeftClose v-if="sidebarOpen" class="w-4 h-4" />
          <PanelLeft v-else class="w-4 h-4" />
        </button>

        <a href="/" class="flex items-center gap-2.5 font-semibold text-zinc-900 dark:text-zinc-100 hover:opacity-90 transition-opacity">
          <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs">
            <Terminal class="w-4 h-4" />
          </span>
          <span class="text-base tracking-tight font-bold">DevUtils</span>
        </a>
      </div>

      <!-- 右侧操作 -->
      <div class="flex items-center gap-2">
        <!-- 搜索触发快捷键 -->
        <button
          class="hidden sm:flex items-center gap-2 px-3 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
          @click="searchModalOpen = true"
        >
          <Search class="w-3.5 h-3.5" />
          <span>搜索工具...</span>
          <kbd class="ml-2 font-mono text-[10px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            <Command class="w-2.5 h-2.5" />
            <span>K</span>
          </kbd>
        </button>

        <button
          class="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="搜索"
          @click="searchModalOpen = true"
        >
          <Search class="w-4 h-4" />
        </button>

        <!-- 主题切换 -->
        <button
          class="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          :title="isDark ? '切换至明亮模式' : '切换至暗色模式'"
          aria-label="切换主题"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4 text-zinc-600" />
        </button>

        <!-- GitHub 仓库 -->
        <a
          href="https://github.com/lai9fox/devutils"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="GitHub Repository"
        >
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>
    </div>

    <!-- 快捷命令弹窗 -->
    <CommandPalette
      :is-open="searchModalOpen"
      @close="searchModalOpen = false"
    />
  </header>
</template>
