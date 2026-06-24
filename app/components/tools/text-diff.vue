<script setup lang="ts">
/**
 * 文本对比工具
 * 对比两段文本差异并高亮显示，支持逐字/逐行模式
 */
import { diffChars, diffLines, diffWords } from 'diff'

type DiffMode = 'chars' | 'words' | 'lines'

const original = ref('')
const modified = ref('')
const diffMode = ref<DiffMode>('words')

interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

const diffResult = computed<DiffPart[]>(() => {
  if (!original.value && !modified.value) return []

  switch (diffMode.value) {
    case 'chars':
      return diffChars(original.value, modified.value)
    case 'words':
      return diffWords(original.value, modified.value)
    case 'lines':
      return diffLines(original.value, modified.value)
    default:
      return []
  }
})

const stats = computed(() => {
  let added = 0
  let removed = 0
  for (const part of diffResult.value) {
    if (part.added) added += part.value.length
    else if (part.removed) removed += part.value.length
  }
  return { added, removed }
})

const hasDiff = computed(() => diffResult.value.some(p => p.added || p.removed))

function switchValue() {
  const temp = original.value
  original.value = modified.value
  modified.value = temp
}

function clear() {
  original.value = ''
  modified.value = ''
}

function loadSample() {
  original.value = `const greeting = "Hello World";
function add(a, b) {
  return a + b;
}
console.log(greeting);`

  modified.value = `const greeting = "Hello DevUtils";
function add(a, b) {
  // 加法运算
  return a + b;
}
const result = add(1, 2);
console.log(greeting, result);`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="对比两段文本差异，增加的内容以绿色显示，删除的内容以红色显示。" />

    <!-- 输入区：双栏 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="flex min-w-0 flex-col gap-2">
        <label class="text-sm font-medium text-muted">原始文本</label>
        <UTextarea
          v-model="original"
          placeholder="输入原始文本..."
          :rows="10"
          :maxrows="20"
        />
      </div>
      <div class="flex min-w-0 flex-col gap-2">
        <label class="text-sm font-medium text-muted">修改后文本</label>
        <UTextarea
          v-model="modified"
          placeholder="输入修改后的文本..."
          :rows="10"
          :maxrows="20"
        />
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="flex flex-wrap items-center gap-2">
      <SegmentControl
        v-model="diffMode"
        :options="[
          { label: '逐字', value: 'chars' as DiffMode },
          { label: '逐词', value: 'words' as DiffMode },
          { label: '逐行', value: 'lines' as DiffMode }
        ]"
      />
      <UButton
        variant="ghost"
        icon="lucide:arrow-up-down"
        color="secondary"
        @click="switchValue"
      >
        交换
      </UButton>
      <UButton
        icon="lucide:file-text"
        variant="ghost"
        color="secondary"
        @click="loadSample"
      >
        加载示例
      </UButton>
      <UButton
        variant="ghost"
        color="error"
        icon="lucide:trash-2"
        @click="clear"
      >
        清空
      </UButton>
    </div>

    <!-- 差异结果 -->
    <div class="flex min-w-0 flex-col gap-2">
      <label class="text-sm font-medium text-muted">
        对比结果
        <span
          v-if="hasDiff"
          class="ml-2 text-xs"
        >
          <span class="text-green-600 dark:text-green-400">+{{ stats.added }}</span>
          <span class="mx-1 text-dimmed">/</span>
          <span class="text-red-600 dark:text-red-400">-{{ stats.removed }}</span>
        </span>
        <span
          v-else-if="original || modified"
          class="ml-2 text-xs text-green-600 dark:text-green-400"
        >
          ✓ 完全一致
        </span>
      </label>

      <div
        class="rounded-lg border border-default bg-elevated p-4 font-mono text-sm leading-relaxed overflow-x-auto min-h-32 whitespace-pre-wrap break-all"
      >
        <template v-if="diffResult.length > 0">
          <span
            v-for="(part, idx) in diffResult"
            :key="idx"
            :class="{
              'bg-green-500/20 text-green-700 dark:text-green-300': part.added,
              'bg-red-500/20 text-red-700 dark:text-red-300 line-through': part.removed
            }"
          >{{ part.value }}</span>
        </template>
        <span
          v-else
          class="text-dimmed"
        >输入文本后自动对比差异…</span>
      </div>
    </div>
  </div>
</template>
