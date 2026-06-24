<script setup lang="ts">
/**
 * 颜色转换器
 * 在 HEX / HEX8 / RGB / HSL / HSV / CMYK 间互转，并输出 OKLCH，实时预览
 */
import { colord, extend } from 'colord'
import cmykPlugin from 'colord/plugins/cmyk'
import hwbPlugin from 'colord/plugins/hwb'
import namesPlugin from 'colord/plugins/names'

extend([cmykPlugin, hwbPlugin, namesPlugin])

const input = ref('#0ea5e9')
const error = ref('')
const pickerColor = ref('#0ea5e9')

// 尝试解析 HSV 字符串：hsv(h, s%, v%)
function parseHsv(str: string) {
  const m = str.match(/^hsv\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%?\s*,\s*(\d+(?:\.\d+)?)%?\s*\)$/i)
  if (!m) return null
  return colord({ h: Number(m[1]), s: Number(m[2]), v: Number(m[3]) })
}

// 尝试解析 CMYK 字符串：cmyk(c%, m%, y%, k%)
function parseCmyk(str: string) {
  const m = str.match(/^cmyk\(\s*(\d+(?:\.\d+)?)%?\s*,\s*(\d+(?:\.\d+)?)%?\s*,\s*(\d+(?:\.\d+)?)%?\s*,\s*(\d+(?:\.\d+)?)%?\s*\)$/i)
  if (!m) return null
  return colord({ c: Number(m[1]), m: Number(m[2]), y: Number(m[3]), k: Number(m[4]) })
}

// 增强解析：先尝试 hsv / cmyk 字符串，再用 colord 默认解析
function parseColor(str: string) {
  const trimmed = str.trim()
  if (!trimmed) return null

  // 尝试 HSV
  const hsvResult = parseHsv(trimmed)
  if (hsvResult?.isValid()) return hsvResult

  // 尝试 CMYK
  const cmykResult = parseCmyk(trimmed)
  if (cmykResult?.isValid()) return cmykResult

  // 默认 colord 解析（HEX / RGB / HSL / 颜色名称等）
  const c = colord(trimmed)
  if (c.isValid()) return c

  return null
}

const parsed = computed(() => parseColor(input.value))

watch(input, () => {
  error.value = ''
  if (input.value.trim() && !parsed.value) {
    error.value = '无法识别的颜色值'
  }
})

function updateInputColor(color: string) {
  input.value = color
  if (parsed.value) {
    pickerColor.value = parsed.value.toHex()
  }
}

function updatePickerColor(color: string | undefined) {
  pickerColor.value = color || ''
  input.value = color || ''
}

const hex = computed(() => parsed.value?.toHex().slice(0, 7) ?? '')

// HEX8：如果用户输入的本身就是 8 位 HEX，直接回显原值避免 colord 精度损失
const hex8 = computed(() => {
  if (!parsed.value) return ''
  const trimmed = input.value.trim().toLowerCase()
  // 用户输入就是 8 位 HEX → 直接回显（避免 0xaa→0.67→0xab 的舍入偏差）
  if (/^#[0-9a-f]{8}$/.test(trimmed)) return trimmed
  // 否则用 colord 转换：alpha < 1 → 8 位；alpha = 1 → 补 ff
  const h = parsed.value.toHex()
  return h.length === 7 ? `${h}ff` : h
})

const rgb = computed(() => {
  if (!parsed.value) return ''
  const { r, g, b } = parsed.value.toRgb()
  return `rgb(${r}, ${g}, ${b})`
})
const rgba = computed(() => {
  if (!parsed.value) return ''
  const { r, g, b, a } = parsed.value.toRgb()
  return `rgba(${r}, ${g}, ${b}, ${a})`
})
const hsl = computed(() => {
  if (!parsed.value) return ''
  const { h, s, l } = parsed.value.toHsl()
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
})
const hsv = computed(() => {
  if (!parsed.value) return ''
  const { h, s, v } = parsed.value.toHsv()
  return `hsv(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(v)}%)`
})
const cmyk = computed(() => {
  if (!parsed.value) return ''
  const { c, m, y, k } = parsed.value.toCmyk()
  return `cmyk(${Math.round(c)}%, ${Math.round(m)}%, ${Math.round(y)}%, ${Math.round(k)}%)`
})

// OKLCH 手动转换（colord 没有内置 OKLCH 插件）
// sRGB → linear sRGB → OKLab → OKLCH
function srgbToLinear(c: number): number {
  c /= 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function rgbToOklch(r: number, g: number, b: number): { l: number, c: number, h: number } {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)

  // linear sRGB → LMS (using OKLab M1 matrix)
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

  // LMS → LMS (cube root)
  const l1 = Math.cbrt(l_)
  const m1 = Math.cbrt(m_)
  const s1 = Math.cbrt(s_)

  // LMS → OKLab (using M2 matrix)
  const L = 0.2104542553 * l1 + 0.7936177850 * m1 - 0.0040720468 * s1
  const A = 1.9779984951 * l1 - 2.4285922050 * m1 + 0.4505937099 * s1
  const B = 0.0259040371 * l1 + 0.7827717662 * m1 - 0.8086757660 * s1

  // OKLab → OKLCH
  const C = Math.sqrt(A * A + B * B)
  let H = (Math.atan2(B, A) * 180) / Math.PI
  if (H < 0) H += 360

  return { l: L, c: C, h: H }
}

const oklch = computed(() => {
  if (!parsed.value) return ''
  const { r, g, b, a } = parsed.value.toRgb()
  const { l, c, h } = rgbToOklch(r, g, b)
  const lStr = (l * 100).toFixed(1)
  const cStr = c.toFixed(3)
  const hStr = h.toFixed(1)
  if (a < 1) {
    return `oklch(${lStr}% ${cStr} ${hStr} / ${a})`
  }
  return `oklch(${lStr}% ${cStr} ${hStr})`
})

const colorName = computed(() => {
  if (!parsed.value) return ''
  return parsed.value.toName({ closest: true }) ?? ''
})

const brightness = computed(() => {
  if (!parsed.value) return 0
  return Math.round(parsed.value.brightness() * 100)
})

const isDark = computed(() => parsed.value?.isDark() ?? false)

const formats = computed(() => {
  if (!parsed.value) return []
  return [
    { label: 'HEX', value: hex.value, icon: 'lucide:hash' },
    { label: 'HEX8', value: hex8.value, icon: 'lucide:hash' },
    { label: 'RGB', value: rgb.value, icon: 'lucide:circle' },
    { label: 'RGBA', value: rgba.value, icon: 'lucide:circle-dot' },
    { label: 'HSL', value: hsl.value, icon: 'lucide:sun' },
    { label: 'HSV', value: hsv.value, icon: 'lucide:sunset' },
    { label: 'CMYK', value: cmyk.value, icon: 'lucide:printer' },
    { label: 'OKLCH', value: oklch.value, icon: 'lucide:blend' }
  ]
})

const presets = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#000000', '#ffffff', '#6b7280', '#0ea5e9'
]

