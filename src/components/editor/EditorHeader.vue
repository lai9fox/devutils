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
  'search': []
  'clear': []
  'open': []
  'copy': []
  'download': []
}>()
</script>

<template>
  <div
    class="flex items-center justify-between px-3 h-[42px] border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-[#18181d] backdrop-blur-xs select-none gap-2 shrink-0 box-border"
  >
    <!-- 左侧区域：标题、语言Badge、只读指示、插槽 -->
    <div class="flex items-center gap-2 overflow-hidden min-w-0">
      <slot name="header-left">
        <!-- 标题与图标 -->
        <div
          class="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 min-w-0 truncate"
          :title="title || undefined"
        >
          <slot name="title-icon">
            <Code2 class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </slot>
          <span v-if="title" class="editor-title-text truncate select-none">{{ title }}</span>
        </div>

        <!-- 语言类型 Badge (无阴影扁平风格) -->
        <div
          v-if="showLanguage && language"
          class="inline-flex items-center gap-1.5 px-2 h-[22px] text-[11px] font-mono font-medium rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 shrink-0 whitespace-nowrap select-none"
          :title="`代码类型: ${currentLanguageLabel || language.toUpperCase()}`"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{{ currentLanguageLabel || language.toUpperCase() }}</span>
        </div>

        <!-- 只读标签 -->
        <span
          v-if="readonly"
          class="inline-flex items-center px-2 h-[22px] text-[11px] font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80 shrink-0 whitespace-nowrap select-none"
        >
          只读
        </span>
      </slot>
    </div>

    <!-- 右侧区域：统计指标与高频快捷按钮 -->
    <div class="flex items-center gap-1 shrink-0 text-xs">
      <!-- 行数与字符统计 -->
      <div
        v-if="showStats"
        class="editor-stats hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mr-1 select-none shrink-0"
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
        class="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-all duration-150 active:scale-90 cursor-pointer"
        :title="isAllFolded ? '展开全部代码' : '折叠全部代码'"
        @click="$emit('toggle-fold')"
      >
        <UnfoldVertical v-if="isAllFolded" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <FoldVertical v-else class="w-3.5 h-3.5" />
      </button>

      <!-- 自动换行切换按钮 -->
      <button
        v-if="showWrap"
        type="button"
        class="p-1.5 rounded-md transition-all duration-150 active:scale-90 cursor-pointer"
        :class="
          isWrapped
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
        "
        :title="isWrapped ? '关闭自动换行' : '开启自动换行'"
        @click="$emit('toggle-wrap')"
      >
        <WrapText class="w-3.5 h-3.5" />
      </button>

      <!-- 查找/搜索按钮 -->
      <button
        v-if="showSearch !== false"
        type="button"
        class="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-all duration-150 active:scale-90 cursor-pointer"
        title="搜索 (Cmd+F / Ctrl+F)"
        @click="$emit('search')"
      >
        <Search class="w-3.5 h-3.5" />
      </button>

      <!-- 清空按钮 -->
      <button
        v-if="clearable && !readonly && hasContent"
        type="button"
        class="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-150 active:scale-90 cursor-pointer"
        title="清空内容"
        @click="$emit('clear')"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>

      <!-- 打开本地文件按钮 -->
      <button
        v-if="showOpen && !readonly"
        type="button"
        class="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-all duration-150 active:scale-90 cursor-pointer"
        title="打开本地文件"
        @click="$emit('open')"
      >
        <FolderOpen class="w-3.5 h-3.5 shrink-0" />
      </button>

      <!-- 一键内容复制按钮 (统一为纯图标按钮，样式与清空等统一) -->
      <button
        v-if="showCopy"
        type="button"
        class="p-1.5 rounded-md transition-all duration-150 active:scale-90 cursor-pointer"
        :class="
          copied
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
        "
        :title="copied ? '已复制到剪贴板' : '复制代码内容'"
        @click="$emit('copy')"
      >
        <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <Copy v-else class="w-3.5 h-3.5 shrink-0" />
      </button>

      <!-- 一键内容下载按钮 -->
      <button
        v-if="showDownload"
        type="button"
        class="p-1.5 rounded-md transition-all duration-150 active:scale-90 cursor-pointer"
        :class="
          downloaded
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
        "
        :title="downloaded ? '已开始下载' : '下载代码文件'"
        @click="$emit('download')"
      >
        <Check v-if="downloaded" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <Download v-else class="w-3.5 h-3.5 shrink-0" />
      </button>

      <!-- 插槽：右侧末尾 -->
      <slot name="header-right" />
    </div>
  </div>
</template>
