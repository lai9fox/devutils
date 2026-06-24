<template>
  <UButton
    variant="ghost"
    :color="copied ? 'success' : 'primary'"
    :icon="copied ? 'lucide:check' : 'lucide:copy'"
    :disabled="!text"
    v-bind="$attrs"
    @click="copyText"
  >
    {{ copied ? '复制成功' : '复制结果' }}
  </UButton>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const props = defineProps<{
  text: string
}>()

const { copy, copied } = useClipboard()

function copyText() {
  if (props.text) copy(props.text)
}
</script>
