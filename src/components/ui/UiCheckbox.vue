<script setup lang="ts">
import { ref, computed, useSlots } from 'vue'
import { Check, Minus } from '@lucide/vue'
import type { CheckboxSize } from './types'

export type { CheckboxSize }

const props = withDefaults(
  defineProps<{
    modelValue?: boolean | any[] | any
    value?: any
    trueValue?: any
    falseValue?: any
    disabled?: boolean
    indeterminate?: boolean
    size?: CheckboxSize
    label?: string
    description?: string
    id?: string
    name?: string
    title?: string
    checkboxClass?: string
  }>(),
  {
    modelValue: false,
    value: undefined,
    trueValue: true,
    falseValue: false,
    disabled: false,
    indeterminate: false,
    size: 'sm',
    label: '',
    description: '',
    id: undefined,
    name: undefined,
    title: undefined,
    checkboxClass: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any, event: Event]
}>()

const slots = useSlots()
const inputRef = ref<HTMLInputElement | null>(null)

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value)
  }
  return props.modelValue === props.trueValue
})

const hasLabel = computed(() => Boolean(props.label || slots.default))
const hasDescription = computed(() => Boolean(props.description || slots.description))

const sizeConfig: Record<
  CheckboxSize,
  {
    container: string
    box: string
    icon: string
    label: string
    description: string
  }
> = {
  sm: {
    container: 'gap-1.5 text-xs',
    box: 'w-4 h-4 rounded-[5px]',
    icon: 'w-3 h-3 stroke-[2.5]',
    label: 'text-xs leading-4 select-none',
    description: 'text-[11px] select-none'
  },
  md: {
    container: 'gap-2 text-sm',
    box: 'w-5 h-5 rounded-md',
    icon: 'w-3.5 h-3.5 stroke-[2.5]',
    label: 'text-sm leading-5 select-none',
    description: 'text-xs select-none'
  }
}

const computedBoxClasses = computed(() => [
  'inline-flex items-center justify-center border shrink-0 transition-all duration-150 group-active:scale-95 select-none shadow-2xs',
  sizeConfig[props.size].box,
  props.indeterminate || isChecked.value
    ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500'
    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400 dark:group-hover:border-zinc-600',
  'peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 dark:peer-focus-visible:ring-emerald-400 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-zinc-950',
  props.disabled && 'opacity-50 cursor-not-allowed',
  props.checkboxClass
])

function handleChange(e: Event) {
  if (props.disabled) return

  let newValue: any
  if (Array.isArray(props.modelValue)) {
    const list = [...props.modelValue]
    const index = list.indexOf(props.value)
    if (index > -1) {
      list.splice(index, 1)
    } else {
      list.push(props.value)
    }
    newValue = list
  } else {
    newValue = isChecked.value ? props.falseValue : props.trueValue
  }

  emit('update:modelValue', newValue)
  emit('change', newValue, e)
}

defineExpose({
  inputRef,
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur()
})
</script>

<template>
  <label
    :for="id"
    :title="title"
    :class="[
      'group inline-flex cursor-pointer transition-colors select-none',
      hasDescription ? 'items-start' : 'items-center',
      sizeConfig[size].container,
      disabled ? 'pointer-events-none cursor-not-allowed opacity-50' : ''
    ]"
  >
    <div
      class="relative inline-flex shrink-0 items-center justify-center"
      :class="hasDescription ? 'mt-0.5' : ''"
    >
      <input
        :id="id"
        ref="inputRef"
        type="checkbox"
        :name="name"
        :checked="isChecked"
        :disabled="disabled"
        class="peer sr-only"
        @change="handleChange"
      />
      <div :class="computedBoxClasses" aria-hidden="true">
        <Minus v-if="indeterminate" :class="sizeConfig[size].icon" />
        <Check v-else-if="isChecked" :class="sizeConfig[size].icon" />
      </div>
    </div>

    <div v-if="hasLabel || hasDescription" class="inline-flex min-w-0 flex-col">
      <span
        v-if="hasLabel"
        :class="[
          'font-medium text-zinc-700 transition-colors group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100',
          sizeConfig[size].label
        ]"
      >
        <slot>{{ label }}</slot>
      </span>

      <span
        v-if="hasDescription"
        :class="[
          'mt-1 leading-normal text-zinc-500 dark:text-zinc-400',
          sizeConfig[size].description
        ]"
      >
        <slot name="description">{{ description }}</slot>
      </span>
    </div>
  </label>
</template>
