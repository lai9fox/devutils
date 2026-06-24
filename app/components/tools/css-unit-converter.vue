<script setup lang="ts">
/**
 * CSS 单位转换器
 * px / rem / em / pt / vw / vh 互转
 */

const inputValue = ref(16)
const inputUnit = ref('px')
const baseFontSize = ref(16)
const parentFontSize = ref(16)
const viewportWidth = ref(1920)
const viewportHeight = ref(1080)

type CssUnit = 'px' | 'rem' | 'em' | 'pt' | 'vw' | 'vh'

const units: { label: string, value: CssUnit, desc: string }[] = [
  { label: 'px', value: 'px', desc: '像素（绝对单位）' },
  { label: 'rem', value: 'rem', desc: '相对根元素字号' },
  { label: 'em', value: 'em', desc: '相对父元素字号' },
  { label: 'pt', value: 'pt', desc: '磅（1pt = 1/72 英寸）' },
  { label: 'vw', value: 'vw', desc: '视口宽度百分比' },
  { label: 'vh', value: 'vh', desc: '视口高度百分比' }
]

// 先统一转为 px，再由 px 转为目标单位
function toPx(value: number, unit: string): number {
  switch (unit) {
    case 'px': return value
    case 'rem': return value * baseFontSize.value
    case 'em': return value * parentFontSize.value
    case 'pt': return value * (96 / 72)
    case 'vw': return (value / 100) * viewportWidth.value
    case 'vh': return (value / 100) * viewportHeight.value
    default: return value
  }
}

function fromPx(px: number, unit: string): number {
  switch (unit) {
    case 'px': return px
    case 'rem': return baseFontSize.value ? px / baseFontSize.value : 0
    case 'em': return parentFontSize.value ? px / parentFontSize.value : 0
    case 'pt': return px * (72 / 96)
    case 'vw': return viewportWidth.value ? (px / viewportWidth.value) * 100 : 0
    case 'vh': return viewportHeight.value ? (px / viewportHeight.value) * 100 : 0
    default: return px
  }
}

function formatNum(n: number): string {
  if (Number.isNaN(n) || !Number.isFinite(n)) return '0'
  // 最多保留 4 位小数，去掉尾部 0
  return Number.parseFloat(n.toFixed(4)).toString()
}

const results = computed(() => {
  const px = toPx(inputValue.value || 0, inputUnit.value)
  return units.map(u => ({
    ...u,
    result: formatNum(fromPx(px, u.value))
  }))
})

const presets = [
  { label: '12px', value: 12, unit: 'px' },
  { label: '14px', value: 14, unit: 'px' },
  { label: '16px', value: 16, unit: 'px' },
  { label: '1rem', value: 1, unit: 'rem' },
  { label: '1.5rem', value: 1.5, unit: 'rem' },
  { label: '2rem', value: 2, unit: 'rem' },
  { label: '24pt', value: 24, unit: 'pt' },
  { label: '100vw', value: 100, unit: 'vw' }
]

function applyPreset(preset: { value: number, unit: string }) {
  inputValue.value = preset.value
  inputUnit.value = preset.unit
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="基于配置的基准字号和视口尺寸，在各 CSS 单位间精确换算。" />

    <!-- 基准配置 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted">根字号 (px)</label>
        <UInput
          v-model.number="baseFontSize"
          type="number"
          :min="1"
          placeholder="16"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted">父元素字号 (px)</label>
        <UInput
          v-model.number="parentFontSize"
          type="number"
          :min="1"
          placeholder="16"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted">视口宽度 (px)</label>
        <UInput
          v-model.number="viewportWidth"
          type="number"
          :min="1"
          placeholder="1920"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted">视口高度 (px)</label>
        <UInput
          v-model.number="viewportHeight"
          type="number"
          :min="1"
          placeholder="1080"
        />
      </div>
    </div>

    <!-- 输入 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">输入值</label>
      <div class="flex gap-3 items-center">
        <UInput
          v-model.number="inputValue"
          type="number"
          class="flex-1 font-mono"
          placeholder="16"
        />
        <SegmentControl
          v-model="inputUnit"
          :options="units.map(u => ({ label: u.label, value: u.value }))"
        />
      </div>
    </div>

    <!-- 快速选择 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">常用值</label>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="preset in presets"
          :key="preset.label"
          variant="outline"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </UButton>
      </div>
    </div>

    <!-- 换算结果 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">换算结果</label>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div
          v-for="item in results"
          :key="item.value"
          class="rounded-lg border p-4 flex flex-col gap-1 border-default bg-elevated"
        >
          <div class="flex items-center justify-between">
            <span class="text-muted font-medium">{{ item.label }}</span>
            <Copy :text="`${item.result}${item.value}`" />
          </div>
          <div class="text-xl font-semibold font-mono text-default">
            {{ item.result }}
          </div>
          <p class="text-xs text-dimmed">
            {{ item.desc }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
