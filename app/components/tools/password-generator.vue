<script setup lang="ts">
/**
 * 密码生成器工具
 * 支持长度、大小写、数字、符号等选项，使用 crypto.getRandomValues 安全随机
 */
// ===================== 字符集 =====================

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const DEFAULT_SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

const length = ref(16)
const useLower = ref(true)
const useUpper = ref(true)
const useDigits = ref(true)
const useSymbols = ref(true)
const customSymbols = ref('')
const count = ref(1)
const output = ref('')
const error = ref('')

// 实际使用的符号集：有自定义则用自定义，否则用默认
const symbolSet = computed(() => {
  const s = customSymbols.value.trim()
  return s || DEFAULT_SYMBOLS
})

// 至少选一种字符类型
const canGenerate = computed(() => useLower.value || useUpper.value || useDigits.value || useSymbols.value)

/** 使用 crypto.getRandomValues 在 [0, max) 内无偏取随机整数 */
function secureRandomInt(max: number): number {
  if (max <= 0) return 0
  const array = new Uint32Array(1)
  const limit = 0x100000000 - (0x100000000 % max)
  do {
    crypto.getRandomValues(array)
  } while (array[0]! >= limit)
  return array[0]! % max
}

/** 从字符串中随机取一个字符 */
function pickChar(chars: string): string {
  return chars[secureRandomInt(chars.length)] ?? ''
}

/** 生成一个密码 */
function generateOne(): string {
  const pools: string[] = []
  if (useLower.value) pools.push(LOWER)
  if (useUpper.value) pools.push(UPPER)
  if (useDigits.value) pools.push(DIGITS)
  if (useSymbols.value) pools.push(symbolSet.value)

  if (pools.length === 0) return ''

  const len = Math.max(1, Math.min(length.value || 16, 256))
  const allChars = pools.join('')

  // 先保证每种类型至少有一个（若长度足够）
  const result: string[] = []
  for (let i = 0; i < pools.length && result.length < len; i++) {
    const pool = pools[i]!
    result.push(pickChar(pool))
  }

  // 剩余位置随机从全部字符中选
  while (result.length < len) {
    result.push(pickChar(allChars))
  }

  // Fisher-Yates 打乱顺序
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1)
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }

  return result.join('')
}

function generate() {
  if (!canGenerate.value) {
    error.value = '请至少勾选一种字符类型'
    output.value = ''
    return
  }
  error.value = ''
  const num = Math.max(1, Math.min(count.value || 1, 100))
  const results: string[] = []
  for (let i = 0; i < num; i++) {
    results.push(generateOne())
  }
  output.value = results.join('\n')
}

function clear() {
  output.value = ''
  error.value = ''
}

onMounted(() => {
  generate()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 长度：Slider -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">长度：{{ length }}</label>
      <USlider
        v-model="length"
        :min="1"
        :max="256"
        :step="1"
        class="w-full"
        tooltip
      />
    </div>

    <!-- 数量 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">数量：{{ count }}</label>
      <USlider
        v-model="count"
        :min="1"
        :max="256"
        :step="1"
        class="w-full"
        tooltip
      />
    </div>

    <!-- 字符类型：每项单独一行 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">字符类型</label>
      <div class="flex flex-col">
        <UCheckbox
          v-model="useLower"
          label="小写 a-z"
          class="mb-2"
        />
        <UCheckbox
          v-model="useUpper"
          label="大写 A-Z"
          class="mb-2"
        />
        <UCheckbox
          v-model="useDigits"
          label="数字 0-9"
        />
        <div class="flex items-center gap-2">
          <UCheckbox
            v-model="useSymbols"
            label="符号"
            class="whitespace-nowrap"
          />
          <UInput
            v-model="customSymbols"
            placeholder="留空使用默认 !@#$%^&*()_+-=[]{}|;:,.<>?"
            class="min-w-64 flex-1 max-w-md"
          />
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        icon="lucide:play"
        color="success"
        @click="generate"
      >
        生成
      </UButton>
      <UButton
        variant="ghost"
        color="error"
        icon="lucide:trash-2"
        @click="clear"
      >
        清空
      </UButton>
      <Copy :text="output" />
    </div>
    <p
      v-if="error"
      class="text-sm text-error"
    >
      {{ error }}
    </p>

    <!-- 输出 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">生成结果</label>
      <UTextarea
        v-model="output"
        :rows="Math.min(Math.max(count, 6), 15)"
        placeholder="生成结果"
        readonly
        class="w-full font-mono"
      />
    </div>
  </div>
</template>
