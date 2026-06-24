<script setup lang="ts">
/**
 * Data URI 编解码工具
 * 将文本或文件编码为 Data URI，并解析 Data URI 内容
 */
type EncodeSource = 'text' | 'file'

interface DecodedDataUri {
  mimeType: string
  base64: boolean
  bytes: Uint8Array
  textPreview: string
  imagePreview: string
}

const source = ref<EncodeSource>('text')
const textInput = ref('Hello DevUtils')
const mimeType = ref('text/plain;charset=utf-8')
const useBase64 = ref(true)
const selectedFile = ref<File | null>(null)
const encodedOutput = ref('')
const decodeInput = ref('')
const decoded = ref<DecodedDataUri | null>(null)
const encodeError = ref('')
const decodeError = ref('')

function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const normalized = value.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (!normalized || normalized.length % 4 === 1 || /[^A-Za-z0-9+/=]/.test(normalized)) {
    throw new Error('Base64 数据无效')
  }
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function bytesToPercentEncoded(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => {
      const char = String.fromCharCode(byte)
      if (/^[A-Za-z0-9\-_.!~*'()]$/.test(char)) return char
      return `%${byte.toString(16).toUpperCase().padStart(2, '0')}`
    })
    .join('')
}

function percentEncodedToBytes(value: string): Uint8Array {
  const bytes: number[] = []
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]!
    if (ch === '%') {
      const hex = value.slice(i + 1, i + 3)
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
        throw new Error('百分号编码无效')
      }
      bytes.push(Number.parseInt(hex, 16))
      i += 2
    } else {
      bytes.push(...new TextEncoder().encode(ch))
    }
  }
  return new Uint8Array(bytes)
}

async function encodeDataUri() {
  encodeError.value = ''
  encodedOutput.value = ''

  try {
    let bytes: Uint8Array
    let type = mimeType.value.trim()

    if (source.value === 'file') {
      if (!selectedFile.value) {
        encodeError.value = '请选择文件'
        return
      }
      bytes = new Uint8Array(await selectedFile.value.arrayBuffer())
      type = type || selectedFile.value.type || 'application/octet-stream'
    } else {
      bytes = new TextEncoder().encode(textInput.value)
      type = type || 'text/plain;charset=utf-8'
    }

    const payload = useBase64.value ? bytesToBase64(bytes) : bytesToPercentEncoded(bytes)
    encodedOutput.value = `data:${type}${useBase64.value ? ';base64' : ''},${payload}`
  } catch (cause) {
    encodeError.value = `编码失败：${(cause as Error).message}`
  }
}

function decodeDataUri() {
  decodeError.value = ''
  decoded.value = null
  const raw = decodeInput.value.trim()
  if (!raw) return

  try {
    const match = raw.match(/^data:([^,]*),(.*)$/s)
    if (!match) throw new Error('请输入 data:[mime][;base64],... 格式')

    const metadata = match[1] ?? ''
    const data = match[2] ?? ''
    const parts = metadata.split(';').filter(Boolean)
    const base64 = parts.some(part => part.toLocaleLowerCase() === 'base64')
    const mime = parts.find(part => part.toLocaleLowerCase() !== 'base64') || 'text/plain;charset=US-ASCII'
    const bytes = base64 ? base64ToBytes(data) : percentEncodedToBytes(data)
    const textLike = /^(text\/|application\/(json|xml|javascript)|image\/svg\+xml)/i.test(mime)
    const imageLike = /^image\//i.test(mime)

    decoded.value = {
      mimeType: mime,
      base64,
      bytes,
      textPreview: textLike ? new TextDecoder().decode(bytes) : '',
      imagePreview: imageLike ? raw : ''
    }
  } catch (cause) {
    decodeError.value = `解码失败：${(cause as Error).message}`
  }
}

function useEncodedAsInput() {
  decodeInput.value = encodedOutput.value
  decodeDataUri()
}

