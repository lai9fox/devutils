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
    placement: 'left',
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
  <div
    ref="containerRef"
    class="relative inline-block text-left select-none"
  >
    <!-- 下拉触发按钮 -->
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :class="[
        'inline-flex items-center justify-between gap-2 border text-zinc-900 dark:text-zinc-100 shadow-xs transition-colors select-none text-left',
        disabled
          ? 'bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/80 text-zinc-400 dark:text-zinc-500 cursor-not-allowed pointer-events-none shadow-none'
          : 'bg-white dark:bg-zinc-900 cursor-pointer',
        !disabled && (isOpen
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'),
        size === 'sm' ? 'h-8 px-2.5 text-xs rounded-lg' : 'h-9 px-3 text-sm rounded-lg',
        selectClass
      ]"
      @click="toggleOpen"
      @keydown="handleKeyDown"
    >
      <span class="truncate">{{ currentLabel }}</span>
      <ChevronDown
        class="w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200"
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
          'absolute top-full mt-1.5 min-w-full w-max max-h-64 overflow-y-auto rounded-xl p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 text-xs backdrop-blur-md',
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
            'w-full flex items-center justify-between gap-3 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-left select-none outline-none focus:outline-none',
            isSelected(opt.value)
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
              : focusedIndex === idx
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100',
            opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
          ]"
          @mouseenter="focusedIndex = idx"
          @click="handleSelect(opt)"
        >
          <span class="truncate">{{ opt.label }}</span>
          <Check
            v-if="isSelected(opt.value)"
            class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
          />
        </button>
      </div>
    </Transition>
  </div>
</template>
