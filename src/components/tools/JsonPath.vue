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
  <div class="flex h-full min-h-0 min-h-full w-full flex-1 flex-col gap-2.5">
    <!-- JSONPath 表达式与操作栏 -->
    <div
      class="flex shrink-0 flex-col items-stretch gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-xs sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-[#121215]"
    >
      <div class="relative min-w-0 flex-1">
        <UiInput
          v-model="pathExpression"
          placeholder="输入表达式，例如 $.store.books[*].title 或 $..price"
          mono
        >
          <template #prefix>
            <Filter class="h-3.5 w-3.5" />
          </template>
        </UiInput>
      </div>

      <div v-if="pathExpression && jsonInput" class="flex shrink-0 items-center gap-2">
        <span class="text-xs whitespace-nowrap text-zinc-400">
          找到
          <strong class="text-emerald-600 dark:text-emerald-400">{{
            evaluated.matches.length
          }}</strong>
          项
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
      class="flex max-h-28 shrink-0 flex-col gap-1 overflow-y-auto px-1"
    >
      <div class="flex items-center justify-between text-[11px] font-medium text-zinc-400">
        <span>匹配节点路径清单 ({{ evaluated.paths.length }})</span>
      </div>
      <div
        class="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-white p-2 font-mono text-xs dark:border-zinc-800 dark:bg-[#121215]"
      >
        <span
          v-for="(path, idx) in evaluated.paths"
          :key="idx"
          class="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[11px] text-emerald-600 dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-emerald-400"
        >
          {{ path }}
        </span>
      </div>
    </div>
  </div>
</template>
