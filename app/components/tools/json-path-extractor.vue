<script setup lang="ts">
/**
 * JSON 路径提取工具
 * 支持 v1 范围内的点路径、数组索引、通配符与括号 key
 */
type PathToken = { type: 'key', key: string } | { type: 'index', index: number } | { type: 'wildcard' }

interface MatchItem {
  path: string
  value: unknown
}

const jsonInput = ref(`{
  "user": {
    "name": "DevUtils",
    "roles": ["admin", "editor"],
    "profile-url": "https://devutils.fox9.dev"
  },
  "items": [
    { "id": 1, "name": "JSON" },
    { "id": 2, "name": "YAML" }
  ]
}`)
const pathInput = ref('$.items[*].id')
const indentSize = ref(2)

function readIdentifier(path: string, start: number): { key: string, next: number } {
  let end = start
  while (end < path.length && path[end] !== '.' && path[end] !== '[') {
    end++
  }
  const key = path.slice(start, end).trim()
  if (!key) throw new Error('路径中存在空字段名')
  return { key, next: end }
}

function readQuotedKey(path: string, start: number): { key: string, next: number } {
  const quote = path[start]
  let end = start + 1
  let escaped = false
  while (end < path.length) {
    const ch = path[end]
    if (!escaped && ch === quote) break
    escaped = !escaped && ch === '\\'
    if (ch !== '\\') escaped = false
    end++
  }
  if (end >= path.length) throw new Error('括号 key 缺少结束引号')
  const literal = path.slice(start, end + 1)
  if (path[end + 1] !== ']') throw new Error('括号 key 缺少 ]')
  return { key: JSON.parse(literal), next: end + 2 }
}

function parsePath(path: string): PathToken[] {
  const raw = path.trim()
  if (!raw) throw new Error('请输入路径表达式')
  if (raw.includes('..') || raw.includes('?(') || raw.includes(':')) {
    throw new Error('v1 暂不支持 recursive descent、filter 或 slice')
  }

  const tokens: PathToken[] = []
  let index = raw.startsWith('$') ? 1 : 0

  while (index < raw.length) {
    const ch = raw[index]
    if (ch === '.') {
      const item = readIdentifier(raw, index + 1)
      tokens.push({ type: 'key', key: item.key })
      index = item.next
      continue
    }
    if (ch === '[') {
      const next = raw[index + 1]
      if (next === '"' || next === '\'') {
        const item = readQuotedKey(raw, index + 1)
        tokens.push({ type: 'key', key: item.key })
        index = item.next
        continue
      }
      const close = raw.indexOf(']', index + 1)
      if (close === -1) throw new Error('数组访问缺少 ]')
      const inner = raw.slice(index + 1, close).trim()
      if (inner === '*') {
        tokens.push({ type: 'wildcard' })
      } else if (/^\d+$/.test(inner)) {
        tokens.push({ type: 'index', index: Number.parseInt(inner, 10) })
      } else {
        throw new Error('括号中仅支持数字索引、* 或 quoted key')
      }
      index = close + 1
      continue
    }

    const item = readIdentifier(raw, index)
    tokens.push({ type: 'key', key: item.key })
    index = item.next
  }

  return tokens
}

function appendPath(parent: string, token: PathToken, keyOrIndex?: string | number): string {
  if (token.type === 'key') {
    return /^[A-Za-z_$][\w$]*$/.test(token.key)
      ? `${parent}.${token.key}`
      : `${parent}[${JSON.stringify(token.key)}]`
  }
  const actual = token.type === 'index' ? token.index : keyOrIndex
  if (typeof actual === 'string') {
    return `${parent}[${JSON.stringify(actual)}]`
  }
  return `${parent}[${actual}]`
}

