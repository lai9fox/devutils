<script setup lang="ts">
/**
 * YAML 格式化工具
 * 支持格式化、压缩、校验，以及 YAML / JSON 互转
 */
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const input = ref('')
const output = ref('')
const error = ref('')
const indentSize = ref(2)

function normalizedIndent(): number {
  const n = Number(indentSize.value)
  if (!Number.isFinite(n)) return 2
  return Math.min(8, Math.max(1, Math.trunc(n)))
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

function formatYaml() {
  clearError()
  if (!hasInput()) {
    return
  }

  try {
    const parsed = parseYaml(input.value)
    output.value = stringifyYaml(parsed, {
      indent: normalizedIndent(),
      lineWidth: 0,
      collectionStyle: 'block'
    }).trimEnd()
  } catch (cause) {
    setError('格式化失败', cause)
  }
}

function minifyYaml() {
  clearError()
  if (!hasInput()) {
    return
  }

  try {
    const parsed = parseYaml(input.value)
    output.value = stringifyYaml(parsed, {
      indent: normalizedIndent(),
      lineWidth: 0,
      collectionStyle: 'flow'
    }).trimEnd()
  } catch (cause) {
    setError('压缩失败', cause)
  }
}

function validateYaml() {
  clearError()
  if (!hasInput()) {
    return
  }

  try {
    parseYaml(input.value)
    output.value = '✓ YAML 格式正确'
  } catch (cause) {
    setError('格式校验失败', cause)
  }
}

function yamlToJson() {
  clearError()
  if (!hasInput()) {
    return
  }

  try {
    const parsed = parseYaml(input.value)
    output.value = JSON.stringify(parsed, null, normalizedIndent()) ?? 'null'
  } catch (cause) {
    setError('YAML 转 JSON 失败', cause)
  }
}

function jsonToYaml() {
  clearError()
  if (!hasInput()) {
    return
  }

  try {
    const parsed = JSON.parse(input.value)
    output.value = stringifyYaml(parsed, {
      indent: normalizedIndent(),
      lineWidth: 0,
      collectionStyle: 'block'
    }).trimEnd()
  } catch (cause) {
    setError('JSON 转 YAML 失败', cause)
  }
}

function switchValue() {
  const currentInput = input.value
  input.value = output.value
  output.value = currentInput
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
    <Note title="支持 YAML 格式化、压缩、校验，以及 YAML 与 JSON 双向转换。" />
    <Note
      color="info"
      title="格式化和互转会重新序列化内容，原始注释与引号风格不会保留。"
    />

    <ToolTextSplit>
      <template #input>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-muted">输入 YAML 或 JSON</label>
          <CodeEditor
            v-model="input"
            language="yaml"
            :rows="12"
            placeholder="name: DevUtils&#10;features:&#10;  - yaml&#10;  - json"
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
            @click="formatYaml"
          >
            格式化 YAML
          </UButton>
          <UButton
            icon="lucide:minimize-2"
            color="primary"
            @click="minifyYaml"
          >
            压缩 YAML
          </UButton>
          <UButton
            icon="lucide:circle-check"
            color="info"
            @click="validateYaml"
          >
            校验 YAML
          </UButton>
          <UButton
            icon="lucide:arrow-right-left"
            color="warning"
            @click="yamlToJson"
          >
            YAML 转 JSON
          </UButton>
          <UButton
            icon="lucide:repeat-2"
            color="neutral"
            @click="jsonToYaml"
          >
            JSON 转 YAML
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
            language="yaml"
            :rows="12"
            placeholder="格式化、压缩或转换结果"
            readonly
          />
        </div>
      </template>
    </ToolTextSplit>
  </div>
</template>
