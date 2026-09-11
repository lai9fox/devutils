<script setup lang="ts">
import UiSplitPane from '../ui/UiSplitPane.vue'
import type { SplitPaneProps } from '../ui/types'

const props = defineProps<SplitPaneProps>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'resize', value: number): void
  (e: 'reset'): void
}>()
</script>

<template>
  <UiSplitPane
    v-bind="props"
    @update:model-value="emit('update:modelValue', $event)"
    @resize="emit('resize', $event)"
    @reset="emit('reset')"
  >
    <template #left="slotProps">
      <slot name="left" v-bind="slotProps" />
    </template>
    <template #handle="slotProps">
      <slot name="handle" v-bind="slotProps" />
    </template>
    <template #right="slotProps">
      <slot name="right" v-bind="slotProps" />
    </template>
  </UiSplitPane>
</template>
