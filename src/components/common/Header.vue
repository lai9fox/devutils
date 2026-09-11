<script setup lang="ts">
import { Terminal } from '@lucide/vue'
import HeaderActions from './HeaderActions.vue'

defineProps<{
  activeToolId?: string
  sidebarOpen?: boolean
}>()
</script>

<template>
  <header class="sticky top-0 z-40 w-full h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0">
    <div class="flex h-full items-center justify-between px-3.5 sm:px-5 md:px-6 transition-[padding] duration-200 ease-out">
      <!-- 品牌与网站图标 -->
      <div class="flex items-center gap-3">
        <a href="/" class="flex items-center gap-2.5 font-semibold text-zinc-900 dark:text-zinc-100 hover:opacity-90 active:scale-95 transition-all duration-150">
          <span
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs"
            style="view-transition-name: devutils-site-logo;"
          >
            <Terminal class="w-4 h-4" />
          </span>
          <span class="text-base tracking-tight font-bold">DevUtils</span>
        </a>
      </div>

      <!-- 右侧操作栏 (经典 Header 模式) -->
      <HeaderActions variant="header" />
    </div>
  </header>
</template>
