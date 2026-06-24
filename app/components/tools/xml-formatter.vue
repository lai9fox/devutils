<script setup lang="ts">
/**
 * XML 格式化工具
 * 支持格式化、压缩、校验，以及 XML 转 JSON
 */
import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser'

interface ValidationError {
  err?: {
    code?: string
    msg?: string
    line?: number
    col?: number
  }
}

const input = ref(`<?xml version="1.0" encoding="UTF-8"?>
<project name="DevUtils">
  <!-- local tools -->
  <tool id="xml-formatter">
    <![CDATA[format <xml> safely]]>
  </tool>
</project>`)
const output = ref('')
const error = ref('')
const indentSize = ref(2)

function normalizedIndent(): number {
  const n = Number(indentSize.value)
  if (!Number.isFinite(n)) return 2
  return Math.min(8, Math.max(1, Math.trunc(n)))
}

function indentBy(): string {
  return ' '.repeat(normalizedIndent())
}

const preserveXmlOptions = computed(() => ({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  commentPropName: '#comment',
  cdataPropName: '#cdata',
  preserveOrder: true,
  allowBooleanAttributes: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false
}))

const jsonXmlOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  commentPropName: '#comment',
  cdataPropName: '#cdata',
  allowBooleanAttributes: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false
}

function clearError() {
  error.value = ''
}

function hasInput(): boolean {
  if (!input.value.trim()) {
    output.value = ''
    return false
  }
  return true
}

function setError(prefix: string, cause: unknown) {
  output.value = ''
  error.value = `${prefix}：${(cause as Error).message}`
}

function validateRawXml(): true | string {
  const result = XMLValidator.validate(input.value, { allowBooleanAttributes: true })
  if (result === true) return true

  const err = (result as ValidationError).err
  const position = err?.line ? `（${err.line}:${err.col ?? 1}）` : ''
  return `${err?.msg ?? 'XML 格式无效'}${position}`
}

function parsePreservedXml() {
  const parser = new XMLParser(preserveXmlOptions.value)
  return parser.parse(input.value)
}

function formatXml() {
  clearError()
  if (!hasInput()) return

  try {
    const validation = validateRawXml()
    if (validation !== true) throw new Error(validation)

    const parsed = parsePreservedXml()
    const builder = new XMLBuilder({
      ...preserveXmlOptions.value,
      format: true,
      indentBy: indentBy()
    })
    output.value = builder.build(parsed).trim()
  } catch (cause) {
    setError('格式化失败', cause)
  }
}

function minifyXml() {
  clearError()
  if (!hasInput()) return

  try {
    const validation = validateRawXml()
    if (validation !== true) throw new Error(validation)

    const parsed = parsePreservedXml()
    const builder = new XMLBuilder({
      ...preserveXmlOptions.value,
      format: false,
      suppressEmptyNode: false
    })
    output.value = builder.build(parsed).trim()
  } catch (cause) {
    setError('压缩失败', cause)
  }
}

function validateXml() {
  clearError()
  if (!hasInput()) return

  const validation = validateRawXml()
  if (validation === true) {
    output.value = '✓ XML 格式正确'
  } else {
    output.value = ''
    error.value = `格式校验失败：${validation}`
  }
}

function xmlToJson() {
  clearError()
  if (!hasInput()) return

  try {
    const validation = validateRawXml()
    if (validation !== true) throw new Error(validation)

    const parser = new XMLParser(jsonXmlOptions)
    const parsed = parser.parse(input.value)
    output.value = JSON.stringify(parsed, null, normalizedIndent())
  } catch (cause) {
    setError('XML 转 JSON 失败', cause)
  }
}

function switchValue() {
  const currentInput = input.value
  input.value = output.value
  output.value = currentInput
  clearError()
}

function loadSample() {
  input.value = `<?xml version="1.0" encoding="UTF-8"?>
<project name="DevUtils">
  <!-- local tools -->
  <tool id="xml-formatter">
    <![CDATA[format <xml> safely]]>
  </tool>
</project>`
  output.value = ''
  clearError()
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="支持 XML 格式化、压缩、校验，以及 XML 转 JSON。所有内容都在浏览器本地处理。" />
    <Note
      color="info"
      title="格式化会重新序列化 XML，并尽量保留属性、注释和 CDATA。"
    />

    <ToolTextSplit>
      <template #input>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-muted">输入 XML</label>
          <CodeEditor
            v-model="input"
            language="xml"
            :rows="14"
            placeholder="&lt;root&gt;&lt;item id=&quot;1&quot;&gt;DevUtils&lt;/item&gt;&lt;/root&gt;"
          />
        </div>
      </template>

      <template #actions>
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
            <span class="text-xs text-dimmed">空格</span>
          </div>
          <UButton
            icon="lucide:align-justify"
            color="success"
            @click="formatXml"
          >
            格式化
          </UButton>
          <UButton
            icon="lucide:minimize-2"
            color="primary"
            @click="minifyXml"
          >
            压缩
          </UButton>
          <UButton
            icon="lucide:circle-check"
            color="info"
            @click="validateXml"
          >
            校验
          </UButton>
          <UButton
            icon="lucide:braces"
            color="warning"
            @click="xmlToJson"
          >
            XML 转 JSON
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
            icon="lucide:arrow-up-down"
            color="secondary"
            @click="switchValue"
          >
            交换
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
      </template>

      <template #output>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-muted">
            输出
            <span
              v-if="error"
              class="text-sm text-error"
            >
              {{ error }}
            </span>
          </label>
          <CodeEditor
            v-model="output"
            language="xml"
            :rows="14"
            placeholder="格式化、压缩、校验或转换结果"
            readonly
          />
        </div>
      </template>
    </ToolTextSplit>
  </div>
</template>
