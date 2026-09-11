<script setup lang="ts">
import { ref, computed } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import { JSONPath } from 'jsonpath-plus'
import { Filter } from '@lucide/vue'
import { UiInput, UiSplitPane } from '../ui'

const jsonInput = ref('')
const pathExpression = ref('')

interface PathResult {
  matches: unknown[]
  paths: string[]
}

const evaluated = computed<PathResult>(() => {
  const rawJson = jsonInput.value.trim()
  const expr = pathExpression.value.trim()

  if (!rawJson || !expr) {
    return { matches: [], paths: [] }
  }

  try {
    const parsed = JSON.parse(rawJson)
    const matches = JSONPath({ path: expr, json: parsed, resultType: 'value' })
    const paths = JSONPath({ path: expr, json: parsed, resultType: 'path' })

    return {
      matches: Array.isArray(matches) ? matches : [matches],
      paths: Array.isArray(paths) ? paths : [paths]
    }
  } catch {
    return {
      matches: [],
      paths: []
    }
  }
})

const outputFormatted = computed(() => {
  if (!evaluated.value.matches.length) return ''
  return JSON.stringify(
    evaluated.value.matches.length === 1 ? evaluated.value.matches[0] : evaluated.value.matches,
    null,
    2
  )
})
</script>

<template>
  <div class="h-full min-h-full flex-1 flex flex-col min-h-0 w-full gap-2.5">
    <!-- JSONPath 表达式与操作栏 -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 px-3 py-2 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs shrink-0">
      <div class="relative flex-1 min-w-0">
        <UiInput
          v-model="pathExpression"
          placeholder="输入表达式，例如 $.store.books[*].title 或 $..price"
          mono
        >
          <template #prefix>
            <Filter class="w-3.5 h-3.5" />
          </template>
        </UiInput>
      </div>

      <div v-if="pathExpression && jsonInput" class="flex items-center gap-2 shrink-0">
        <span class="text-xs text-zinc-400 whitespace-nowrap">
          找到 <strong class="text-emerald-600 dark:text-emerald-400">{{ evaluated.matches.length }}</strong> 项
        </span>
      </div>
    </div>

    <!-- 双栏工作台：撑满高度，支持拖拽重分配宽度 (默认 50%:50%) -->
    <UiSplitPane>
      <template #left>
        <CodeEditor
          v-model="jsonInput"
          title="数据源 JSON"
          language="json"
          filename="devutils-source.json"
          clearable
          placeholder="在此粘贴或输入需要提取的数据源 JSON..."
        />
      </template>

      <template #right>
        <CodeEditor
          :model-value="outputFormatted"
          title="提取结果 (Matches)"
          language="json"
          filename="devutils-jsonpath-matches.json"
          readonly
          :lint="false"
          placeholder="JSONPath 匹配出的数据将在此格式化输出..."
        />
      </template>
    </UiSplitPane>

    <!-- 匹配路径列表：紧凑吸底展示 -->
    <div
      v-if="evaluated.paths.length > 0"
      class="flex flex-col gap-1 shrink-0 max-h-28 overflow-y-auto px-1"
    >
      <div class="flex items-center justify-between text-[11px] font-medium text-zinc-400">
        <span>匹配节点路径清单 ({{ evaluated.paths.length }})</span>
      </div>
      <div class="flex flex-wrap gap-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-xs font-mono">
        <span
          v-for="(path, idx) in evaluated.paths"
          :key="idx"
          class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-700/80 text-[11px]"
        >
          {{ path }}
        </span>
      </div>
    </div>
  </div>
</template>
