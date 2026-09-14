<script setup lang="ts">
import { ref, computed, useSlots } from 'vue'
import type { InputSize } from './types'

export type { InputSize }

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    type?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    mono?: boolean
    size?: InputSize
    inputClass?: string
  }>(),
  {
    modelValue: '',
    type: 'text',
    placeholder: '',
    disabled: false,
    readonly: false,
    mono: false,
    size: 'sm',
    inputClass: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [e: Event]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
  keydown: [e: KeyboardEvent]
}>()

const slots = useSlots()
const inputRef = ref<HTMLInputElement | null>(null)

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-8 text-xs rounded-lg',
  md: 'h-9 text-sm rounded-lg',
  lg: 'h-10 text-sm rounded-xl'
}

const computedInputClasses = computed(() => [
  'w-full border text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none shadow-xs transition-[border-color,background-color,box-shadow] duration-150',
  props.disabled
    ? 'bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/80 text-zinc-400 dark:text-zinc-500 cursor-not-allowed select-none shadow-none'
    : props.readonly
      ? 'bg-zinc-50/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-default'
      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 dark:focus:ring-emerald-400/25',
  sizeClasses[props.size],
  props.mono ? 'font-mono' : '',
  slots.prefix ? 'pl-8' : 'pl-2.5',
  slots.suffix ? 'pr-8' : 'pr-2.5',
  props.inputClass
])

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

defineExpose({
  inputRef,
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur()
})
</script>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<template>
  <div class="relative flex w-full items-center">
    <div
      v-if="$slots.prefix"
      class="pointer-events-none absolute left-2.5 z-10 flex items-center text-zinc-400"
    >
      <slot name="prefix" />
    </div>

    <input
      ref="inputRef"
      v-bind="$attrs"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :class="computedInputClasses"
      @input="handleInput"
      @change="emit('change', $event)"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
      @keydown="emit('keydown', $event)"
    />

    <div v-if="$slots.suffix" class="absolute right-2 z-10 flex items-center">
      <slot name="suffix" />
    </div>
  </div>
</template>
