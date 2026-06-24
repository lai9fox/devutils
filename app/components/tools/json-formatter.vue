<script setup lang="ts">
/**
 * JSON 格式化工具
 * 支持格式化、压缩、校验 JSON
 */

const input = ref('')
const output = ref('')
const error = ref('')
const indentSize = ref(2)

function normalizedIndent(): number {
  const n = Number(indentSize.value)
  if (!Number.isFinite(n)) return 2
  return Math.min(8, Math.max(1, Math.trunc(n)))
}

function format() {
  error.value = ''
  if (!input.value.trim()) {
    output.value = ''
    return
  }
  try {
    const parsed = JSON.parse(input.value)
    output.value = JSON.stringify(parsed, null, normalizedIndent())
  } catch (e) {
    output.value = ''
    error.value = `格式化失败：${(e as Error).message}`
  }
}

function minify() {
  error.value = ''
  if (!input.value.trim()) {
    output.value = ''
    return
  }
  try {
    const parsed = JSON.parse(input.value)
    output.value = JSON.stringify(parsed)
  } catch (e) {
    output.value = ''
    error.value = `压缩失败：${(e as Error).message}`
  }
}

function validate() {
  error.value = ''
  if (!input.value.trim()) {
    return
  }
  try {
    JSON.parse(input.value)
    output.value = '✓ JSON 格式正确'
  } catch (e) {
    output.value = ''
    error.value = `格式校验失败：${(e as Error).message}`
  }
}

function switchValue() {
  const temp = input.value
  input.value = output.value
  output.value = temp
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <ToolTextSplit>
      <template #input>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-muted">输入 JSON</label>
          <CodeEditor
            v-model="input"
            language="json"
            :rows="12"
            placeholder="{&quot;key&quot;: &quot;value&quot;, &quot;array&quot;: [1, 2, 3]}"
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
            @click="format"
          >
            格式化
          </UButton>
          <UButton
            icon="lucide:minimize-2"
            color="primary"
            @click="minify"
          >
            压缩
          </UButton>
          <UButton
            icon="lucide:circle-check"
            color="info"
            @click="validate"
          >
            校验
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
            language="json"
            :rows="12"
            placeholder="格式化或压缩结果"
            readonly
          />
        </div>
      </template>
    </ToolTextSplit>
  </div>
</template>
