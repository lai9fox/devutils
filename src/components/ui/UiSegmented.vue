<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { SegmentedOption, SegmentedItem } from './types'

export type { SegmentedOption, SegmentedItem }

const props = withDefaults(
  defineProps<{
    modelValue: any
    options: SegmentedItem[]
    size?: 'xs' | 'sm'
    uppercase?: boolean
  }>(),
  {
    size: 'sm',
    uppercase: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any]
}>()

const normalizedOptions = computed(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'string') {
      return {
        label: opt,
        value: opt
      } as SegmentedOption
    }
    return opt
  })
})

const sizeClasses = {
  xs: 'h-5 px-2 text-[11px] rounded',
  sm: 'h-6 px-3 text-xs rounded-md'
}

const rootRef = ref<HTMLElement | null>(null)
const itemRefs = ref<HTMLElement[]>([])
const indicatorStyle = ref<Record<string, string>>({})
const indicatorReady = ref(false)
const isAnimated = ref(false)

const activeIndex = computed(() => {
  return normalizedOptions.value.findIndex((item) => item.value === props.modelValue)
})

function setItemRef(el: any, index: number) {
  if (el) {
    itemRefs.value[index] = el as HTMLElement
  }
}

function updateIndicator() {
  const index = activeIndex.value
  if (index === -1 || !itemRefs.value[index]) {
    indicatorStyle.value = {
      opacity: '0',
      visibility: 'hidden'
    }
    return
  }

  const el = itemRefs.value[index]
  indicatorStyle.value = {
    opacity: '1',
    visibility: 'visible',
    transform: `translate3d(${el.offsetLeft}px, ${el.offsetTop}px, 0)`,
    width: `${el.offsetWidth}px`,
    height: `${el.offsetHeight}px`
  }
}

function handleSelect(val: any) {
  if (val === props.modelValue) return
  emit('update:modelValue', val)
  emit('change', val)
}

watch(activeIndex, () => {
  nextTick(updateIndicator)
})

watch(
  () => props.options,
  () => {
    nextTick(updateIndicator)
  },
  { deep: true }
)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    updateIndicator()
    indicatorReady.value = true
    requestAnimationFrame(() => {
      isAnimated.value = true
    })
  })

  if (typeof window !== 'undefined' && 'ResizeObserver' in window && rootRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateIndicator()
    })
    resizeObserver.observe(rootRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative box-border inline-flex shrink-0 items-center rounded-lg bg-zinc-100 p-1 whitespace-nowrap select-none dark:bg-zinc-800"
    :class="size === 'xs' ? 'h-7' : 'h-8'"
  >
    <!-- 滑动背景指示器 -->
    <div
      v-show="indicatorReady"
      class="pointer-events-none absolute top-0 left-0 bg-white shadow-xs will-change-[transform,width] dark:bg-zinc-700"
      :class="[
        size === 'xs' ? 'rounded' : 'rounded-md',
        isAnimated
          ? 'transition-[transform,width,height,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]'
          : 'transition-none'
      ]"
      :style="indicatorStyle"
    />

    <!-- 选项按钮 -->
    <button
      v-for="(item, index) in normalizedOptions"
      :key="String(item.value)"
      :ref="(el) => setItemRef(el, index)"
      type="button"
      :class="[
        'relative z-10 inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-all duration-150 select-none active:scale-95',
        sizeClasses[size],
        uppercase ? 'uppercase' : '',
        modelValue === item.value
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200',
        !indicatorReady && modelValue === item.value ? 'bg-white shadow-xs dark:bg-zinc-700' : ''
      ]"
      @click="handleSelect(item.value)"
    >
      <component :is="item.icon" v-if="item.icon" class="h-3.5 w-3.5 shrink-0" />
      <span class="whitespace-nowrap">{{ item.label }}</span>
    </button>
  </div>
</template>
