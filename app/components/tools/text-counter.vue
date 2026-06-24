<script setup lang="ts">
/**
 * 文本统计工具
 * 实时统计字符数、单词数、行数、段落数等
 */
const text = ref('')

const stats = computed(() => {
  const raw = text.value
  const chars = raw.length
  const charsNoSpace = raw.replace(/\s/g, '').length

  // 中文字符数
  const chineseChars = (raw.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length

  // 英文单词数（连续字母数字序列）
  const englishWords = (raw.match(/[a-zA-Z0-9]+/g) || []).length

  // 总"词"数 = 英文单词 + 中文字符（中文每个字算一个词）
  const words = englishWords + chineseChars

  const lines = raw ? raw.split('\n').length : 0
  const paragraphs = raw ? raw.split(/\n\s*\n/).filter(p => p.trim()).length : 0

  // 阅读时间：中文约 300 字/分钟，英文约 200 词/分钟
  const readingMinutes = Math.max(1, Math.ceil((chineseChars / 300) + (englishWords / 200)))

  // 字节数（UTF-8）
  const bytes = new TextEncoder().encode(raw).length

  return {
    chars,
    charsNoSpace,
    chineseChars,
    englishWords,
    words,
    lines,
    paragraphs,
    readingMinutes,
    bytes
  }
})

const statCards = computed(() => [
  { label: '字符数', value: stats.value.chars, icon: 'lucide:type' },
  { label: '字符数（不含空格）', value: stats.value.charsNoSpace, icon: 'lucide:text-cursor' },
  { label: '中文字符', value: stats.value.chineseChars, icon: 'lucide:languages' },
  { label: '英文单词', value: stats.value.englishWords, icon: 'lucide:case-upper' },
  { label: '总词数', value: stats.value.words, icon: 'lucide:whole-word' },
  { label: '行数', value: stats.value.lines, icon: 'lucide:list' },
  { label: '段落数', value: stats.value.paragraphs, icon: 'lucide:pilcrow' },
  { label: '字节数 (UTF-8)', value: formatBytes(stats.value.bytes), icon: 'lucide:hard-drive' },
  { label: '预计阅读', value: text.value ? `${stats.value.readingMinutes} 分钟` : '-', icon: 'lucide:clock' }
])

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function clear() {
  text.value = ''
}

function loadSample() {
  text.value = `DevUtils 是一个开发者工具聚合网站，提供各种常用的在线工具。

所有工具均在本地浏览器中运行，不会将数据发送到任何服务器，确保您的隐私安全。

The quick brown fox jumps over the lazy dog. This is a sample text that contains both English and Chinese characters for testing the text counter tool.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">输入文本</label>
      <UTextarea
        v-model="text"
        :rows="10"
        placeholder="输入或粘贴文本，统计数据将实时更新..."
        class="text-sm"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
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

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-lg border border-default bg-elevated p-4 flex flex-col gap-1"
      >
        <div class="flex items-center gap-2 text-dimmed">
          <UIcon
            :name="card.icon"
            class="size-4"
          />
          <span class="text-xs">{{ card.label }}</span>
        </div>
        <div class="text-xl font-semibold text-default font-mono">
          {{ card.value }}
        </div>
      </div>
    </div>
  </div>
</template>
