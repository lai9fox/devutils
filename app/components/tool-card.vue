<script setup lang="ts">
/**
 * 工具卡片组件
 * 用于展示工具信息，支持点击跳转
 */
import type { ToolMeta } from '~/types/tool'

withDefaults(defineProps<{
  tool: ToolMeta
  compact?: boolean
}>(), {
  compact: false
})
</script>

<template>
  <NuxtLink
    :to="tool.path"
    :class="[
      'group relative flex min-w-0 flex-col rounded-lg border border-default bg-elevated shadow-sm transition-colors duration-150 hover:border-primary-500/50 hover:bg-primary-500/5 dark:hover:bg-primary-400/10',
      compact ? 'gap-2 p-3' : 'gap-3 p-4'
    ]"
  >
    <div class="flex items-start justify-between">
      <div
        :class="[
          'flex shrink-0 items-center justify-center rounded-md bg-primary-500/15 text-primary-600 transition-colors group-hover:bg-primary-500/20 dark:text-primary-400',
          compact ? 'size-8' : 'size-10'
        ]"
      >
        <UIcon
          :name="tool.icon"
          :class="compact ? 'size-4' : 'size-5'"
        />
      </div>
    </div>

    <h3
      :class="[
        'truncate font-semibold text-default transition-colors group-hover:text-primary-500',
        compact ? 'text-sm' : 'text-base'
      ]"
    >
      {{ tool.name }}
    </h3>

    <p
      :class="[
        'text-muted line-clamp-2',
        compact ? 'text-xs leading-5' : 'text-sm leading-6'
      ]"
    >
      {{ tool.description }}
    </p>
  </NuxtLink>
</template>
