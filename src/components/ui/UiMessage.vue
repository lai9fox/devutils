<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from '@lucide/vue'
import type { MessageType } from './types'

const props = withDefaults(
  defineProps<{
    type?: MessageType
    content?: string
    closable?: boolean
  }>(),
  {
    type: 'info',
    content: '',
    closable: false
  }
)

const emit = defineEmits<{
  close: []
}>()

const iconComponent = computed(() => {
  switch (props.type) {
    case 'success':
      return CheckCircle2
    case 'error':
      return AlertCircle
    case 'warning':
      return AlertTriangle
    case 'info':
    default:
      return Info
  }
})

const iconColorClasses: Record<MessageType, string> = {
  success: 'text-emerald-500 dark:text-emerald-400',
  error: 'text-rose-500 dark:text-rose-400',
  warning: 'text-amber-500 dark:text-amber-400',
  info: 'text-sky-500 dark:text-sky-400'
}
</script>

<template>
  <div
    class="pointer-events-auto inline-flex max-w-[90vw] items-center gap-2.5 rounded-xl border border-zinc-200/90 bg-white/95 px-4 py-2.5 text-xs font-medium text-zinc-800 shadow-lg shadow-zinc-900/5 backdrop-blur-md transition-all select-none sm:max-w-md sm:text-sm dark:border-zinc-800/90 dark:bg-zinc-900/95 dark:text-zinc-200 dark:shadow-black/40"
    role="alert"
  >
    <component :is="iconComponent" :class="['h-4 w-4 shrink-0', iconColorClasses[type]]" />

    <div class="min-w-0 flex-1 leading-normal break-words">
      <slot>{{ content }}</slot>
    </div>

    <button
      v-if="closable"
      type="button"
      class="shrink-0 cursor-pointer rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
      aria-label="关闭提示"
      @click="emit('close')"
    >
      <X class="h-3.5 w-3.5" />
    </button>
  </div>
</template>