function clear() {
  textInput.value = ''
  selectedFile.value = null
  encodedOutput.value = ''
  decodeInput.value = ''
  decoded.value = null
  encodeError.value = ''
  decodeError.value = ''
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="Data URI 会把内容直接嵌入 URL，适合小图标、样式片段或测试数据；大文件会生成很长的字符串。" />

    <div class="flex flex-col gap-4 rounded-lg border border-default bg-elevated p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium text-muted">编码</span>
          <SegmentControl
            v-model="source"
            :options="[
              { label: '文本', value: 'text' as EncodeSource },
              { label: '文件', value: 'file' as EncodeSource }
            ]"
          />
          <UCheckbox
            v-model="useBase64"
            label="Base64"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UButton
            icon="lucide:play"
            color="success"
            @click="encodeDataUri"
          >
            编码
          </UButton>
          <UButton
            icon="lucide:arrow-down"
            variant="ghost"
            color="secondary"
            :disabled="!encodedOutput"
            @click="useEncodedAsInput"
          >
            用作解码输入
          </UButton>
          <UButton
            variant="ghost"
            color="error"
            icon="lucide:trash-2"
            @click="clear"
          >
            清空
          </UButton>
          <Copy :text="encodedOutput" />
        </div>
      </div>

      <p
        v-if="encodeError"
        class="text-sm text-error"
      >
        {{ encodeError }}
      </p>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-3">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-muted">MIME Type</label>
            <UInput
              v-model="mimeType"
              placeholder="text/plain;charset=utf-8"
              class="font-mono"
            />
          </div>

          <div
            v-if="source === 'text'"
            class="flex flex-col gap-2"
          >
            <label class="text-sm font-medium text-muted">文本内容</label>
            <UTextarea
              v-model="textInput"
              :rows="8"
              placeholder="输入要编码的文本"
              class="w-full"
            />
          </div>

          <div
            v-else
            class="flex flex-col gap-2"
          >
            <label class="text-sm font-medium text-muted">选择文件</label>
            <UFileUpload
              v-model="selectedFile"
              variant="area"
              label="选择文件编码为 Data URI"
              description="所有内容只在本地浏览器处理"
              layout="list"
              icon="lucide:upload"
            />
          </div>
        </div>

        <div class="flex min-w-0 flex-col gap-2">
          <label class="text-sm font-medium text-muted">Data URI 编码结果</label>
          <CodeEditor
            :model-value="encodedOutput"
            language="plain"
            :rows="12"
            placeholder="Data URI 编码结果"
            readonly
          />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-4 rounded-lg border border-default bg-elevated p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <span class="text-sm font-medium text-muted">解码</span>
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            icon="lucide:package-open"
            color="warning"
            @click="decodeDataUri"
          >
            解码
          </UButton>
          <Copy :text="decoded?.textPreview ?? ''" />
        </div>
      </div>

      <p
        v-if="decodeError"
        class="text-sm text-error"
      >
        {{ decodeError }}
      </p>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-2">
          <label class="text-sm font-medium text-muted">Data URI 输入</label>
          <CodeEditor
            v-model="decodeInput"
            language="plain"
            :rows="12"
            placeholder="data:text/plain;base64,SGVsbG8="
          />
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <label class="text-sm font-medium text-muted">解码结果</label>
          <template v-if="decoded">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
              <div class="rounded-lg border border-default bg-default p-3">
                <div class="text-xs text-dimmed">
                  MIME
                </div>
                <div class="font-mono text-sm text-default break-all">
                  {{ decoded.mimeType }}
                </div>
              </div>
              <div class="rounded-lg border border-default bg-default p-3">
                <div class="text-xs text-dimmed">
                  编码
                </div>
                <div class="font-mono text-sm text-default">
                  {{ decoded.base64 ? 'base64' : 'percent-encoded' }}
                </div>
              </div>
              <div class="rounded-lg border border-default bg-default p-3">
                <div class="text-xs text-dimmed">
                  大小
                </div>
                <div class="font-mono text-sm text-default">
                  {{ formatBytes(decoded.bytes.length) }}
                </div>
              </div>
            </div>

            <img
              v-if="decoded.imagePreview"
              :src="decoded.imagePreview"
              alt="Data URI preview"
              class="max-h-72 max-w-full rounded-lg border border-default object-contain"
            >

            <CodeEditor
              v-if="decoded.textPreview"
              :model-value="decoded.textPreview"
              language="plain"
              :rows="8"
              readonly
            />
          </template>
          <div
            v-else
            class="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-default bg-default px-4 text-sm text-dimmed"
          >
            暂无结果
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
