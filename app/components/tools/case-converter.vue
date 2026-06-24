<script setup lang="ts">
/**
 * 大小写转换工具
 * 将文本或标识符转换为常见命名风格，支持逐行批量转换
 */
type CaseFormat = 'camel' | 'pascal' | 'snake' | 'kebab' | 'constant' | 'dot' | 'title' | 'sentence'

interface FormatOption {
  label: string
  value: CaseFormat
}

const input = ref('')
const batchByLine = ref(false)

const formatOptions: FormatOption[] = [
  { label: 'camelCase', value: 'camel' },
  { label: 'PascalCase', value: 'pascal' },
  { label: 'snake_case', value: 'snake' },
  { label: 'kebab-case', value: 'kebab' },
  { label: 'CONSTANT_CASE', value: 'constant' },
  { label: 'dot.case', value: 'dot' },
  { label: 'Title Case', value: 'title' },
  { label: 'Sentence case', value: 'sentence' }
]

function splitWords(value: string): string[] {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-.]+/g, ' ')
    .match(/[\p{L}\p{N}]+/gu) ?? []
}

function capitalize(word: string): string {
  const lower = word.toLocaleLowerCase()
  return lower ? `${lower[0]!.toLocaleUpperCase()}${lower.slice(1)}` : ''
}

function convertWords(words: string[], format: CaseFormat): string {
  if (!words.length) return ''
  const lowerWords = words.map(word => word.toLocaleLowerCase())

  switch (format) {
    case 'camel':
      return lowerWords[0]! + lowerWords.slice(1).map(capitalize).join('')
    case 'pascal':
      return lowerWords.map(capitalize).join('')
    case 'snake':
      return lowerWords.join('_')
    case 'kebab':
      return lowerWords.join('-')
    case 'constant':
      return lowerWords.join('_').toLocaleUpperCase()
    case 'dot':
      return lowerWords.join('.')
    case 'title':
      return lowerWords.map(capitalize).join(' ')
    case 'sentence':
      return capitalize(lowerWords.join(' '))
    default:
      return lowerWords.join(' ')
  }
}

function convertText(value: string, format: CaseFormat): string {
  if (!batchByLine.value) return convertWords(splitWords(value), format)
  return value
    .split('\n')
    .map(line => convertWords(splitWords(line), format))
    .join('\n')
}

const results = computed(() =>
  formatOptions.map(option => ({
    ...option,
    result: convertText(input.value, option.value)
  }))
)

const allOutput = computed(() =>
  results.value
    .map(item => `${item.label}: ${item.result}`)
    .join('\n')
)

function clear() {
  input.value = ''
}

function loadSample() {
  input.value = batchByLine.value
    ? 'user profile URL\nHTTP response code\ncreated_at'
    : 'user profile URL'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="将文本或代码标识符转换为常见命名风格。逐行模式适合批量处理字段名。" />

    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">输入</label>
      <UTextarea
        v-model="input"
        :rows="7"
        placeholder="user profile URL / user_profile_url / user-profile-url"
        class="font-mono text-sm"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UCheckbox
        v-model="batchByLine"
        label="逐行转换"
      />
      <UButton
        icon="lucide:file-text"
        variant="ghost"
        color="secondary"
        @click="loadSample"
      >
        加载示例
      </UButton>
      <UButton
        variant="ghost"
        color="error"
        icon="lucide:trash-2"
        @click="clear"
      >
        清空
      </UButton>
      <Copy :text="allOutput" />
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div
        v-for="item in results"
        :key="item.value"
        class="rounded-lg border border-default bg-elevated p-4 flex flex-col gap-2"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-muted">{{ item.label }}</span>
          <Copy
            size="xs"
            :text="item.result"
          />
        </div>
        <pre class="min-h-8 whitespace-pre-wrap break-all font-mono text-sm text-default">{{ item.result || ' ' }}</pre>
      </div>
    </div>
  </div>
</template>
