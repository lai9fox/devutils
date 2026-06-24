<script setup lang="ts">
/**
 * JSON Schema 校验工具
 * 使用 Ajv 校验 JSON 数据，支持 format 与本地 $ref
 */
import Ajv from 'ajv'
import type { ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'

type ValidationStatus = 'idle' | 'valid' | 'invalid' | 'error'

interface ValidationReport {
  status: ValidationStatus
  message: string
  errors: ErrorObject[]
}

const schemaInput = ref(`{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "email", "role"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "role": { "$ref": "#/definitions/role" }
  },
  "definitions": {
    "role": {
      "type": "string",
      "enum": ["admin", "editor", "viewer"]
    }
  }
}`)

const dataInput = ref(`{
  "name": "Alice",
  "email": "alice@example.com",
  "role": "admin"
}`)

const report = ref<ValidationReport>({
  status: 'idle',
  message: '',
  errors: []
})

function createAjv() {
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateSchema: true
  })
  addFormats(ajv)
  return ajv
}

function parseJsonInput(label: string, value: string): unknown {
  if (!value.trim()) throw new Error(`请输入 ${label}`)
  return JSON.parse(value)
}

function errorPath(error: ErrorObject): string {
  return error.instancePath || '(root)'
}

function errorMessage(error: ErrorObject): string {
  return error.message || '校验失败'
}

function validateJson() {
  try {
    const schema = parseJsonInput('JSON Schema', schemaInput.value)
    const data = parseJsonInput('JSON 数据', dataInput.value)
    const ajv = createAjv()
    const validate = ajv.compile(schema)
    const valid = validate(data)

    if (valid) {
      report.value = {
        status: 'valid',
        message: '✓ JSON 数据符合 Schema',
        errors: []
      }
      return
    }

    report.value = {
      status: 'invalid',
      message: `发现 ${validate.errors?.length ?? 0} 个校验错误`,
      errors: validate.errors ? [...validate.errors] : []
    }
  } catch (cause) {
    report.value = {
      status: 'error',
      message: `校验失败：${(cause as Error).message}`,
      errors: []
    }
  }
}

const resultText = computed(() => {
  if (report.value.status === 'idle') return ''
  if (report.value.status === 'valid' || report.value.status === 'error') {
    return report.value.message
  }

  return JSON.stringify(
    report.value.errors.map(error => ({
      path: errorPath(error),
      keyword: error.keyword,
      message: errorMessage(error),
      schemaPath: error.schemaPath
    })),
    null,
    2
  )
})

const resultLanguage = computed<'json' | 'plain'>(() => report.value.status === 'invalid' ? 'json' : 'plain')

const statusColorClass = computed(() => {
  if (report.value.status === 'valid') return 'text-success'
  if (report.value.status === 'invalid' || report.value.status === 'error') return 'text-error'
  return 'text-muted'
})

function loadSample() {
  schemaInput.value = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "email", "role"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "role": { "$ref": "#/definitions/role" }
  },
  "definitions": {
    "role": {
      "type": "string",
      "enum": ["admin", "editor", "viewer"]
    }
  }
}`
  dataInput.value = `{
  "name": "Alice",
  "email": "alice@example.com",
  "role": "admin"
}`
  report.value = {
    status: 'idle',
    message: '',
    errors: []
  }
}

function clear() {
  schemaInput.value = ''
  dataInput.value = ''
  report.value = {
    status: 'idle',
    message: '',
    errors: []
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="使用 Ajv 在浏览器本地校验 JSON 数据，支持 format、本地 $ref、$defs 与 definitions。" />
    <Note
      color="info"
      title="远程 $ref 不会联网解析；请把引用的 schema 放在当前 Schema 的本地 definitions 或 $defs 中。"
    />

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        icon="lucide:play"
        color="success"
        @click="validateJson"
      >
        校验
      </UButton>
      <UButton
        icon="lucide:file-text"
        variant="ghost"
        color="secondary"
        @click="loadSample"
      >
        示例
      </UButton>
      <UButton
        variant="ghost"
        color="error"
        icon="lucide:trash-2"
        @click="clear"
      >
        清空
      </UButton>
      <Copy :text="resultText" />
      <span
        v-if="report.message"
        class="text-sm font-medium"
        :class="statusColorClass"
      >
        {{ report.message }}
      </span>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="flex min-w-0 flex-col gap-2">
        <label class="text-sm font-medium text-muted">JSON Schema</label>
        <CodeEditor
          v-model="schemaInput"
          language="json"
          :rows="18"
          placeholder="{ &quot;type&quot;: &quot;object&quot; }"
        />
      </div>

      <div class="flex min-w-0 flex-col gap-2">
        <label class="text-sm font-medium text-muted">JSON 数据</label>
        <CodeEditor
          v-model="dataInput"
          language="json"
          :rows="18"
          placeholder="{ &quot;name&quot;: &quot;Alice&quot; }"
        />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">校验结果</label>
      <div
        v-if="report.status === 'invalid'"
        class="overflow-x-auto rounded-lg border border-default"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-elevated text-muted">
              <th class="px-3 py-2 text-left font-medium">
                Path
              </th>
              <th class="px-3 py-2 text-left font-medium">
                Keyword
              </th>
              <th class="px-3 py-2 text-left font-medium">
                Message
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in report.errors"
              :key="`${item.schemaPath}-${index}`"
              class="border-t border-default"
            >
              <td class="px-3 py-2 font-mono text-default">
                {{ errorPath(item) }}
              </td>
              <td class="px-3 py-2 font-mono text-default">
                {{ item.keyword }}
              </td>
              <td class="px-3 py-2 text-default">
                {{ errorMessage(item) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <CodeEditor
        :model-value="resultText"
        :language="resultLanguage"
        :rows="report.status === 'invalid' ? 8 : 5"
        placeholder="点击校验后显示结果"
        readonly
      />
    </div>
  </div>
</template>
