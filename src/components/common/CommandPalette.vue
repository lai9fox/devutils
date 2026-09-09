<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { searchTools, tools } from '../../data/tools'
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

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const query = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const filteredTools = computed(() => {
  return searchTools(query.value)
})

function getIconComponent(icon: string) {
  switch (icon) {
    case 'AlignLeft': return AlignLeft
    case 'FolderTree': return FolderTree
    case 'ShieldCheck': return ShieldCheck
    case 'Filter': return Filter
    case 'FileType': return FileType
    case 'ArrowLeftRight': return ArrowLeftRight
    default: return AlignLeft
  }
}

function handleSelect(path: string) {
  emit('close')
  window.location.href = path
}

function onKeyDown(e: KeyboardEvent) {
  // Cmd+K or Ctrl+K trigger
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (props.isOpen) {
      emit('close')
    } else {
      // open
      emit('close') // fallback
    }
  }

  if (!props.isOpen) return

  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % (filteredTools.value.length || 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + filteredTools.value.length) % (filteredTools.value.length || 1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const target = filteredTools.value[selectedIndex.value]
    if (target) {
      handleSelect(target.path)
    }
  }
}

watch(() => props.isOpen, (open) => {
  if (open) {
    query.value = ''
    selectedIndex.value = 0
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-zinc-950/50 backdrop-blur-xs transition-opacity"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all">
        <!-- 搜索输入框 -->
        <div class="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <Search class="w-4 h-4 text-zinc-400 shrink-0 mr-3" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="搜索 JSON 工具、功能或关键字..."
            class="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          >
          <button
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            @click="emit('close')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- 工具列表 -->
        <div class="max-h-80 overflow-y-auto p-2">
          <div
            v-if="filteredTools.length === 0"
            class="py-8 text-center text-xs text-zinc-400"
          >
            未找到相关 JSON 工具
          </div>

          <button
            v-for="(tool, idx) in filteredTools"
            :key="tool.id"
            class="w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer"
            :class="idx === selectedIndex ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'"
            @click="handleSelect(tool.path)"
            @mouseenter="selectedIndex = idx"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                <component :is="getIconComponent(tool.icon)" class="w-4 h-4" />
              </span>
              <div class="min-w-0">
                <div class="text-xs font-semibold truncate">{{ tool.name }}</div>
                <div class="text-[11px] text-zinc-400 truncate">{{ tool.description }}</div>
              </div>
            </div>

            <ArrowRight class="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-2" />
          </button>
        </div>

        <!-- 底部提示栏 -->
        <div class="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[11px] text-zinc-400">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1">
              <span>导航</span>
              <kbd class="inline-flex items-center justify-center w-4.5 h-4.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <ArrowUp class="w-2.5 h-2.5" />
              </kbd>
              <kbd class="inline-flex items-center justify-center w-4.5 h-4.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <ArrowDown class="w-2.5 h-2.5" />
              </kbd>
            </span>
            <span class="inline-flex items-center gap-1">
              <span>打开</span>
              <kbd class="inline-flex items-center justify-center w-4.5 h-4.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <CornerDownLeft class="w-2.5 h-2.5" />
              </kbd>
            </span>
          </div>
          <span class="inline-flex items-center gap-1">
            <kbd class="inline-flex items-center justify-center px-1.5 h-4.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-mono">ESC</kbd>
            <span>退出</span>
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
