<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronRight, ChevronDown, Copy, Check, Route } from '@lucide/vue'

const props = defineProps<{
  nodeKey?: string | number
  value: unknown
  path: string
  depth: number
  isLast?: boolean
  autoExpandLevel?: number
  expandedSet?: Set<string>
}>()

const emit = defineEmits<{
  'select-path': [path: string, value: unknown]
  'toggle-expand': [path: string]
  'copy-text': [text: string, type: 'path' | 'value']
}>()

const isObject = computed(() => props.value !== null && typeof props.value === 'object')
const isArray = computed(() => Array.isArray(props.value))

const childEntries = computed<[string, unknown][]>(() => {
  if (!isObject.value) return []
  if (isArray.value) {
    return (props.value as unknown[]).map((v, i) => [String(i), v])
  }
  return Object.entries(props.value as Record<string, unknown>)
})

const countLabel = computed(() => {
  if (isArray.value) {
    const len = (props.value as unknown[]).length
    return `${len} ${len === 1 ? 'item' : 'items'}`
  }
  if (isObject.value) {
    const keys = Object.keys(props.value as Record<string, unknown>).length
    return `${keys} ${keys === 1 ? 'key' : 'keys'}`
  }
  return ''
})

const collapsedPreview = computed(() => {
  if (!isObject.value) return ''
  if (isArray.value) {
    const arr = props.value as unknown[]
    if (arr.length === 0) return '[]'
    return `[ ${arr
      .slice(0, 3)
      .map((v) => (typeof v === 'object' ? '{...}' : JSON.stringify(v)))
      .join(', ')}${arr.length > 3 ? ', ...' : ''} ]`
  }
  const keys = Object.keys(props.value as Record<string, unknown>)
  if (keys.length === 0) return '{}'
  return `{ ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', ...' : ''} }`
})

const isExpanded = computed(() => {
  if (!isObject.value) return false
  if (props.expandedSet) {
    return props.expandedSet.has(props.path)
  }
  return props.depth < (props.autoExpandLevel ?? 2)
})

function toggleExpand() {
  emit('toggle-expand', props.path)
}

function handleNodeClick() {
  emit('select-path', props.path, props.value)
}

const copiedField = ref<'path' | 'value' | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null

function copyPath() {
  emit('copy-text', props.path, 'path')
  copiedField.value = 'path'
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copiedField.value = null
  }, 1200)
}

function copyValue() {
  const text = typeof props.value === 'string' ? props.value : JSON.stringify(props.value)
  emit('copy-text', text, 'value')
  copiedField.value = 'value'
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copiedField.value = null
  }, 1200)
}
</script>

