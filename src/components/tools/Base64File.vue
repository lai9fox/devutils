<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import {
  Upload,
  FileDigit,
  Download,
  Trash2,
  Sparkles,
  AlertCircle,
  FolderArchive
} from '@lucide/vue'
import { UiButton, UiSegmented, UiCheckbox, UiInput, UiSplitPane, message } from '../ui'
import {
  bytesToBase64,
  base64ToBytes,
  parseDataUrl,
  buildDataUrl,
  detectMimeFromBytes,
  formatBytes,
  calculateExpansionRatio,
  type Base64LineBreak
} from '../../utils/base64'

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDraggingOver = ref(false)

// 文件状态
const currentFileName = ref<string>('')
const currentMimeType = ref<string>('application/octet-stream')
const currentFileExt = ref<string>('bin')
const originalByteLength = ref<number>(0)
const base64Content = ref<string>('')
const targetDownloadName = ref<string>('restored-file')

// 格式配置
const outputFormat = ref<'data-url' | 'pure-base64'>('data-url')
const urlSafe = ref<boolean>(false)
const lineBreak = ref<Base64LineBreak>('none')
const isLargeFileWarning = ref(false)

// 纯 Base64
const pureBase64 = computed(() => {
  const code = base64Content.value.trim()
  const commaIndex = code.indexOf(',')
  if (code.startsWith('data:') && commaIndex !== -1) {
    return code.slice(commaIndex + 1).replace(/[\r\n\s]/g, '')
  }
  return code.replace(/[\r\n\s]/g, '')
})

const expansionInfo = computed(() => {
  if (!originalByteLength.value || !base64Content.value) return null
  return calculateExpansionRatio(originalByteLength.value, base64Content.value.length)
})

// 处理文件读取
async function processFile(file: File) {
  if (!file) return

  // 大文件警告 (大于 15MB 文本渲染可能会稍慢)
  if (file.size > 15 * 1024 * 1024) {
    isLargeFileWarning.value = true
  } else {
    isLargeFileWarning.value = false
  }

  try {
    currentFileName.value = file.name
    targetDownloadName.value = file.name
    originalByteLength.value = file.size

    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // 智能检测 MIME
    const detected = detectMimeFromBytes(bytes, file.name)
    currentMimeType.value = detected.mime
    currentFileExt.value = detected.ext

    const rawB64 = bytesToBase64(bytes, {
      urlSafe: urlSafe.value,
      lineBreak: lineBreak.value
    })

    if (outputFormat.value === 'data-url') {
      base64Content.value = buildDataUrl(currentMimeType.value, rawB64)
    } else {
      base64Content.value = rawB64
    }

    message.success(`文件 ${file.name} 转换完成`)
  } catch (err) {
    message.error(`文件读取失败: ${(err as Error).message}`)
  }
}

// 监听 Base64 输入以反向推断文件信息
let parseTimer: ReturnType<typeof setTimeout> | null = null
function handleBase64Input(val: string) {
  base64Content.value = val
  if (parseTimer) clearTimeout(parseTimer)
  parseTimer = setTimeout(() => {
    inspectAndSyncFromFileBase64(val)
  }, 200)
}

function inspectAndSyncFromFileBase64(val: string) {
  const trimmed = val.trim()
  if (!trimmed) {
    originalByteLength.value = 0
    currentFileName.value = ''
    return
  }

  try {
    let resolvedMime = currentMimeType.value
    let b64 = trimmed

    if (trimmed.startsWith('data:')) {
      const parsed = parseDataUrl(trimmed)
      if (parsed) {
        resolvedMime = parsed.mimeType
        currentMimeType.value = resolvedMime
        b64 = parsed.data
      }
    }

    // 解码头部字节以识别真实 MIME
    try {
      const { bytes } = base64ToBytes(b64.slice(0, 128))
      const detected = detectMimeFromBytes(bytes)
      if (detected.mime && detected.mime !== 'application/octet-stream') {
        currentMimeType.value = detected.mime
        currentFileExt.value = detected.ext
      }
    } catch {
      // ignore
    }

    // 计算还原后的真实文件字节数
    try {
      const { bytes } = base64ToBytes(b64)
      originalByteLength.value = bytes.length
    } catch {
      originalByteLength.value = Math.max(0, Math.floor((b64.length * 3) / 4))
    }

    if (!currentFileName.value) {
      currentFileName.value = `restored-file.${currentFileExt.value}`
      targetDownloadName.value = currentFileName.value
    }
  } catch {
    // 忽略非法 Base64 格式
  }
}

// 文件选择事件
function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    void processFile(input.files[0])
    input.value = ''
  }
}

// 拖拽事件
function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDraggingOver.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDraggingOver.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDraggingOver.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    void processFile(e.dataTransfer.files[0])
  }
}

