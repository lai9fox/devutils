<script setup lang="ts">
/**
 * JWT 解码器
 * 解析 JWT Token 的 Header、Payload，展示过期时间
 */
import { jwtDecode } from 'jwt-decode'
import dayjs from 'dayjs'

const token = ref('')
const error = ref('')

interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

const decoded = ref<DecodedJwt | null>(null)

watch(token, (raw) => {
  error.value = ''
  decoded.value = null

  const trimmed = raw.trim().replace(/^Bearer\s+/i, '')
  if (!trimmed) return

  const parts = trimmed.split('.')
  if (parts.length !== 3) {
    error.value = 'JWT 格式无效：应包含三段由 "." 分隔的内容'
    return
  }

  try {
    const header = jwtDecode(trimmed, { header: true }) as Record<string, unknown>
    const payload = jwtDecode(trimmed) as Record<string, unknown>
    decoded.value = { header, payload, signature: parts[2]! }
  } catch (e) {
    error.value = `解码失败：${(e as Error).message}`
  }
}, { immediate: true })

const tokenStatus = computed(() => {
  if (!decoded.value) return null
  const payload = decoded.value.payload
  const exp = getNumericDate(payload.exp)
  const nbf = getNumericDate(payload.nbf)

  const now = Math.floor(Date.now() / 1000)

  if (exp !== null && exp < now) {
    return { label: '已过期', color: 'text-error', detail: `过期于 ${dayjs.unix(exp).format('YYYY-MM-DD HH:mm:ss')}` }
  }
  if (nbf !== null && nbf > now) {
    return { label: '未生效', color: 'text-warning', detail: `生效于 ${dayjs.unix(nbf).format('YYYY-MM-DD HH:mm:ss')}` }
  }
  if (exp !== null) {
    return { label: '有效', color: 'text-success', detail: `过期于 ${dayjs.unix(exp).format('YYYY-MM-DD HH:mm:ss')}` }
  }
  return { label: '无过期时间', color: 'text-muted', detail: '' }
})

const timeFields = computed(() => {
  if (!decoded.value) return []
  const payload = decoded.value.payload
  const fields: { key: string, label: string, time: string }[] = []
  const timeKeys: Record<string, string> = { iat: '签发时间', exp: '过期时间', nbf: '生效时间' }

  for (const [key, label] of Object.entries(timeKeys)) {
    const val = getNumericDate(payload[key])
    if (val !== null) {
      fields.push({ key, label, time: dayjs.unix(val).format('YYYY-MM-DD HH:mm:ss') })
    }
  }
  return fields
})

function getNumericDate(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function formatJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2)
}

function clear() {
  token.value = ''
}

function loadSample() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const now = Math.floor(Date.now() / 1000)
  const payload = btoa(JSON.stringify({
    sub: '1234567890',
    name: 'DevUtils User',
    iat: now,
    exp: now + 3600,
    role: 'admin'
  })).replace(/=/g, '')
  token.value = `${header}.${payload}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">JWT Token</label>
      <CodeEditor
        v-model="token"
        language="plain"
        :rows="4"
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
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
      <template v-if="tokenStatus">
        <span
          :class="['text-sm font-medium', tokenStatus.color]"
        >
          {{ tokenStatus.label }}
        </span>
        <span
          v-if="tokenStatus.detail"
          class="text-xs text-dimmed"
        >
          {{ tokenStatus.detail }}
        </span>
      </template>
    </div>

    <p
      v-if="error"
      class="text-sm text-error"
    >
      {{ error }}
    </p>

    <template v-if="decoded">
      <div
        v-if="timeFields.length"
        class="flex flex-wrap gap-4"
      >
        <div
          v-for="tf in timeFields"
          :key="tf.key"
          class="rounded-lg border border-default bg-elevated px-4 py-2"
        >
          <div class="text-xs text-dimmed">
            {{ tf.label }} ({{ tf.key }})
          </div>
          <div class="font-mono text-sm text-default">
            {{ tf.time }}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-muted">Header</label>
          <Copy
            size="xs"
            :text="formatJson(decoded.header)"
          />
        </div>
        <CodeEditor
          :model-value="formatJson(decoded.header)"
          language="json"
          :rows="6"
          readonly
        />
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-muted">Payload</label>
          <Copy
            size="xs"
            :text="formatJson(decoded.payload)"
          />
        </div>
        <CodeEditor
          :model-value="formatJson(decoded.payload)"
          language="json"
          :rows="8"
          readonly
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-muted">Signature</label>
        <CodeEditor
          :model-value="decoded.signature"
          language="plain"
          :rows="4"
          readonly
        />
      </div>
    </template>
  </div>
</template>
