<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { Copy, Check } from '@lucide/vue'
import UiButton, { type ButtonSize, type ButtonVariant } from './UiButton.vue'

const props = withDefaults(
  defineProps<{
    text: string | (() => string | Promise<string>)
    label?: string
    copiedLabel?: string
    size?: ButtonSize
    variant?: ButtonVariant
    timeout?: number
    title?: string
  }>(),
  {
    label: '复制',
    copiedLabel: '已复制',
    size: 'sm',
    variant: 'secondary',
    timeout: 2000,
    title: undefined,
  }
)

const emit = defineEmits<{
  copy: [text: string]
}>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function handleCopy() {
  let content = ''
  if (typeof props.text === 'function') {
    content = await props.text()
  } else {
    content = props.text
  }
  if (!content) return

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(content)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    copied.value = true
    emit('copy', content)

    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      copied.value = false
    }, props.timeout)
  } catch (err) {
    console.error('Failed to copy to clipboard', err)
  }
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <UiButton
    :variant="copied ? 'success' : variant"
    :size="size"
    :title="title || (copied ? copiedLabel : label)"
    @click="handleCopy"
  >
    <template #prefix>
      <Check
        v-if="copied"
        class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
      />
      <Copy
        v-else
        class="w-3.5 h-3.5 shrink-0"
      />
    </template>
    <span v-if="label">{{ copied ? copiedLabel : label }}</span>
  </UiButton>
</template>
