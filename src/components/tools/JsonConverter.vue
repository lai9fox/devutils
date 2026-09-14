<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import CodeEditor, { type CodeLanguage } from '../editor/CodeEditor.vue'
import YAML from 'yaml'
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser'
import { ArrowLeftRight, ArrowRight, AlertCircle } from '@lucide/vue'
import { UiButton, UiSegmented, UiCheckbox, UiSplitPane } from '../ui'
import { jsonToCsv, csvToJson, type CsvArrayFormat } from '../../utils/csv-converter'
import { getToolDraft, setToolDraft } from '../../utils/toolDrafts'

type Format = 'yaml' | 'xml' | 'csv'
type Direction = 'json-to-format' | 'format-to-json'

const selectedFormat = ref<Format>(getToolDraft('json-converter:format', 'yaml'))
const direction = ref<Direction>(getToolDraft('json-converter:direction', 'json-to-format'))
const csvFlatten = ref(getToolDraft('json-converter:csvFlatten', true))
const csvArrayFormat = ref<CsvArrayFormat>(getToolDraft('json-converter:csvArrayFormat', 'stringify'))

const sourceContent = ref(getToolDraft('json-converter:source', ''))
const targetContent = ref('')
const conversionError = ref<string | null>(null)

watch(selectedFormat, (val) => setToolDraft('json-converter:format', val))
watch(direction, (val) => setToolDraft('json-converter:direction', val))
watch(csvFlatten, (val) => setToolDraft('json-converter:csvFlatten', val))
watch(csvArrayFormat, (val) => setToolDraft('json-converter:csvArrayFormat', val))
watch(sourceContent, (val) => setToolDraft('json-converter:source', val))

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const sourceLanguage = computed<CodeLanguage>(() => {
  if (direction.value === 'json-to-format') return 'json'
  if (selectedFormat.value === 'yaml') return 'yaml'
  if (selectedFormat.value === 'xml') return 'xml'
  if (selectedFormat.value === 'csv') return 'csv'
  return 'plain'
})

const targetLanguage = computed<CodeLanguage>(() => {
  if (direction.value === 'format-to-json') return 'json'
  if (selectedFormat.value === 'yaml') return 'yaml'
  if (selectedFormat.value === 'xml') return 'xml'
  if (selectedFormat.value === 'csv') return 'csv'
  return 'plain'
})

function executeConversion() {
  const input = sourceContent.value.trim()
  if (!input) {
    targetContent.value = ''
    conversionError.value = null
    return
  }

  try {
    conversionError.value = null
    if (direction.value === 'json-to-format') {
      const parsed = JSON.parse(input)

      if (selectedFormat.value === 'yaml') {
        targetContent.value = YAML.stringify(parsed)
      } else if (selectedFormat.value === 'xml') {
        const builder = new XMLBuilder({
          ignoreAttributes: false,
          format: true,
          indentBy: '  '
        })
        const wrapped =
          typeof parsed === 'object' && !Array.isArray(parsed)
            ? { root: parsed }
            : { root: { item: parsed } }
        targetContent.value = builder.build(wrapped)
      } else if (selectedFormat.value === 'csv') {
        targetContent.value = jsonToCsv(parsed, {
          flatten: csvFlatten.value,
          arrayFormat: csvArrayFormat.value
        })
      }
    } else {
      // format-to-json
      if (selectedFormat.value === 'yaml') {
        const parsed = YAML.parse(input)
        targetContent.value = JSON.stringify(parsed, null, 2)
      } else if (selectedFormat.value === 'xml') {
        const validation = XMLValidator.validate(input)
        if (validation !== true) {
          const errDetail =
            typeof validation === 'object' && validation.err
              ? `${validation.err.msg} (第 ${validation.err.line} 行，第 ${validation.err.col} 列)`
              : 'XML 语法结构校验未通过'
          throw new Error(`XML 校验失败: ${errDetail}`)
        }
        const parser = new XMLParser({ ignoreAttributes: false })
        const parsed = parser.parse(input)
        targetContent.value = JSON.stringify(parsed, null, 2)
      } else if (selectedFormat.value === 'csv') {
        const parsed = csvToJson(input, {
          flatten: csvFlatten.value,
          arrayFormat: csvArrayFormat.value
        })
        targetContent.value = JSON.stringify(parsed, null, 2)
      }
    }
  } catch (err) {
    conversionError.value = (err as Error).message || '格式转换错误'
    targetContent.value = ''
  }
}

