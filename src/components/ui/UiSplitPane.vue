<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { SplitPaneProps } from './types'

const props = withDefaults(defineProps<SplitPaneProps>(), {
  modelValue: undefined,
  defaultPercent: 50,
  minPercent: 20,
  maxPercent: 80,
  breakpoint: 'lg',
  disabled: false,
  leftClass: '',
  rightClass: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'resize', value: number): void
  (e: 'reset'): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const isDesktop = ref(true)

const splitPercent = ref(props.modelValue ?? props.defaultPercent)

watch(
  () => props.modelValue,
  (val) => {
    if (typeof val === 'number' && val !== splitPercent.value) {
      splitPercent.value = Math.min(props.maxPercent, Math.max(props.minPercent, val))
    }
  }
)

watch(
  () => props.defaultPercent,
  (val) => {
    if (props.modelValue === undefined) {
      splitPercent.value = Math.min(props.maxPercent, Math.max(props.minPercent, val))
    }
  }
)

const breakpointPxMap: Record<string, number> = {
  none: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
}

function updateIsDesktop() {
  if (typeof window !== 'undefined') {
    const minWidth = breakpointPxMap[props.breakpoint] ?? 1024
    isDesktop.value = minWidth === 0 || window.innerWidth >= minWidth
  }
}

function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e && e.touches.length > 0) {
    return e.touches[0].clientX
  }
  return (e as MouseEvent).clientX
}