<template>
  <div class="font-mono text-xs leading-relaxed select-text">
    <!-- 节点行 -->
    <div
      class="group flex cursor-default items-center rounded px-1.5 py-0.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
      @click.stop="handleNodeClick"
    >
      <!-- 折叠/展开箭头 (仅针对 Object / Array) -->
      <button
        v-if="isObject"
        class="-ml-1 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        @click.stop="toggleExpand"
      >
        <ChevronRight
          class="h-3.5 w-3.5 transition-transform duration-150 ease-out"
          :class="isExpanded ? 'rotate-90' : 'rotate-0'"
        />
      </button>
      <span v-else class="w-4 shrink-0" />

      <!-- 键名 (Key / Index) -->
      <span
        v-if="nodeKey !== undefined"
        class="mr-1.5 shrink-0 font-medium"
        :class="isArray ? 'text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'"
      >
        <template v-if="!isArray">"{{ nodeKey }}":</template>
        <template v-else>[{{ nodeKey }}]:</template>
      </span>

      <!-- 展开态的对象/数组开始符号 -->
      <template v-if="isObject">
        <span v-if="isExpanded" class="text-zinc-400">
          {{ isArray ? '[' : '{' }}
          <span class="ml-1 font-sans text-[10px] text-zinc-400 opacity-60"
            >({{ countLabel }})</span
          >
        </span>

        <!-- 折叠态的预览 -->
        <span
          v-else
          class="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          @click.stop="toggleExpand"
        >
          <span class="text-zinc-400">{{ isArray ? '[' : '{' }}</span>
          <span
            class="py-0.2 mx-1 rounded bg-zinc-200/70 px-1.5 font-sans text-[11px] font-normal text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {{ countLabel }}
          </span>
          <span class="opacity-70">{{ collapsedPreview }}</span>
          <span class="text-zinc-400">{{ isArray ? ']' : '}' }}</span>
        </span>
      </template>

      <!-- 原始简单值渲染 -->
      <template v-else>
        <!-- 字符串 -->
        <span
          v-if="typeof value === 'string'"
          class="break-all text-emerald-600 dark:text-emerald-400"
        >
          "{{ value }}"
        </span>

        <!-- 数字 -->
        <span
          v-else-if="typeof value === 'number'"
          class="font-semibold text-sky-600 dark:text-sky-400"
        >
          {{ value }}
        </span>

        <!-- 布尔 -->
        <span
          v-else-if="typeof value === 'boolean'"
          class="font-bold text-amber-600 dark:text-amber-400"
        >
          {{ value }}
        </span>

        <!-- Null -->
        <span v-else-if="value === null" class="text-zinc-400 italic"> null </span>

        <!-- Other -->
        <span v-else class="text-zinc-500">
          {{ String(value) }}
        </span>
      </template>

      <!-- 尾部逗号 -->
      <span v-if="!isLast && (!isObject || !isExpanded)" class="text-zinc-400">,</span>

      <!-- 悬停快捷复制按钮 (紧随值/逗号后方显示，无需大幅移动鼠标) -->
      <div
        class="ml-1.5 inline-flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <button
          type="button"
          class="cursor-pointer rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-emerald-600 dark:hover:bg-zinc-700/70 dark:hover:text-emerald-400"
          :class="{ 'text-emerald-600 dark:text-emerald-400': copiedField === 'path' }"
          title="复制路径 (JSONPath)"
          @click.stop="copyPath"
        >
          <Check v-if="copiedField === 'path'" class="h-3 w-3 text-emerald-500" />
          <Route v-else class="h-3 w-3" />
        </button>
        <button
          type="button"
          class="cursor-pointer rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-emerald-600 dark:hover:bg-zinc-700/70 dark:hover:text-emerald-400"
          :class="{ 'text-emerald-600 dark:text-emerald-400': copiedField === 'value' }"
          title="复制节点值"
          @click.stop="copyValue"
        >
          <Check v-if="copiedField === 'value'" class="h-3 w-3 text-emerald-500" />
          <Copy v-else class="h-3 w-3" />
        </button>
      </div>
    </div>

    <!-- 展开时递归渲染子项 -->
    <div
      v-if="isObject && isExpanded"
      class="ml-2.5 flex flex-col border-l border-zinc-200/70 pl-2 dark:border-zinc-800/80"
    >
      <JsonTreeNode
        v-for="([k, v], idx) in childEntries"
        :key="path + '.' + k"
        :node-key="isArray ? Number(k) : k"
        :value="v"
        :path="isArray ? `${path}[${k}]` : `${path}.${k}`"
        :depth="depth + 1"
        :is-last="idx === childEntries.length - 1"
        :auto-expand-level="autoExpandLevel"
        :expanded-set="expandedSet"
        @select-path="(p, val) => emit('select-path', p, val)"
        @toggle-expand="(p) => emit('toggle-expand', p)"
        @copy-text="(t, type) => emit('copy-text', t, type)"
      />

      <!-- 闭合符号 -->
      <div class="px-1.5 py-0.5 text-zinc-400">
        {{ isArray ? ']' : '}' }}<span v-if="!isLast">,</span>
      </div>
    </div>
  </div>
</template>
