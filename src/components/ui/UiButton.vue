<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonVariant, ButtonSize } from './types'

export type { ButtonVariant, ButtonSize }

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    disabled?: boolean
    loading?: boolean
    as?: 'button' | 'a'
    href?: string
    type?: 'button' | 'submit' | 'reset'
    title?: string
  }>(),
  {
    variant: 'secondary',
    size: 'sm',
    disabled: false,
    loading: false,
    as: 'button',
    type: 'button',
  }
)

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs',
  secondary:
    'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 text-zinc-800 dark:text-zinc-200',
  ghost:
    'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700',
  danger:
    'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 active:bg-red-100 dark:active:bg-red-900/40',
  warning:
    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/50',
  'warning-solid':
    'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-xs',
  success:
    'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50',
  outline:
    'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700/60 shadow-xs',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2 text-[11px] font-medium rounded-md gap-1',
  sm: 'h-8 px-2.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'h-9 px-3.5 text-xs font-medium rounded-lg gap-2',
  lg: 'h-10 px-5 text-sm font-semibold rounded-xl gap-2',
  icon: 'w-8 h-8 p-0 rounded-lg justify-center shrink-0',
  'icon-sm': 'w-7 h-7 p-0 rounded-md justify-center shrink-0',
  'icon-lg': 'w-9 h-9 p-0 rounded-lg justify-center shrink-0',
}

const computedClasses = computed(() => [
  'inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer whitespace-nowrap shrink-0',
  props.size.startsWith('icon') ? 'active:scale-90' : 'active:scale-[0.98]',
  variantClasses[props.variant],
  sizeClasses[props.size],
  (props.disabled || props.loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
])
</script>

<template>
  <component
    :is="as"
    :href="as === 'a' ? href : undefined"
    :type="as === 'button' ? type : undefined"
    :disabled="as === 'button' ? (disabled || loading) : undefined"
    :title="title"
    :class="computedClasses"
  >
    <slot name="prefix" />
    <slot />
    <slot name="suffix" />
  </component>
</template>