// 还原并下载文件
function downloadRestoredFile() {
  if (!pureBase64.value) {
    message.warning('没有可供下载的 Base64 数据')
    return
  }

  try {
    const { bytes } = base64ToBytes(pureBase64.value)
    const blob = new Blob([bytes], { type: currentMimeType.value })

    let filename = targetDownloadName.value.trim()
    if (!filename) {
      filename = `devutils-file.${currentFileExt.value || 'bin'}`
    } else if (!filename.includes('.')) {
      filename = `${filename}.${currentFileExt.value || 'bin'}`
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success(`成功下载 ${filename}`)
  } catch (err) {
    message.error(`还原文件失败: ${(err as Error).message}`)
  }
}

// 示例：载入一个小型 PDF 文件
function loadSampleFile() {
  // 一个极简但结构合法的 PDF 样本
  const samplePdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 55 >> stream
BT /F1 18 Tf 50 80 Td (Hello DevUtils Base64!) Tj ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000236 00000 n 
0000000342 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
423
%%EOF`

  const bytes = new TextEncoder().encode(samplePdf)
  const b64 = bytesToBase64(bytes)
  currentFileName.value = 'devutils-sample.pdf'
  targetDownloadName.value = 'devutils-sample.pdf'
  originalByteLength.value = bytes.length
  currentMimeType.value = 'application/pdf'
  currentFileExt.value = 'pdf'

  base64Content.value =
    outputFormat.value === 'data-url' ? buildDataUrl('application/pdf', b64) : b64

  message.success('已载入示例 PDF 文件')
}

function handleClear() {
  currentFileName.value = ''
  targetDownloadName.value = ''
  base64Content.value = ''
  originalByteLength.value = 0
}

watch([outputFormat, urlSafe, lineBreak], () => {
  if (!pureBase64.value) return
  try {
    const { bytes } = base64ToBytes(pureBase64.value)
    const formatted = bytesToBase64(bytes, {
      urlSafe: urlSafe.value,
      lineBreak: lineBreak.value
    })
    if (outputFormat.value === 'data-url') {
      base64Content.value = buildDataUrl(currentMimeType.value, formatted)
    } else {
      base64Content.value = formatted
    }
  } catch {
    // ignore
  }
})

onBeforeUnmount(() => {
  if (parseTimer) clearTimeout(parseTimer)
})
</script>

<template>
  <div class="flex h-full min-h-0 min-h-full w-full flex-1 flex-col gap-2.5">
    <!-- 隐藏文件输入框 -->
    <input ref="fileInputRef" type="file" class="hidden" @change="handleFileSelect" />

    <!-- 顶部工具栏 -->
    <div
      class="flex shrink-0 flex-wrap items-center justify-between gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-xs dark:border-zinc-800 dark:bg-[#121215]"
    >
      <div class="flex flex-wrap items-center gap-2">
        <!-- 上传任意文件 -->
        <UiButton variant="primary" @click="() => fileInputRef?.click()">
          <template #prefix>
            <Upload class="h-3.5 w-3.5" />
          </template>
          选择文件
        </UiButton>

        <!-- 示例文件 -->
        <UiButton variant="secondary" @click="loadSampleFile">
          <template #prefix>
            <Sparkles class="h-3.5 w-3.5 text-emerald-500" />
          </template>
          示例文件 (PDF)
        </UiButton>

        <!-- 清空按钮 (紧跟示例文件右边) -->
        <UiButton
          variant="danger-hover"
          :disabled="!currentFileName && !base64Content"
          title="清空当前文件与 Base64 内容"
          @click="handleClear"
        >
          <template #prefix>
            <Trash2
              class="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-rose-500 dark:group-hover:text-rose-400"
            />
          </template>
          清空
        </UiButton>

        <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

        <!-- 格式控制 -->
        <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span class="shrink-0 select-none">输出:</span>
          <UiSegmented
            v-model="outputFormat"
            size="sm"
            :options="[
              { label: 'Data URL', value: 'data-url' },
              { label: '纯 Base64', value: 'pure-base64' }
            ]"
          />
        </div>

        <UiCheckbox
          v-model="urlSafe"
          size="sm"
          class="box-border h-8 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-xs whitespace-nowrap text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/60 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          URL-Safe
        </UiCheckbox>

        <!-- 分行控制 -->
        <div class="flex h-8 items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span class="shrink-0 select-none">分行:</span>
          <UiSegmented
            v-model="lineBreak"
            size="sm"
            :options="[
              { label: '单行', value: 'none' },
              { label: 'PEM (64)', value: 64 },
              { label: 'MIME (76)', value: 76 }
            ]"
          />
        </div>
      </div>
    </div>

    <!-- 双栏工作台：紧接 Header，零多余外置元素，杜绝抖动 -->
    <UiSplitPane>
      <!-- 左栏：文件拖拽区与详细元信息卡片 -->
      <template #left>
        <div
          class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-[#121215]"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <!-- 标题栏 -->
          <div
            class="flex h-10 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-zinc-50/50 px-3 select-none dark:border-zinc-800/80 dark:bg-zinc-900/40"
          >
            <span
              class="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200"
            >
              <FileDigit class="h-3.5 w-3.5 text-emerald-500" />
              文件信息与还原下载
            </span>
          </div>

          <div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            <!-- 激活状态：文件卡片 -->
            <div v-if="currentFileName || base64Content" class="space-y-4">
              <!-- 大文件提示 (置于卡片内，不抖动外层) -->
              <div
                v-if="isLargeFileWarning"
                class="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <AlertCircle class="h-4 w-4 shrink-0" />
                <span>文件较大，推荐直接点击“下载还原文件”进行传输与保存。</span>
              </div>

              <!-- 文件摘要卡片 -->
              <div
                class="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                  >
                    <FolderArchive class="h-6 w-6" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <h4 class="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {{ currentFileName || '已载入 Base64 数据' }}
                    </h4>
                    <p class="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      MIME: {{ currentMimeType }}
                    </p>
                  </div>
                </div>

                <!-- 详细属性表 -->
                <div
                  class="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-200/60 pt-3 text-xs dark:border-zinc-800"
                >
                  <div>
                    <span class="text-zinc-400">原始大小:</span>
                    <span class="ml-1 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                      {{ formatBytes(originalByteLength) }}
                    </span>
                  </div>
                  <div>
                    <span class="text-zinc-400">Base64 大小:</span>
                    <span class="ml-1 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                      {{ formatBytes(base64Content.length) }}
                    </span>
                  </div>
                  <div class="col-span-2">
                    <span class="text-zinc-400">体积变化:</span>
                    <span
                      v-if="expansionInfo"
                      class="py-0.2 ml-1 rounded px-1.5 font-mono text-[11px] font-semibold"
                      :class="
                        expansionInfo.ratio > 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      "
                    >
                      {{
                        expansionInfo.ratio > 0
                          ? `+${expansionInfo.ratio}% (膨胀约 1/3)`
                          : `${expansionInfo.ratio}%`
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 还原下载操作区 -->
              <div
                class="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <h5 class="mb-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  还原下载为本地文件
                </h5>

                <div class="space-y-3">
                  <div>
                    <label class="mb-1 block text-[11px] text-zinc-400">自定义下载文件名:</label>
                    <UiInput
                      v-model="targetDownloadName"
                      placeholder="例如 document.pdf"
                      class="w-full"
                    />
                  </div>

                  <UiButton
                    variant="primary"
                    class="w-full justify-center"
                    :disabled="!pureBase64"
                    @click="downloadRestoredFile"
                  >
                    <template #prefix>
                      <Download class="h-4 w-4" />
                    </template>
                    下载还原文件
                  </UiButton>
                </div>
              </div>
            </div>

            <!-- 空状态：拖拽与上传提示 -->
            <div
              v-else
              class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center select-none"
            >
              <div
                class="flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/80 text-zinc-400 transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/30"
                @click="() => fileInputRef?.click()"
              >
                <Upload class="h-7 w-7" />
              </div>

              <div>
                <p class="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  拖拽任意文件到这里，或
                  <button
                    type="button"
                    class="cursor-pointer text-emerald-600 underline hover:text-emerald-500 dark:text-emerald-400"
                    @click="() => fileInputRef?.click()"
                  >
                    点击选择文件
                  </button>
                </p>
                <p class="mt-1 text-xs text-zinc-400">
                  支持 PDF、ZIP、MP3、DOCX、可执行文件等任意格式
                </p>
              </div>
            </div>
          </div>

          <!-- 拖拽高亮蒙版 -->
          <div
            v-if="isDraggingOver"
            class="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-emerald-50/90 backdrop-blur-xs dark:bg-emerald-950/90"
          >
            <Upload class="h-10 w-10 animate-bounce text-emerald-600 dark:text-emerald-400" />
            <p class="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              松开鼠标以载入该文件
            </p>
          </div>
        </div>
      </template>

      <!-- 右栏：Base64 结果代码框 -->
      <template #right>
        <CodeEditor
          :model-value="base64Content"
          :title="outputFormat === 'data-url' ? '文件 Data URL' : '文件 Base64 编码'"
          language="plain"
          filename="file-base64.txt"
          clearable
          line-wrapping
          placeholder="在此粘贴任意文件的 Base64 编码或 Data URL，系统将自动基于头部字节推测 MIME 并提供还原下载..."
          @update:model-value="handleBase64Input"
          @clear="handleClear"
        />
      </template>
    </UiSplitPane>
  </div>
</template>