function startResize(e: MouseEvent | TouchEvent) {
  if (props.disabled || !isDesktop.value) return
  e.preventDefault()
  isDragging.value = true

  if (typeof document !== 'undefined') {
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const onPointerMove = (moveEvent: MouseEvent | TouchEvent) => {
    if ('cancelable' in moveEvent && moveEvent.cancelable) {
      moveEvent.preventDefault()
    }
    if (!containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    if (rect.width <= 0) return
    const clientX = getClientX(moveEvent)
    const offsetX = clientX - rect.left
    const percent = (offsetX / rect.width) * 100
    const clamped = Math.min(
      props.maxPercent,
      Math.max(props.minPercent, Math.round(percent * 10) / 10)
    )
    splitPercent.value = clamped
    emit('update:modelValue', clamped)
    emit('resize', clamped)
  }

  const onPointerUp = () => {
    isDragging.value = false
    if (typeof document !== 'undefined') {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.removeEventListener('mousemove', onPointerMove)
    window.removeEventListener('mouseup', onPointerUp)
    window.removeEventListener('touchmove', onPointerMove)
    window.removeEventListener('touchend', onPointerUp)
  }

  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('mouseup', onPointerUp)
  window.addEventListener('touchmove', onPointerMove, { passive: false })
  window.addEventListener('touchend', onPointerUp)
}

function handleReset() {
  if (props.disabled) return
  splitPercent.value = props.defaultPercent
  emit('update:modelValue', props.defaultPercent)
  emit('resize', props.defaultPercent)
  emit('reset')
}

function handleKeyDown(e: KeyboardEvent) {
  if (props.disabled || !isDesktop.value) return
  let step = 0
  if (e.key === 'ArrowLeft') step = -2
  else if (e.key === 'ArrowRight') step = 2
  else if (e.key === 'Home') {
    splitPercent.value = props.minPercent
    e.preventDefault()
    emit('update:modelValue', splitPercent.value)
    emit('resize', splitPercent.value)
    return
  } else if (e.key === 'End') {
    splitPercent.value = props.maxPercent
    e.preventDefault()
    emit('update:modelValue', splitPercent.value)
    emit('resize', splitPercent.value)
    return
  } else if (e.key === 'Enter') {
    handleReset()
    e.preventDefault()
    return
  }

  if (step !== 0) {
    e.preventDefault()
    const target = Math.min(
      props.maxPercent,
      Math.max(props.minPercent, Math.round((splitPercent.value + step) * 10) / 10)
    )
    splitPercent.value = target
    emit('update:modelValue', target)
    emit('resize', target)
  }
}

onMounted(() => {
  updateIsDesktop()
  window.addEventListener('resize', updateIsDesktop)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateIsDesktop)
  }
  if (typeof document !== 'undefined') {
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="flex min-h-0 w-full min-w-0 flex-1 flex-col"
    :class="[
      breakpoint === 'md'
        ? 'md:flex-row md:gap-0'
        : breakpoint === 'sm'
          ? 'sm:flex-row sm:gap-0'
          : breakpoint === 'xl'
            ? 'xl:flex-row xl:gap-0'
            : breakpoint === 'none'
              ? 'flex-row gap-0'
              : 'lg:flex-row lg:gap-0',
      'gap-2.5',
      { 'select-none': isDragging }
    ]"
  >
    <!-- 左侧面板：小屏堆叠态平分剩余高度 (flex-1)，桌面态按百分比定宽 -->
    <div
      class="flex min-h-[160px] min-w-0 flex-1 flex-col"
      :class="[
        breakpoint === 'md'
          ? 'md:h-full md:min-h-0 md:flex-none'
          : breakpoint === 'sm'
            ? 'sm:h-full sm:min-h-0 sm:flex-none'
            : breakpoint === 'xl'
              ? 'xl:h-full xl:min-h-0 xl:flex-none'
              : breakpoint === 'none'
                ? 'h-full min-h-0 flex-none'
                : 'lg:h-full lg:min-h-0 lg:flex-none',
        { 'pointer-events-none select-none': isDragging },
        leftClass
      ]"
      :style="isDesktop ? { width: `calc(${splitPercent}% - 5px)` } : {}"
    >
      <slot name="left" :percent="splitPercent" />
    </div>

    <!-- 拖拽手柄 -->
    <div
      class="group relative z-10 w-2.5 shrink-0 items-center justify-center transition-colors select-none"
      :class="[
        breakpoint === 'md'
          ? 'hidden md:flex'
          : breakpoint === 'sm'
            ? 'hidden sm:flex'
            : breakpoint === 'xl'
              ? 'hidden xl:flex'
              : breakpoint === 'none'
                ? 'flex'
                : 'hidden lg:flex',
        disabled
          ? 'cursor-default'
          : 'cursor-col-resize hover:bg-emerald-500/10 active:bg-emerald-500/20',
        isDragging ? 'bg-emerald-500/20' : ''
      ]"
      role="separator"
      aria-orientation="vertical"
      :aria-valuenow="splitPercent"
      :aria-valuemin="minPercent"
      :aria-valuemax="maxPercent"
      tabindex="0"
      :title="disabled ? undefined : `拖拽调整两栏宽度 (双击恢复 ${defaultPercent}% 比例)`"
      @mousedown="startResize"
      @touchstart="startResize"
      @dblclick="handleReset"
      @keydown="handleKeyDown"
    >
      <slot name="handle" :is-dragging="isDragging">
        <div
          class="h-8 w-1 rounded-full bg-zinc-300 transition-all dark:bg-zinc-700"
          :class="[
            disabled ? '' : 'group-hover:bg-emerald-500 group-active:bg-emerald-500',
            isDragging ? 'h-12 bg-emerald-500' : ''
          ]"
        />
      </slot>
    </div>

    <!-- 右侧面板：小屏堆叠态平分剩余高度 (flex-1) -->
    <div
      class="flex min-h-[160px] min-w-0 flex-1 flex-col"
      :class="[
        breakpoint === 'md'
          ? 'md:h-full md:min-h-0'
          : breakpoint === 'sm'
            ? 'sm:h-full sm:min-h-0'
            : breakpoint === 'xl'
              ? 'xl:h-full xl:min-h-0'
              : breakpoint === 'none'
                ? 'h-full min-h-0'
                : 'lg:h-full lg:min-h-0',
        { 'pointer-events-none select-none': isDragging },
        rightClass
      ]"
    >
      <slot name="right" :percent="100 - splitPercent" />
    </div>
  </div>
</template>
