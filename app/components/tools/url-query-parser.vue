<script setup lang="ts">
/**
 * URL / Query 解析工具
 * 解析完整 URL、相对 URL 或 query string，保留重复参数
 */
interface QueryEntry {
  key: string
  value: string
}

const input = ref('https://example.com/search?q=devutils&q=offline&page=1#result')
const sortParams = ref(false)

function isQueryOnly(value: string): boolean {
  return value.startsWith('?') || (!/^[a-z][a-z\d+.-]*:/i.test(value) && !value.includes('/') && /[=&]/.test(value))
}

const parseResult = computed(() => {
  const trimmed = input.value.trim()
  if (!trimmed) return { parsed: null, error: '' }

  try {
    const queryOnly = isQueryOnly(trimmed)
    const url = queryOnly
      ? new URL(`https://devutils.local/${trimmed.startsWith('?') ? trimmed : `?${trimmed}`}`)
      : new URL(trimmed, 'https://devutils.local')
    return {
      parsed: {
        url,
        queryOnly,
        relative: !queryOnly && !/^[a-z][a-z\d+.-]*:/i.test(trimmed)
      },
      error: ''
    }
  } catch (cause) {
    return { parsed: null, error: `解析失败：${(cause as Error).message}` }
  }
})

const parsed = computed(() => parseResult.value.parsed)
const error = computed(() => parseResult.value.error)

const queryEntries = computed<QueryEntry[]>(() => {
  if (!parsed.value) return []
  const entries = Array.from(parsed.value.url.searchParams.entries()).map(([key, value]) => ({ key, value }))
  if (!sortParams.value) return entries
  return entries.sort((a, b) => a.key.localeCompare(b.key) || a.value.localeCompare(b.value))
})

const queryJson = computed(() => {
  const data: Record<string, string | string[]> = {}
  for (const item of queryEntries.value) {
    const current = data[item.key]
    if (Array.isArray(current)) {
      current.push(item.value)
    } else if (typeof current === 'string') {
      data[item.key] = [current, item.value]
    } else {
      data[item.key] = item.value
    }
  }
  return JSON.stringify(data, null, 2)
})

const rebuiltQuery = computed(() =>
  queryEntries.value
    .map(item => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`)
    .join('&')
)

const componentRows = computed(() => {
  if (!parsed.value || parsed.value.queryOnly) return []
  const { url, relative } = parsed.value
  return [
    { label: '类型', value: relative ? '相对 URL' : '完整 URL' },
    { label: '协议', value: relative ? '' : url.protocol.replace(/:$/, '') },
    { label: '主机', value: relative ? '' : url.host },
    { label: '路径', value: url.pathname },
    { label: 'Hash', value: url.hash.replace(/^#/, '') }
  ].filter(row => row.value)
})

function clear() {
  input.value = ''
}

function loadSample() {
  input.value = 'https://example.com/search?q=devutils&q=offline&page=1#result'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="支持完整 URL、相对 URL 或单独的 query string。重复参数会保留为多条记录。" />

    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">URL 或 Query</label>
      <CodeEditor
        v-model="input"
        language="plain"
        :rows="4"
        placeholder="https://example.com/path?a=1&a=2 或 a=1&b=2"
      />
      <p
        v-if="error"
        class="text-sm text-error"
      >
        {{ error }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UCheckbox
        v-model="sortParams"
        label="按 key 排序"
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
      <Copy :text="rebuiltQuery" />
    </div>

    <div
      v-if="componentRows.length"
      class="grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      <div
        v-for="row in componentRows"
        :key="row.label"
        class="min-w-0 rounded-lg border border-default bg-elevated p-3"
      >
        <div class="text-xs text-dimmed">
          {{ row.label }}
        </div>
        <div class="font-mono text-sm text-default break-all">
          {{ row.value }}
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">Query 参数（{{ queryEntries.length }}）</label>
      <div class="overflow-x-auto rounded-lg border border-default">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-elevated text-muted">
              <th class="px-3 py-2 text-left font-medium">
                #
              </th>
              <th class="px-3 py-2 text-left font-medium">
                Key
              </th>
              <th class="px-3 py-2 text-left font-medium">
                Value
              </th>
              <th class="px-3 py-2 text-left font-medium">
                复制
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in queryEntries"
              :key="`${item.key}-${index}`"
              class="border-t border-default"
            >
              <td class="px-3 py-2 text-dimmed">
                {{ index + 1 }}
              </td>
              <td class="px-3 py-2 font-mono text-default">
                {{ item.key }}
              </td>
              <td class="px-3 py-2 font-mono text-default break-all">
                {{ item.value }}
              </td>
              <td class="px-3 py-2">
                <Copy
                  size="xs"
                  :text="`${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`"
                />
              </td>
            </tr>
            <tr v-if="!queryEntries.length">
              <td
                colspan="4"
                class="px-3 py-6 text-center text-muted"
              >
                没有 Query 参数
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-muted">JSON</label>
          <Copy
            size="xs"
            :text="queryJson"
          />
        </div>
        <CodeEditor
          :model-value="queryJson"
          language="json"
          :rows="8"
          auto-height
          :line-numbers="false"
          :highlight-active-line="false"
          line-wrapping
          readonly
        />
      </div>
      <div class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-muted">重建 Query String</label>
          <Copy
            size="xs"
            :text="rebuiltQuery"
          />
        </div>
        <CodeEditor
          :model-value="rebuiltQuery"
          language="plain"
          :rows="8"
          auto-height
          :line-numbers="false"
          :highlight-active-line="false"
          line-wrapping
          readonly
        />
      </div>
    </div>
  </div>
</template>
