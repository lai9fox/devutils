<script setup lang="ts">
/**
 * Base64 编解码工具
 * 支持文本的 Base64 编码与解码
 */
const input = ref('')
const output = ref('')
const error = ref('')
type Base64Variant = 'standard' | 'url-safe'
const variant = ref<Base64Variant>('standard')

function toUrlSafeBase64(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function normalizeBase64Input(value: string): string {
  const normalized = value.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (!normalized || normalized.length % 4 === 1 || /[^A-Za-z0-9+/=]/.test(normalized)) {
    throw new Error('请输入有效的 Base64 文本')
  }
  const firstPad = normalized.indexOf('=')
  if (firstPad !== -1 && !/^=+$/.test(normalized.slice(firstPad))) {
    throw new Error('Base64 填充符位置无效')
  }
  return normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
}

function encode() {
  error.value = ''
  if (!input.value) {
    output.value = ''
    return
  }
  try {
    const bytes = new TextEncoder().encode(input.value)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!)
    }
    const encoded = btoa(binary)
    output.value = variant.value === 'url-safe' ? toUrlSafeBase64(encoded) : encoded
  } catch (e) {
    error.value = `编码失败：${(e as Error).message}`
    output.value = ''
  }
}

function decode() {
  error.value = ''
  if (!input.value) {
    output.value = ''
    return
  }
  try {
    const binary = atob(normalizeBase64Input(input.value))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    output.value = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch (e) {
    error.value = `解码失败：${(e as Error).message}`
    output.value = ''
  }
}

function switchValue() {
  const temp = input.value
  input.value = output.value
  output.value = temp
  error.value = ''
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
          <label class="text-sm font-medium text-muted">输入</label>
          <UTextarea
            v-model="input"
            :rows="8"
            placeholder="输入要编码或解码的文本..."
          />
        </div>
      </template>

      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <SegmentControl
            v-model="variant"
            :options="[
              { label: '标准', value: 'standard' as Base64Variant },
              { label: 'URL-safe', value: 'url-safe' as Base64Variant }
            ]"
          />
          <UButton
            icon="lucide:arrow-down-to-line"
            color="success"
            @click="encode"
          >
            编码
          </UButton>
          <UButton
            icon="lucide:arrow-up-from-line"
            color="warning"
            @click="decode"
          >
            解码
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
          <UTextarea
            v-model="output"
            :rows="8"
            placeholder="结果将显示在这里"
            readonly
            class="font-mono"
          />
        </div>
      </template>
    </ToolTextSplit>
  </div>
</template>
