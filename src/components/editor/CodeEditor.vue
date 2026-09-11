<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { FolderOpen } from '@lucide/vue'
import EditorHeader from './EditorHeader.vue'
import { useCodeMirror } from './useCodeMirror'
import { resolveDownloadFileInfo, triggerFileDownload } from '../../utils/file-download'
import {
  LANGUAGE_LABELS,
  type CodeEditorProps,
  type CodeEditorEmits,
  type CodeEditorExpose,
  type CodeLanguage
} from './types'
import './editor.css'

export type { CodeLanguage, CodeEditorProps, CodeEditorEmits, CodeEditorExpose }

const props = withDefaults(defineProps<CodeEditorProps>(), {
  modelValue: '',
  language: 'json',
  title: '',
  readonly: false,
  rows: 14,
  minRows: 4,
  placeholder: '',
  lineWrapping: false,
  lineNumbers: true,
  codeFolding: true,
  lint: true,
  autoHeight: false,
  fillHeight: true,
  showHeader: true,
  showLanguage: true,
  showCopy: true,
  showDownload: true,
  showOpen: true,
  accept: '',
  filename: '',
  downloadFilename: '',
  showFold: true,
  showWrap: true,
  showSearch: true,
  showStats: true,
  clearable: false,
  class: ''
})

const emit = defineEmits<CodeEditorEmits>()

const editorHost = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 状态管理
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null
const downloaded = ref(false)
let downloadTimer: ReturnType<typeof setTimeout> | null = null
const openedFilename = ref('')
const isDraggingFile = ref(false)

// CodeMirror 驱动
const cm = useCodeMirror(editorHost, props, (evt, val) => emit(evt, val))

// 统计计算
const lineCount = computed(() => {
  if (!props.modelValue) return 0
  return props.modelValue.split('\n').length
})

const charCountFormatted = computed(() => {
  const count = props.modelValue ? props.modelValue.length : 0
  return count.toLocaleString()
})

const currentLanguageLabel = computed(() => {
  if (!props.language) return 'Code'
  return LANGUAGE_LABELS[props.language.toLowerCase()] || props.language.toUpperCase()
})

const computedAccept = computed(() => {
  if (props.accept) return props.accept
  const lang = (props.language || '').toLowerCase().trim()
  if (lang === 'json' || lang === 'jsonc' || lang === 'json5') {
    return '.json,.jsonc,.json5,.txt,application/json,text/plain'
  }
  if (lang === 'yaml' || lang === 'yml') {
    return '.yaml,.yml,.txt,text/yaml,text/plain'
  }
  if (lang === 'xml') {
    return '.xml,.txt,application/xml,text/plain'
  }
  if (lang === 'javascript' || lang === 'js') {
    return '.js,.mjs,.cjs,.txt,text/javascript,text/plain'
  }
  if (lang === 'typescript' || lang === 'ts') {
    return '.ts,.mts,.cts,.txt,text/plain'
  }
  if (lang === 'html' || lang === 'htm') {
    return '.html,.htm,.txt,text/html,text/plain'
  }
  if (lang === 'css' || lang === 'scss' || lang === 'less') {
    return '.css,.scss,.less,.txt,text/css,text/plain'
  }
  if (lang === 'sql') {
    return '.sql,.txt,text/plain'
  }
  if (lang === 'csv') {
    return '.csv,.txt,text/csv,text/plain'
  }
  if (lang === 'markdown' || lang === 'md') {
    return '.md,.markdown,.txt,text/markdown,text/plain'
  }
  if (lang === 'python' || lang === 'py') {
    return '.py,.txt,text/plain'
  }
  if (lang === 'java') {
    return '.java,.txt,text/plain'
  }
  if (lang === 'go') {
    return '.go,.txt,text/plain'
  }
  if (lang === 'rust' || lang === 'rs') {
    return '.rs,.txt,text/plain'
  }
  return undefined
})

const minHeightRem = computed(() => {
  if (props.fillHeight) return '0'
  return `${props.minRows * 1.5 + 1}rem`
})

const maxHeightRem = computed(() => {
  if (props.fillHeight || props.autoHeight) return 'none'
  return `${props.rows * 1.5 + 1.5}rem`
})

// 操作方法：复制
async function handleCopy() {
  const content = props.modelValue || (cm.view() ? cm.view()!.state.doc.toString() : '')
  if (!content) return

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(content)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    copied.value = true
    emit('copy', content)

    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy to clipboard', err)
  }
}

// 操作方法：下载代码文件
function handleDownload() {
  const content = props.modelValue || (cm.view() ? cm.view()!.state.doc.toString() : '')
  if (!content) return

  const fileInfo = resolveDownloadFileInfo(
    props.downloadFilename || props.filename || openedFilename.value,
    props.language,
    props.title,
    content
  )

  const success = triggerFileDownload(content, fileInfo.filename, fileInfo.mime)
  if (success) {
    downloaded.value = true
    emit('download', fileInfo.filename, content)

    if (downloadTimer) clearTimeout(downloadTimer)
    downloadTimer = setTimeout(() => {
      downloaded.value = false
    }, 2000)
  }
}

