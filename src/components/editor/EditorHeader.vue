<script setup lang="ts">
import {
  Copy,
  Check,
  FoldVertical,
  UnfoldVertical,
  WrapText,
  Trash2,
  Code2,
  Download,
  FolderOpen,
  Search
} from '@lucide/vue'

defineProps<{
  title?: string
  language?: string
  readonly?: boolean
  showLanguage?: boolean
  showStats?: boolean
  showFold?: boolean
  codeFolding?: boolean
  isAllFolded?: boolean
  showWrap?: boolean
  isWrapped?: boolean
  showSearch?: boolean
  clearable?: boolean
  hasContent?: boolean
  showOpen?: boolean
  showCopy?: boolean
  copied?: boolean
  showDownload?: boolean
  downloaded?: boolean
  lineCount?: number
  charCountFormatted?: string
  currentLanguageLabel?: string
}>()

defineEmits<{
  'toggle-fold': []
  'toggle-wrap': []
  search: []
  clear: []
  open: []
  copy: []
  download: []
}>()
</script>

<template>
  <div
    class="box-border flex h-[42px] shrink-0 items-center justify-between gap-2 border-b border-zinc-200/80 bg-zinc-50/80 px-3 backdrop-blur-xs select-none dark:border-zinc-800/80 dark:bg-[#18181d]"
  >
    <!-- 左侧区域：标题、语言Badge、只读指示、插槽 -->
    <div class="flex min-w-0 items-center gap-2 overflow-hidden">
      <slot name="header-left">
        <!-- 标题与图标 -->
        <div
          class="flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-zinc-700 dark:text-zinc-200"
          :title="title || undefined"
        >
          <slot name="title-icon">
            <Code2 class="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          </slot>
          <span v-if="title" class="editor-title-text truncate select-none">{{ title }}</span>
        </div>

        <!-- 语言类型 Badge (无阴影扁平风格) -->
        <div
          v-if="showLanguage && language"
          class="inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 font-mono text-[11px] font-medium whitespace-nowrap text-zinc-600 select-none dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-300"
          :title="`代码类型: ${currentLanguageLabel || language.toUpperCase()}`"
        >
          <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <span>{{ currentLanguageLabel || language.toUpperCase() }}</span>
        </div>

        <!-- 只读标签 -->
        <span
          v-if="readonly"
          class="inline-flex h-[22px] shrink-0 items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 text-[11px] font-medium whitespace-nowrap text-zinc-500 select-none dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-400"
        >
          只读
        </span>
      </slot>
    </div>

    <!-- 右侧区域：统计指标与高频快捷按钮 -->
    <div class="flex shrink-0 items-center gap-1 text-xs">
      <!-- 行数与字符统计 -->
      <div
        v-if="showStats"
        class="editor-stats mr-1 hidden shrink-0 items-center gap-1 font-mono text-[11px] text-zinc-400 select-none sm:inline-flex dark:text-zinc-500"
      >
        <span>{{ lineCount || 0 }} 行</span>
        <span class="editor-stats-chars">·</span>
        <span class="editor-stats-chars">{{ charCountFormatted || '0' }} 字符</span>
      </div>

      <!-- 自定义操作插槽 -->
      <slot name="actions" />

      <!-- 代码折叠全部 / 展开全部切换按钮 -->
      <button
        v-if="showFold && codeFolding"
        type="button"
        class="cursor-pointer rounded-md p-1.5 text-zinc-500 transition-all duration-150 hover:bg-zinc-200/60 hover:text-zinc-800 active:scale-90 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        :title="isAllFolded ? '展开全部代码' : '折叠全部代码'"
        @click="$emit('toggle-fold')"
      >
        <UnfoldVertical
          v-if="isAllFolded"
          class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
        />
        <FoldVertical v-else class="h-3.5 w-3.5" />
      </button>

      <!-- 自动换行切换按钮 -->
      <button
        v-if="showWrap"
        type="button"
        class="cursor-pointer rounded-md p-1.5 transition-all duration-150 active:scale-90"
        :class="
          isWrapped
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
            : 'text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
        "
        :title="isWrapped ? '关闭自动换行' : '开启自动换行'"
        @click="$emit('toggle-wrap')"
      >
        <WrapText class="h-3.5 w-3.5" />
      </button>

      <!-- 查找/搜索按钮 -->
      <button
        v-if="showSearch !== false"
        type="button"
        class="cursor-pointer rounded-md p-1.5 text-zinc-500 transition-all duration-150 hover:bg-zinc-200/60 hover:text-zinc-800 active:scale-90 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        title="搜索 (Cmd+F / Ctrl+F)"
        @click="$emit('search')"
      >
        <Search class="h-3.5 w-3.5" />
      </button>

      <!-- 清空按钮 (常驻展示，无内容时置灰禁用，避免按钮动态出现导致抖动) -->
      <button
        v-if="clearable !== false && !readonly"
        type="button"
        class="rounded-md p-1.5 transition-all duration-150 select-none"
        :class="
          hasContent
            ? 'cursor-pointer text-zinc-500 hover:bg-rose-50 hover:text-rose-600 active:scale-90 dark:text-zinc-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400'
            : 'cursor-not-allowed text-zinc-400 opacity-35 dark:text-zinc-600'
        "
        :disabled="!hasContent"
        title="清空内容"
        @click="hasContent ? $emit('clear') : undefined"
      >
        <Trash2 class="h-3.5 w-3.5" />
      </button>

      <!-- 打开本地文件按钮 -->
      <button
        v-if="showOpen && !readonly"
        type="button"
        class="cursor-pointer rounded-md p-1.5 text-zinc-500 transition-all duration-150 hover:bg-zinc-200/60 hover:text-zinc-800 active:scale-90 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        title="打开本地文件"
        @click="$emit('open')"
      >
        <FolderOpen class="h-3.5 w-3.5 shrink-0" />
      </button>

      <!-- 一键内容复制按钮 (统一为纯图标按钮，样式与清空等统一) -->
      <button
        v-if="showCopy"
        type="button"
        class="cursor-pointer rounded-md p-1.5 transition-all duration-150 active:scale-90"
        :class="
          copied
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
            : 'text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
        "
        :title="copied ? '已复制到剪贴板' : '复制代码内容'"
        @click="$emit('copy')"
      >
        <Check v-if="copied" class="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <Copy v-else class="h-3.5 w-3.5 shrink-0" />
      </button>

      <!-- 一键内容下载按钮 -->
      <button
        v-if="showDownload"
        type="button"
        class="cursor-pointer rounded-md p-1.5 transition-all duration-150 active:scale-90"
        :class="
          downloaded
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
            : 'text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
        "
        :title="downloaded ? '已开始下载' : '下载代码文件'"
        @click="$emit('download')"
      >
        <Check
          v-if="downloaded"
          class="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
        />
        <Download v-else class="h-3.5 w-3.5 shrink-0" />
      </button>

      <!-- 插槽：右侧末尾 -->
      <slot name="header-right" />
    </div>
  </div>
</template>