function applyPreset(color: string) {
  input.value = color
}

function clear() {
  input.value = ''
  error.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="输入任意颜色值（HEX、RGB、HSL、HSV、CMYK 或颜色名称），自动转换为常用格式并输出 OKLCH。" />

    <!-- 输入 + 颜色拾取器 -->
    <div class="flex flex-col gap-2 flex-1">
      <label class="text-sm font-medium text-muted">输入颜色值</label>
      <UInput
        :model-value="input"
        placeholder="#0ea5e9 / rgb(14,165,233) / skyblue"
        class="font-mono"
        @update:model-value="updateInputColor"
      />
      <p
        v-if="error"
        class="text-sm text-error"
      >
        {{ error }}
      </p>
    </div>

    <!-- 预设色板 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">快速选色</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="color in presets"
          :key="color"
          class="w-8 h-8 rounded-lg border border-default cursor-pointer shadow-sm transition-transform hover:scale-110"
          :class="hex === color ? 'ring-2 ring-primary-500 ring-offset-2' : ''"
          :style="{ backgroundColor: color }"
          :title="color"
          @click="applyPreset(color)"
        />
      </div>
    </div>

    <!-- 颜色预览 + 格式卡片 -->
    <div
      v-if="parsed"
      class="flex flex-col gap-3"
    >
      <div class="flex items-center gap-4">
        <UPopover :content="{ side: 'right' }">
          <div
            class="w-20 h-20 rounded-xl border border-default shadow-sm"
            :style="{ backgroundColor: hex }"
          />
          <template #content>
            <UColorPicker
              :model-value="pickerColor"
              @update:model-value="updatePickerColor"
            />
          </template>
        </UPopover>
        <div class="flex flex-col gap-1">
          <p class="text-lg font-semibold text-default">
            {{ colorName || hex }}
          </p>
          <p class="text-sm text-muted">
            亮度：{{ brightness }}% | {{ isDark ? '暗色' : '亮色' }}
          </p>
        </div>
      </div>

      <!-- 格式卡片 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="fmt in formats"
          :key="fmt.label"
          class="rounded-lg border border-default bg-elevated p-4 flex flex-col gap-2"
        >
          <div class="flex items-center gap-2 text-dimmed">
            <UIcon
              :name="fmt.icon"
              class="size-4"
            />
            <span class="text-xs font-medium">{{ fmt.label }}</span>
          </div>
          <div class="flex items-center gap-2">
            <code class="text-sm font-mono text-default flex-1 break-all">{{ fmt.value }}</code>
            <Copy :text="fmt.value" />
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        variant="ghost"
        color="error"
        icon="lucide:trash-2"
        @click="clear"
      >
        清空
      </UButton>
    </div>
  </div>
</template>