// 操作方法：读取并载入文件内容
async function readFile(file: File) {
  if (!file || props.readonly) return
  try {
    const text = await file.text()
    openedFilename.value = file.name
    cm.setValue(text)
    emit('open-file', file, text)
  } catch (err) {
    console.error('Failed to read file', err)
  }
}

// 操作方法：触发选择文件对话框
function triggerOpenFile() {
  if (props.readonly) return
  fileInputRef.value?.click()
}

// 事件处理：选择文件完成
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  void readFile(file)
  target.value = ''
}

// 事件处理：拖拽文件悬浮
function handleDragOver(e: DragEvent) {
  if (props.readonly || !props.showOpen) return
  if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
    e.preventDefault()
    e.stopPropagation()
    isDraggingFile.value = true
  }
}

// 事件处理：拖拽文件离开
function handleDragLeave(e: DragEvent) {
  if (e.currentTarget && !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
    isDraggingFile.value = false
  }
}

// 事件处理：拖拽文件释放
function handleDrop(e: DragEvent) {
  if (props.readonly || !props.showOpen) return
  isDraggingFile.value = false
  if (!e.dataTransfer?.files?.length) return
  e.preventDefault()
  e.stopPropagation()
  const file = e.dataTransfer.files[0]
  void readFile(file)
}

// 操作方法：清空
function handleClear() {
  if (props.readonly) return
  cm.setValue('')
  emit('clear')
}

// 快捷键处理：容器聚焦时支持通过组合键打开搜索面板
function handleKeyDown(e: KeyboardEvent) {
  if (e.defaultPrevented) return
  if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F')) {
    if (props.showSearch !== false) {
      e.preventDefault()
      cm.openSearch()
    }
  }
}

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer)
  if (downloadTimer) clearTimeout(downloadTimer)
})

defineExpose<CodeEditorExpose>({
  getView: () => cm.view(),
  foldAll: cm.foldAll,
  unfoldAll: cm.unfoldAll,
  toggleFoldAll: cm.toggleFoldAll,
  openSearch: cm.openSearch,
  handleCopy,
  handleDownload,
  triggerOpenFile,
  handleClear,
  toggleWordWrap: cm.toggleWordWrap
})
</script>

<template>
  <div
    class="code-editor-container flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] transition-colors shadow-2xs overflow-hidden relative outline-none"
    :class="[
      fillHeight ? 'w-full h-full flex-1 min-h-0' : 'relative w-full',
      props.class,
      readonly
        ? 'bg-zinc-50/40 dark:bg-zinc-900/40'
        : 'focus-within:border-emerald-500 dark:focus-within:border-emerald-500',
      isDraggingFile ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
    ]"
    tabindex="-1"
    @keydown="handleKeyDown"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- 隐藏的文件选择 input -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="computedAccept"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- 顶部 Header 工具栏组件 -->
    <EditorHeader
      v-if="showHeader"
      :title="title"
      :language="language"
      :readonly="readonly"
      :show-language="showLanguage"
      :show-stats="showStats"
      :show-fold="showFold"
      :code-folding="codeFolding"
      :is-all-folded="cm.isAllFolded.value"
      :show-wrap="showWrap"
      :is-wrapped="cm.isWrapped.value"
      :show-search="showSearch"
      :clearable="clearable"
      :has-content="Boolean(modelValue)"
      :show-open="showOpen"
      :show-copy="showCopy"
      :copied="copied"
      :show-download="showDownload"
      :downloaded="downloaded"
      :line-count="lineCount"
      :char-count-formatted="charCountFormatted"
      :current-language-label="currentLanguageLabel"
      @toggle-fold="cm.toggleFoldAll"
      @toggle-wrap="cm.toggleWordWrap"
      @search="cm.openSearch"
      @clear="handleClear"
      @open="triggerOpenFile"
      @copy="handleCopy"
      @download="handleDownload"
    >
      <template v-if="$slots['header-left']" #header-left>
        <slot name="header-left" />
      </template>
      <template v-if="$slots['title-icon']" #title-icon>
        <slot name="title-icon" />
      </template>
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
      <template v-if="$slots['header-right']" #header-right>
        <slot name="header-right" />
      </template>
    </EditorHeader>

    <!-- 编辑器核心 Host 挂载节点 -->
    <div
      ref="editorHost"
      class="editor-host relative w-full min-h-0"
      :class="[
        autoHeight ? 'cm-auto-height' : 'cm-scroll-height flex-1 overflow-hidden'
      ]"
      :style="{
        height: (fillHeight || autoHeight) ? undefined : maxHeightRem,
        minHeight: minHeightRem,
        maxHeight: maxHeightRem
      }"
    />

    <!-- 拖拽文件进入悬浮提示遮罩 -->
    <div
      v-if="isDraggingFile"
      class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-emerald-50/95 dark:bg-emerald-950/95 backdrop-blur-xs border-2 border-dashed border-emerald-500 rounded-xl pointer-events-none transition-all select-none gap-1"
    >
      <FolderOpen class="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-bounce mb-1" />
      <p class="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
        释放鼠标以载入该文件
      </p>
      <p class="text-xs text-emerald-600/80 dark:text-emerald-400/80">
        文件内容将直接读取至编辑器中
      </p>
    </div>

    <!-- 底部插槽 (可选) -->
    <slot name="footer" />
  </div>
</template>
