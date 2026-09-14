<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import { JSONPath } from 'jsonpath-plus'
import { Filter, AlertCircle, CheckCircle2 } from '@lucide/vue'
import { UiInput, UiSplitPane } from '../ui'
import { getToolDraft, setToolDraft } from '../../utils/toolDrafts'

const jsonInput = ref(getToolDraft('json-path:input', ''))
const pathExpression = ref(getToolDraft('json-path:expr', ''))

watch(jsonInput, (val) => setToolDraft('json-path:input', val))
watch(pathExpression, (val) => setToolDraft('json-path:expr', val))

interface EvaluationState {
  matches: unknown[]
  paths: string[]
  error: { type: 'json' | 'expr'; message: string } | null
}

const evaluated = computed<EvaluationState>(() => {
  const rawJson = jsonInput.value.trim()
  const expr = pathExpression.value.trim()

  if (!rawJson || !expr) {
    return { matches: [], paths: [], error: null }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawJson)
  } catch (err) {
    return {
      matches: [],
      paths: [],
      error: { type: 'json', message: (err as Error).message }
    }
  }

  try {
    const all = JSONPath({ path: expr, json: parsed as object, resultType: 'all' })
    const items = Array.isArray(all) ? all : all ? [all] : []
    return {
      matches: items.map((x: any) => x?.value),
      paths: items.map((x: any) => x?.path),
      error: null
    }
  } catch (err) {
    return {
      matches: [],
      paths: [],
      error: { type: 'expr', message: (err as Error).message }
    }
  }
})

const outputFormatted = computed(() => {
  if (evaluated.value.error) {
    return `// 提取失败: ${evaluated.value.error.type === 'json' ? 'JSON 语法错误' : 'JSONPath 表达式错误'}\n// ${evaluated.value.error.message}`
  }
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
        <template v-if="evaluated.error">
          <span class="flex items-center gap-1.5 text-xs text-rose-500">
            <AlertCircle class="h-3.5 w-3.5 shrink-0" />
            <span class="max-w-[200px] truncate" :title="evaluated.error.message">
              {{ evaluated.error.type === 'json' ? 'JSON 解析错误' : '表达式错误' }}
            </span>
          </span>
        </template>
        <template v-else-if="evaluated.matches.length === 0">
          <span class="text-xs text-amber-500"> 未匹配到任何项 </span>
        </template>
        <template v-else>
          <span class="text-xs whitespace-nowrap text-zinc-400">
            找到
            <strong class="text-emerald-600 dark:text-emerald-400">{{
              evaluated.matches.length
            }}</strong>
            项
          </span>
        </template>
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
