<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, Check } from '@lucide/vue'
import type { SelectOption, SelectSize } from './types'

export type { SelectOption, SelectSize }

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean
    options?: SelectOption[]
    placeholder?: string
    size?: SelectSize
    disabled?: boolean
    selectClass?: string
    menuClass?: string
    placement?: 'left' | 'right'
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    placeholder: '请选择',
    size: 'sm',
    disabled: false,
    selectClass: '',
    menuClass: '',
    placement: 'left'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any]
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const focusedIndex = ref(-1)

const currentOption = computed(() => {
  if (props.modelValue === undefined && props.options.length > 0) {
    return props.options[0]
  }
  return props.options.find((opt) => opt.value === props.modelValue)
})

const currentLabel = computed(() => {
  return currentOption.value?.label ?? props.placeholder
})

function isSelected(val: string | number | boolean) {
  if (props.modelValue === undefined && props.options.length > 0) {
    return val === props.options[0].value
  }
  return val === props.modelValue
}

function toggleOpen() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    focusedIndex.value = props.options.findIndex((opt) => isSelected(opt.value))
  }
}

function close() {
  isOpen.value = false
  focusedIndex.value = -1
}

function handleSelect(opt: SelectOption) {
  if (opt.disabled) return
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  close()
  triggerRef.value?.focus()
}

function handleKeyDown(e: KeyboardEvent) {
  if (props.disabled) return

  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault()
      if (isOpen.value) {
        if (focusedIndex.value >= 0 && focusedIndex.value < props.options.length) {
          const opt = props.options[focusedIndex.value]
          if (!opt.disabled) {
            handleSelect(opt)
          }
        } else {
          close()
        }
      } else {
        toggleOpen()
      }
      break

    case 'Escape':
      if (isOpen.value) {
        e.preventDefault()
        close()
      }
      break

    case 'ArrowDown':
      e.preventDefault()
      if (!isOpen.value) {
        toggleOpen()
      } else {
        if (focusedIndex.value < props.options.length - 1) {
          focusedIndex.value++
        } else {
          focusedIndex.value = 0
        }
      }
      break

    case 'ArrowUp':
      e.preventDefault()
      if (!isOpen.value) {
        toggleOpen()
      } else {
        if (focusedIndex.value > 0) {
          focusedIndex.value--
        } else {
          focusedIndex.value = props.options.length - 1
        }
      }
      break

    case 'Tab':
      if (isOpen.value) {
        close()
      }
      break
  }
}

function handleDocumentClick(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentClick)
})
</script>

<template>
  <div ref="containerRef" class="relative inline-block text-left select-none">
    <!-- 下拉触发按钮 -->
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :class="[
        'inline-flex items-center justify-between gap-2 border text-left text-zinc-900 shadow-xs transition-colors select-none dark:text-zinc-100',
        disabled
          ? 'pointer-events-none cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 shadow-none dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-500'
          : 'cursor-pointer bg-white dark:bg-zinc-900',
        !disabled &&
          (isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'),
        size === 'sm' ? 'h-8 rounded-lg px-2.5 text-xs' : 'h-9 rounded-lg px-3 text-sm',
        selectClass
      ]"
      @click="toggleOpen"
      @keydown="handleKeyDown"
    >
      <span class="truncate">{{ currentLabel }}</span>
      <ChevronDown
        class="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- 自定义浮动菜单面板 -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        role="listbox"
        :class="[
          'absolute top-full z-50 mt-1.5 max-h-64 w-max min-w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 text-xs shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900',
          placement === 'right' ? 'right-0' : 'left-0',
          menuClass
        ]"
      >
        <button
          v-for="(opt, idx) in options"
          :key="String(opt.value)"
          type="button"
          role="option"
          :aria-selected="isSelected(opt.value)"
          :disabled="opt.disabled"
          :class="[
            'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors outline-none select-none focus:outline-none',
            isSelected(opt.value)
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              : focusedIndex === idx
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
            opt.disabled ? 'pointer-events-none cursor-not-allowed opacity-40' : ''
          ]"
          @mouseenter="focusedIndex = idx"
          @click="handleSelect(opt)"
        >
          <span class="truncate">{{ opt.label }}</span>
          <Check
            v-if="isSelected(opt.value)"
            class="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
        </button>
      </div>
    </Transition>
  </div>
</template>
