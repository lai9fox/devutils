<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { searchTools, tools } from '../../data/tools'
import { useCommandPalette } from '../../composables/useCommandPalette'
import {
  Search,
  X,
  ArrowRight,
  AlignLeft,
  FolderTree,
  ShieldCheck,
  Filter,
  FileType,
  ArrowLeftRight,
  ArrowUp,
  ArrowDown,
  CornerDownLeft
} from '@lucide/vue'
import { UiButton } from '../ui'

const props = withDefaults(
  defineProps<{
    isOpen?: boolean
  }>(),
  {
    isOpen: undefined
  }
)

const emit = defineEmits<{
  close: []
  open: []
  select: [path: string]
  'update:isOpen': [value: boolean]
}>()

const paletteState = useCommandPalette()

const activeIsOpen = computed(() => {
  return props.isOpen !== undefined ? props.isOpen : paletteState.isOpen.value
})

const query = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const filteredTools = computed(() => {
  return searchTools(query.value)
})

function getIconComponent(icon: string) {
  switch (icon) {
    case 'AlignLeft':
      return AlignLeft
    case 'FolderTree':
      return FolderTree
    case 'ShieldCheck':
      return ShieldCheck
    case 'Filter':
      return Filter
    case 'FileType':
      return FileType
    case 'ArrowLeftRight':
      return ArrowLeftRight
    default:
      return AlignLeft
  }
}

function handleClose() {
  paletteState.close()
  emit('update:isOpen', false)
  emit('close')
}

function handleOpen() {
  paletteState.open()
  emit('update:isOpen', true)
  emit('open')
}

function handleToggle() {
  if (activeIsOpen.value) {
    handleClose()
  } else {
    handleOpen()
  }
}

function handleSelect(path: string) {
  handleClose()
  emit('select', path)
}

function onKeyDown(e: KeyboardEvent) {
  // Cmd+K or Ctrl+K trigger
  const isK = e.key?.toLowerCase() === 'k' || e.code === 'KeyK'
  if ((e.metaKey || e.ctrlKey) && isK) {
    e.preventDefault()
    e.stopPropagation()
    handleToggle()
    return
  }

  if (!activeIsOpen.value) return

  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    handleClose()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (filteredTools.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % filteredTools.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (filteredTools.value.length > 0) {
      selectedIndex.value =
        (selectedIndex.value - 1 + filteredTools.value.length) % filteredTools.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const target = filteredTools.value[selectedIndex.value]
    if (target) {
      handleSelect(target.path)
    }
  }
}

watch(query, () => {
  selectedIndex.value = 0
})

watch(activeIsOpen, (open) => {
  if (open) {
    query.value = ''
    selectedIndex.value = 0
    nextTick(() => {
      inputRef.value?.focus()
      setTimeout(() => {
        inputRef.value?.focus()
      }, 50)
    })
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('devutils:open-command-palette', handleOpen)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown, true)
  window.removeEventListener('devutils:open-command-palette', handleOpen)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="activeIsOpen"
        class="fixed inset-0 z-[100] flex items-start justify-center bg-zinc-950/50 px-3 pt-10 backdrop-blur-xs sm:px-4 sm:pt-20"
        @click.self="handleClose"
      >
        <div
          class="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-900"
        >
          <!-- 搜索输入框 -->
          <div class="flex items-center border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <Search class="mr-3 h-4 w-4 shrink-0 text-zinc-400" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="搜索工具、功能或关键字..."
              class="w-full bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-100"
            />
            <UiButton variant="ghost" size="icon-sm" aria-label="关闭搜索弹窗" @click="handleClose">
              <X class="h-4 w-4" />
            </UiButton>
          </div>

          <!-- 工具列表 -->
          <div class="max-h-80 overflow-y-auto p-2">
            <div v-if="filteredTools.length === 0" class="py-8 text-center text-xs text-zinc-400">
              未找到相关工具
            </div>

            <button
              v-for="(tool, idx) in filteredTools"
              :key="tool.id"
              class="flex w-full cursor-pointer items-center justify-between rounded-xl p-2.5 text-left transition-colors"
              :class="
                idx === selectedIndex
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60'
              "
              @click="handleSelect(tool.path)"
              @mouseenter="selectedIndex = idx"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <component :is="getIconComponent(tool.icon)" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <div class="truncate text-xs font-semibold">{{ tool.name }}</div>
                  <div class="truncate text-[11px] text-zinc-400">{{ tool.description }}</div>
                </div>
              </div>

              <ArrowRight class="ml-2 h-3.5 w-3.5 shrink-0 text-zinc-400" />
            </button>
          </div>

          <!-- 底部提示栏 (仅桌面端展示键盘快捷键提示) -->
          <div
            class="hidden items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-4 py-2.5 text-[11px] text-zinc-400 sm:flex dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center gap-1">
                <span>导航</span>
                <kbd
                  class="inline-flex h-4.5 w-4.5 items-center justify-center rounded bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <ArrowUp class="h-2.5 w-2.5" />
                </kbd>
                <kbd
                  class="inline-flex h-4.5 w-4.5 items-center justify-center rounded bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <ArrowDown class="h-2.5 w-2.5" />
                </kbd>
              </span>
              <span class="inline-flex items-center gap-1">
                <span>打开</span>
                <kbd
                  class="inline-flex h-4.5 w-4.5 items-center justify-center rounded bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <CornerDownLeft class="h-2.5 w-2.5" />
                </kbd>
              </span>
            </div>
            <span class="inline-flex items-center gap-1">
              <kbd
                class="inline-flex h-4.5 items-center justify-center rounded bg-zinc-200 px-1.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >ESC</kbd
              >
              <span>退出</span>
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
