<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    class?: string
  }>(),
  {
    modelValue: 2,
    min: 1,
    max: 8,
    step: 1,
    disabled: false,
    class: '',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [value: number]
}>()

const percentage = computed(() => {
  const min = props.min
  const max = props.max
  const val = Math.min(Math.max(props.modelValue ?? min, min), max)
  if (max === min) return 0
  return ((val - min) / (max - min)) * 100
})

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  const val = Number(target.value)
  emit('update:modelValue', val)
}

function handleChange(e: Event) {
  const target = e.target as HTMLInputElement
  const val = Number(target.value)
  emit('change', val)
}
</script>

<template>
  <div :class="['relative inline-flex items-center select-none', disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '', props.class]">
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :disabled="disabled"
      :style="{
        background: `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, currentColor ${percentage}%, currentColor 100%)`,
      }"
      class="ui-slider-input w-full h-1.5 rounded-full appearance-none cursor-pointer text-zinc-200 dark:text-zinc-700"
      @input="handleInput"
      @change="handleChange"
    />
  </div>
</template>

<style scoped>
.ui-slider-input::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

:global(.dark) .ui-slider-input::-webkit-slider-thumb {
  background: #34d399;
  border-color: #18181b;
}

.ui-slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.18);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.ui-slider-input::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

.ui-slider-input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

:global(.dark) .ui-slider-input::-moz-range-thumb {
  background: #34d399;
  border-color: #18181b;
}

.ui-slider-input::-moz-range-thumb:hover {
  transform: scale(1.18);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}
</style>