function extractValue(data: unknown, tokens: PathToken[]): MatchItem[] {
  let current: MatchItem[] = [{ path: '$', value: data }]

  for (const token of tokens) {
    const next: MatchItem[] = []
    for (const item of current) {
      if (token.type === 'key') {
        if (item.value !== null && typeof item.value === 'object' && token.key in item.value) {
          next.push({
            path: appendPath(item.path, token),
            value: (item.value as Record<string, unknown>)[token.key]
          })
        }
      } else if (token.type === 'index') {
        if (Array.isArray(item.value) && token.index < item.value.length) {
          next.push({
            path: appendPath(item.path, token),
            value: item.value[token.index]
          })
        }
      } else if (Array.isArray(item.value)) {
        item.value.forEach((value, index) => {
          next.push({ path: appendPath(item.path, token, index), value })
        })
      } else if (item.value !== null && typeof item.value === 'object') {
        for (const [key, value] of Object.entries(item.value)) {
          next.push({ path: appendPath(item.path, token, key), value })
        }
      }
    }
    current = next
  }

  return current
}

const extractionResult = computed<{ matches: MatchItem[], error: string }>(() => {
  if (!jsonInput.value.trim() || !pathInput.value.trim()) {
    return { matches: [], error: '' }
  }

  try {
    const parsed = JSON.parse(jsonInput.value)
    return { matches: extractValue(parsed, parsePath(pathInput.value)), error: '' }
  } catch (cause) {
    return { matches: [], error: `提取失败：${(cause as Error).message}` }
  }
})

const matches = computed(() => extractionResult.value.matches)
const error = computed(() => extractionResult.value.error)

function normalizedIndent(): number {
  const n = Number(indentSize.value)
  if (!Number.isFinite(n)) return 2
  return Math.min(8, Math.max(1, Math.trunc(n)))
}

const output = computed(() => {
  if (!matches.value.length) return ''
  const values = matches.value.map(item => item.value)
  return JSON.stringify(values.length === 1 ? values[0] : values, null, normalizedIndent())
})

function clear() {
  jsonInput.value = ''
  pathInput.value = ''
}

function loadSample() {
  jsonInput.value = `{
  "user": {
    "name": "DevUtils",
    "roles": ["admin", "editor"],
    "profile-url": "https://devutils.fox9.dev"
  },
  "items": [
    { "id": 1, "name": "JSON" },
    { "id": 2, "name": "YAML" }
  ]
}`
  pathInput.value = '$.items[*].id'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="v1 支持 $.a.b、items[0]、items[*].id、[&quot;key-with-dash&quot;]；暂不支持 filter、slice、recursive descent。" />

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="flex min-w-0 flex-col gap-2">
        <label class="text-sm font-medium text-muted">JSON</label>
        <CodeEditor
          v-model="jsonInput"
          language="json"
          :rows="16"
          placeholder="{ &quot;items&quot;: [{ &quot;id&quot;: 1 }] }"
        />
      </div>
      <div class="flex min-w-0 flex-col gap-2">
        <label class="text-sm font-medium text-muted">路径表达式</label>
        <UInput
          v-model="pathInput"
          placeholder="$.items[*].id"
          class="font-mono"
        />

        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-2">
            <label class="text-sm text-muted">缩进</label>
            <UInput
              v-model.number="indentSize"
              type="number"
              :min="1"
              :max="8"
              class="w-16"
            />
          </div>
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
          <Copy :text="output" />
        </div>

        <p
          v-if="error"
          class="text-sm text-error"
        >
          {{ error }}
        </p>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-muted">提取结果（{{ matches.length }}）</label>
          <CodeEditor
            :model-value="output"
            language="json"
            :rows="10"
            placeholder="提取结果"
            readonly
          />
        </div>
      </div>
    </div>

    <div
      v-if="matches.length"
      class="flex flex-col gap-2"
    >
      <label class="text-sm font-medium text-muted">匹配路径</label>
      <div class="rounded-lg border border-default bg-elevated divide-y divide-default">
        <div
          v-for="item in matches"
          :key="item.path"
          class="flex items-center justify-between gap-3 p-3"
        >
          <code class="font-mono text-sm text-default break-all">{{ item.path }}</code>
          <Copy
            size="xs"
            :text="JSON.stringify(item.value, null, normalizedIndent())"
          />
        </div>
      </div>
    </div>
  </div>
</template>
