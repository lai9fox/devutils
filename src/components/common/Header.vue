<script setup lang="ts">
import { Terminal } from '@lucide/vue'
import HeaderActions from './HeaderActions.vue'

defineProps<{
  activeToolId?: string
  sidebarOpen?: boolean
}>()
</script>

<template>
  <header
    class="sticky top-0 z-40 h-14 w-full shrink-0 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80"
  >
    <div
      class="flex h-full items-center justify-between px-3.5 transition-[padding] duration-200 ease-out sm:px-5 md:px-6"
    >
      <!-- 品牌与网站图标 -->
      <div class="flex items-center gap-3">
        <a
          href="/"
          class="flex items-center gap-2.5 font-semibold text-zinc-900 transition-all duration-150 hover:opacity-90 active:scale-95 dark:text-zinc-100"
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs dark:bg-emerald-500"
            style="view-transition-name: devutils-site-logo"
          >
            <Terminal class="h-4 w-4" />
          </span>
          <span class="text-base font-bold tracking-tight">DevUtils</span>
        </a>
      </div>

      <!-- 右侧操作栏 (经典 Header 模式) -->
      <HeaderActions variant="header" />
    </div>
  </header>
</template>
