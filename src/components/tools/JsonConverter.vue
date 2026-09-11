<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import CodeEditor, { type CodeLanguage } from '../editor/CodeEditor.vue'
import YAML from 'yaml'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import {
  ArrowLeftRight,
  ArrowRight
} from '@lucide/vue'
import { UiButton, UiSegmented, UiCheckbox, UiSplitPane } from '../ui'
import { jsonToCsv, csvToJson, type CsvArrayFormat } from '../../utils/csv-converter'

type Format = 'yaml' | 'xml' | 'csv'
type Direction = 'json-to-format' | 'format-to-json'

const selectedFormat = ref<Format>('yaml')
const direction = ref<Direction>('json-to-format')
const csvFlatten = ref(true)
const csvArrayFormat = ref<CsvArrayFormat>('stringify')

const sourceContent = ref('')
const targetContent = ref('')

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
    return
  }

  try {
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
        const wrapped = typeof parsed === 'object' && !Array.isArray(parsed) ? { root: parsed } : { root: { item: parsed } }
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
  } catch {
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

watch(
  [selectedFormat, direction, csvFlatten, csvArrayFormat],
  () => {
    runConversion(true)
  }
)

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
})
</script>

<template>
  <div class="h-full min-h-full flex-1 flex flex-col min-h-0 w-full gap-2.5">
    <!-- 工具栏 -->
    <div class="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs shrink-0">
      <div class="flex flex-wrap items-center gap-2">
        <!-- 格式选择 -->
        <UiSegmented
          v-model="selectedFormat"
          :options="['yaml', 'xml', 'csv']"
          uppercase
        />

        <!-- 转换方向切换 -->
        <UiButton
          variant="secondary"
          class="shrink-0"
          @click="handleSwapDirection"
        >
          <template #prefix>
            <ArrowLeftRight class="w-3.5 h-3.5 text-emerald-500" />
          </template>
          <span class="flex items-center gap-1.5 whitespace-nowrap">
            <span>{{ direction === 'json-to-format' ? 'JSON' : selectedFormat.toUpperCase() }}</span>
            <ArrowRight class="w-3 h-3 text-zinc-400" />
            <span>{{ direction === 'json-to-format' ? selectedFormat.toUpperCase() : 'JSON' }}</span>
          </span>
        </UiButton>

        <!-- CSV 扁平化选项 -->
        <UiCheckbox
          v-if="selectedFormat === 'csv'"
          v-model="csvFlatten"
          size="sm"
          title="勾选时展开嵌套对象（如 userInfo.userId），取消勾选时对象保留为 JSON 字符串"
          class="h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-lg transition-colors box-border shrink-0 whitespace-nowrap"
        >
          扁平化对象
        </UiCheckbox>

        <!-- CSV 数组字段处理选项 -->
        <div v-if="selectedFormat === 'csv'" class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 h-8">
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