function runConversion(immediate = false) {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  const input = sourceContent.value.trim()
  if (!input) {
    targetContent.value = ''
    return
  }

  if (immediate) {
    executeConversion()
  } else {
    debounceTimer = setTimeout(() => {
      executeConversion()
    }, 150)
  }
}

function handleSwapDirection() {
  direction.value = direction.value === 'json-to-format' ? 'format-to-json' : 'json-to-format'
  sourceContent.value = targetContent.value
  runConversion(true)
}

watch(
  () => sourceContent.value,
  () => {
    runConversion(false)
  }
)

watch([selectedFormat, direction, csvFlatten, csvArrayFormat], () => {
  runConversion(true)
})

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
})
</script>

<template>
  <div class="flex h-full min-h-0 min-h-full w-full flex-1 flex-col gap-2.5">
    <!-- 工具栏 -->
    <div
      class="flex shrink-0 flex-wrap items-center justify-between gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-xs dark:border-zinc-800 dark:bg-[#121215]"
    >
      <div class="flex flex-wrap items-center gap-2">
        <!-- 格式选择 -->
        <UiSegmented v-model="selectedFormat" :options="['yaml', 'xml', 'csv']" uppercase />

        <!-- 转换方向切换 -->
        <UiButton variant="secondary" class="shrink-0" @click="handleSwapDirection">
          <template #prefix>
            <ArrowLeftRight class="h-3.5 w-3.5 text-emerald-500" />
          </template>
          <span class="flex items-center gap-1.5 whitespace-nowrap">
            <span>{{
              direction === 'json-to-format' ? 'JSON' : selectedFormat.toUpperCase()
            }}</span>
            <ArrowRight class="h-3 w-3 text-zinc-400" />
            <span>{{
              direction === 'json-to-format' ? selectedFormat.toUpperCase() : 'JSON'
            }}</span>
          </span>
        </UiButton>

        <!-- CSV 扁平化选项 -->
        <UiCheckbox
          v-if="selectedFormat === 'csv'"
          v-model="csvFlatten"
          size="sm"
          title="勾选时展开嵌套对象（如 userInfo.userId），取消勾选时对象保留为 JSON 字符串"
          class="box-border h-8 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-xs whitespace-nowrap text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/60 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          扁平化对象
        </UiCheckbox>

        <!-- CSV 数组字段处理选项 -->
        <div
          v-if="selectedFormat === 'csv'"
          class="flex h-8 items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
        >
          <span class="shrink-0 select-none">数组字段:</span>
          <UiSegmented
            v-model="csvArrayFormat"
            size="sm"
            :options="[
              { label: 'JSON 串', value: 'stringify' },
              { label: '拼接 (Join)', value: 'join' }
            ]"
          />
        </div>
      </div>
    </div>

    <!-- 错误反馈提示条 -->
    <div
      v-if="conversionError"
      class="flex shrink-0 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
    >
      <AlertCircle class="h-4 w-4 shrink-0 text-rose-500" />
      <span class="truncate font-medium">{{ conversionError }}</span>
    </div>

    <!-- 双栏工作台：撑满高度，支持拖拽重分配宽度 (默认 50%:50%) -->
    <UiSplitPane>
      <template #left>
        <CodeEditor
          v-model="sourceContent"
          title="输入源"
          :language="sourceLanguage"
          :filename="`devutils-source.${sourceLanguage === 'json' ? 'json' : selectedFormat}`"
          clearable
          placeholder="在此粘贴或输入待转换的内容..."
        />
      </template>

      <template #right>
        <CodeEditor
          :model-value="targetContent"
          title="转换输出"
          :language="targetLanguage"
          :filename="`devutils-converted.${targetLanguage === 'json' ? 'json' : selectedFormat}`"
          readonly
          :lint="false"
          placeholder="转换结果将在此实时展示..."
        />
      </template>
    </UiSplitPane>
  </div>
</template>
