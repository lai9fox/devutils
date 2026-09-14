<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import {
  Upload,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Command
} from '@lucide/vue'
import { UiButton, UiSegmented, UiSplitPane, message } from '../ui'
import {
  bytesToBase64,
  base64ToBytes,
  parseDataUrl,
  buildDataUrl,
  detectMimeFromBytes,
  formatBytes,
  calculateExpansionRatio
} from '../../utils/base64'
import { triggerFileDownload } from '../../utils/file-download'
import { isMac } from '../../utils/platform'

// 基础状态
const isMacPlatform = ref(false)
const imageSrc = ref<string>('')
const base64Code = ref<string>('')
const outputFormat = ref<'data-url' | 'pure-base64'>('data-url')
const mimeType = ref<string>('image/png')
const fileExtension = ref<string>('png')
const originalFileName = ref<string>('image.png')
const originalFileSize = ref<number>(0)
const imageDimensions = ref<{ width: number; height: number } | null>(null)

// 视图缩放控制
const zoomLevel = ref<number>(1)
const isFit = ref<boolean>(true)
const isDraggingOver = ref<boolean>(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 复制状态
const copiedSnippet = ref<string | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null

// 统计计算
const base64Length = computed(() => {
  return base64Code.value.length
})

const expansionInfo = computed(() => {
  if (!originalFileSize.value || !base64Length.value) return null
  return calculateExpansionRatio(originalFileSize.value, base64Length.value)
})

// 提取当前纯 Base64 内容（去除 data:image/...;base64, 前缀）
const pureBase64 = computed(() => {
  const code = base64Code.value.trim()
  const commaIndex = code.indexOf(',')
  if (code.startsWith('data:') && commaIndex !== -1) {
    return code.slice(commaIndex + 1).replace(/[\r\n\s]/g, '')
  }
  return code.replace(/[\r\n\s]/g, '')
})

// 生成各种格式的代码片段
const fullDataUrl = computed(() => {
  if (!pureBase64.value) return ''
  return buildDataUrl(mimeType.value, pureBase64.value)
})

const htmlSnippet = computed(() => {
  if (!fullDataUrl.value) return ''
  return `<img src="${fullDataUrl.value}" alt="image" />`
})

const cssSnippet = computed(() => {
  if (!fullDataUrl.value) return ''
  return `background-image: url("${fullDataUrl.value}");`
})

const markdownSnippet = computed(() => {
  if (!fullDataUrl.value) return ''
  return `![image](${fullDataUrl.value})`
})

// 加载并解析 File 对象
async function processImageFile(file: File) {
  if (
    !file.type.startsWith('image/') &&
    !file.name.match(/\.(png|jpe?g|gif|webp|svg|ico|avif|bmp)$/i)
  ) {
    message.warning('请选择合法的图片文件 (PNG, JPG, SVG, WebP, GIF, ICO 等)')
    return
  }

  try {
    originalFileName.value = file.name
    originalFileSize.value = file.size
    mimeType.value = file.type || 'image/png'

    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // 基于 Magic Number 检测真实 MIME
    const detected = detectMimeFromBytes(bytes, file.name)
    if (detected.mime && detected.mime.startsWith('image/')) {
      mimeType.value = detected.mime
      fileExtension.value = detected.ext
    }

    const rawB64 = bytesToBase64(bytes)
    const dataUrl = buildDataUrl(mimeType.value, rawB64)

    imageSrc.value = dataUrl
    base64Code.value = outputFormat.value === 'data-url' ? dataUrl : rawB64
    message.success('图片载入成功')
  } catch (err) {
    message.error(`读取图片失败: ${(err as Error).message}`)
  }
}

// 当用户直接在右侧编辑或粘贴 Base64 时，反推渲染左侧图片
let syncTimer: ReturnType<typeof setTimeout> | null = null
function handleBase64Input(val: string) {
  base64Code.value = val
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    syncFromBase64Text(val)
  }, 200)
}

function syncFromBase64Text(val: string) {
  const trimmed = val.trim()
  if (!trimmed) {
    imageSrc.value = ''
    imageDimensions.value = null
    originalFileSize.value = 0
    return
  }

  try {
    let resolvedDataUrl = trimmed
    let resolvedMime = mimeType.value

    if (trimmed.startsWith('data:')) {
      const parsed = parseDataUrl(trimmed)
      if (parsed) {
        resolvedMime = parsed.mimeType
        mimeType.value = resolvedMime
        resolvedDataUrl = trimmed
      }
    } else {
      // 纯 Base64，尝试解码头几个字节识别 MIME
      try {
        const { bytes } = base64ToBytes(trimmed.slice(0, 100))
        const detected = detectMimeFromBytes(bytes)
        if (detected.mime && detected.mime.startsWith('image/')) {
          resolvedMime = detected.mime
          mimeType.value = resolvedMime
          fileExtension.value = detected.ext
        }
      } catch {
        // ignore
      }
      resolvedDataUrl = buildDataUrl(resolvedMime, trimmed)
    }

    // 计算解码后近似体积
    try {
      const { bytes } = base64ToBytes(trimmed)
      originalFileSize.value = bytes.length
    } catch {
      originalFileSize.value = Math.round((trimmed.length * 3) / 4)
    }

    imageSrc.value = resolvedDataUrl
  } catch {
    // 非法 Base64
  }
}

// 监听图片加载成功，获取自然宽高
function onImageLoaded(e: Event) {
  const img = e.target as HTMLImageElement
  imageDimensions.value = {
    width: img.naturalWidth,
    height: img.naturalHeight
  }
}

function onImageError() {
  imageDimensions.value = null
}

// 文件选择事件
function handleFileInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    void processImageFile(input.files[0])
    input.value = ''
  }
}

// 拖拽事件处理
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
    void processImageFile(e.dataTransfer.files[0])
  }
}

// 粘贴事件监听 (支持全局粘贴屏幕截图)
function handlePaste(e: ClipboardEvent) {
  if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
    const file = e.clipboardData.files[0]
    if (file.type.startsWith('image/')) {
      e.preventDefault()
      void processImageFile(file)
    }
  }
}

// 缩放控制
function zoomIn() {
  isFit.value = false
  zoomLevel.value = Math.min(zoomLevel.value + 0.25, 4)
}

function zoomOut() {
  isFit.value = false
  zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.25)
}

function resetZoom() {
  isFit.value = true
  zoomLevel.value = 1
}

// 复制代码片段
async function copySnippet(text: string, type: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedSnippet.value = type
    message.success(`已复制 ${type}`)
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedSnippet.value = null
    }, 2000)
  } catch {
    message.error('复制失败')
  }
}

// 下载图片
function downloadImage() {
  if (!pureBase64.value) {
    message.warning('没有可供下载的图片数据')
    return
  }
  try {
    const { bytes } = base64ToBytes(pureBase64.value)
    const blob = new Blob([bytes], { type: mimeType.value })
    const ext = fileExtension.value || 'png'
    const name = originalFileName.value.replace(/\.[^.]+$/, '') || 'devutils-image'
    const filename = `${name}.${ext}`

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
    message.error(`下载失败: ${(err as Error).message}`)
  }
}

// 加载示例图片
function loadSampleImage() {
  // 一个精美的 SVG 示例图标
  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(#g)"/><circle cx="50" cy="50" r="26" fill="white" fill-opacity="0.25"/><path d="M35 50L45 60L65 40" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
  const bytes = new TextEncoder().encode(sampleSvg)
  const b64 = bytesToBase64(bytes)
  originalFileName.value = 'devutils-sample.svg'
  originalFileSize.value = bytes.length
  mimeType.value = 'image/svg+xml'
  fileExtension.value = 'svg'

  const dataUrl = buildDataUrl('image/svg+xml', b64)
  imageSrc.value = dataUrl
  base64Code.value = outputFormat.value === 'data-url' ? dataUrl : b64
  message.success('已载入示例矢量图标')
}

function handleClear() {
  imageSrc.value = ''
  base64Code.value = ''
  imageDimensions.value = null
  originalFileSize.value = 0
}

watch(outputFormat, (fmt) => {
  if (!pureBase64.value) return
  if (fmt === 'data-url') {
    base64Code.value = buildDataUrl(mimeType.value, pureBase64.value)
  } else {
    base64Code.value = pureBase64.value
  }
})

onMounted(() => {
  isMacPlatform.value = isMac()
  window.addEventListener('paste', handlePaste)
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste)
  if (syncTimer) clearTimeout(syncTimer)
  if (copyTimer) clearTimeout(copyTimer)
})
</script>

<template>
  <div class="flex h-full min-h-0 min-h-full w-full flex-1 flex-col gap-2.5">
    <!-- 隐藏文件上传 input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*,.svg,.ico"
      class="hidden"
      @change="handleFileInputChange"
    />

    <!-- 工具栏 -->
    <div
      class="flex shrink-0 flex-wrap items-center justify-between gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-xs dark:border-zinc-800 dark:bg-[#121215]"
    >
      <div class="flex flex-wrap items-center gap-2">
        <!-- 上传图片按钮 -->
        <UiButton variant="primary" @click="() => fileInputRef?.click()">
          <template #prefix>
            <Upload class="h-3.5 w-3.5" />
          </template>
          上传图片
        </UiButton>

        <!-- 示例图片 -->
        <UiButton variant="secondary" @click="loadSampleImage">
          <template #prefix>
            <Sparkles class="h-3.5 w-3.5 text-emerald-500" />
          </template>
          示例图片
        </UiButton>

        <!-- 清空按钮 (紧跟示例图片右边) -->
        <UiButton
          variant="danger-hover"
          :disabled="!imageSrc && !base64Code"
          title="清空当前图片与 Base64 内容"
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

        <!-- Base64 格式模式选择 (Data URL vs 纯 Base64) -->
        <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span class="shrink-0 select-none">输出格式:</span>
          <UiSegmented
            v-model="outputFormat"
            size="sm"
            :options="[
              { label: 'Data URL', value: 'data-url' },
              { label: '纯 Base64', value: 'pure-base64' }
            ]"
          />
        </div>

        <!-- 下载还原后的图片 -->
        <UiButton
          v-if="imageSrc"
          variant="secondary"
          title="将 Base64 还原下载为本地图片文件"
          @click="downloadImage"
        >
          <template #prefix>
            <Download class="h-3.5 w-3.5 text-emerald-500" />
          </template>
          下载图片
        </UiButton>
      </div>

      <!-- 右侧：快捷复制代码片段 (并入 header 右侧，彻底移除原下方突兀的浮动条) -->
      <div v-if="imageSrc" class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
          @click="() => copySnippet(fullDataUrl, 'Data URL')"
        >
          <Check v-if="copiedSnippet === 'Data URL'" class="h-3 w-3 text-emerald-500" />
          <Copy v-else class="h-3 w-3 text-zinc-400" />
          Data URL
        </button>

        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
          @click="() => copySnippet(pureBase64, '纯 Base64')"
        >
          <Check v-if="copiedSnippet === '纯 Base64'" class="h-3 w-3 text-emerald-500" />
          <Copy v-else class="h-3 w-3 text-zinc-400" />
          纯 Base64
        </button>

        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
          @click="() => copySnippet(htmlSnippet, 'HTML 标签')"
        >
          <Check v-if="copiedSnippet === 'HTML 标签'" class="h-3 w-3 text-emerald-500" />
          <Copy v-else class="h-3 w-3 text-zinc-400" />
          &lt;img&gt;
        </button>

        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
          @click="() => copySnippet(cssSnippet, 'CSS 代码')"
        >
          <Check v-if="copiedSnippet === 'CSS 代码'" class="h-3 w-3 text-emerald-500" />
          <Copy v-else class="h-3 w-3 text-zinc-400" />
          CSS
        </button>
      </div>
    </div>

    <!-- 双栏工作台：紧接 Header，零多余外置元素，杜绝抖动 -->
    <UiSplitPane>
      <!-- 左栏：预览与上传区域 -->
      <template #left>
        <div
          class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-[#121215]"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <!-- 预览区顶部微型工具栏 (内置图片元信息与缩放控制) -->
          <div
            class="flex h-10 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-zinc-50/50 px-3 select-none dark:border-zinc-800/80 dark:bg-zinc-900/40"
          >
            <div class="flex min-w-0 items-center gap-2 overflow-hidden">
              <span
                class="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200"
              >
                <ImageIcon class="h-3.5 w-3.5 text-emerald-500" />
                图片预览
              </span>

              <!-- 图片信息元标签：尺寸、MIME、膨胀比直接在左栏头部展示 -->
              <div
                v-if="imageSrc"
                class="flex min-w-0 items-center gap-1.5 overflow-hidden text-[11px]"
              >
                <span
                  class="py-0.2 rounded bg-emerald-100/70 px-1.5 font-mono font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  {{ mimeType }}
                </span>
                <span v-if="imageDimensions" class="font-mono text-zinc-500 dark:text-zinc-400">
                  {{ imageDimensions.width }}×{{ imageDimensions.height }}
                </span>
                <span
                  v-if="expansionInfo"
                  class="py-0.2 rounded px-1 font-mono text-[10px]"
                  :class="
                    expansionInfo.ratio > 0
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  "
                >
                  +{{ expansionInfo.ratio }}%
                </span>
              </div>
            </div>

            <div v-if="imageSrc" class="flex items-center gap-1">
              <button
                type="button"
                class="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                title="缩小"
                @click="zoomOut"
              >
                <ZoomOut class="h-3.5 w-3.5" />
              </button>

              <span class="w-10 text-center font-mono text-[11px] text-zinc-500">
                {{ isFit ? '自适应' : `${Math.round(zoomLevel * 100)}%` }}
              </span>

              <button
                type="button"
                class="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                title="放大"
                @click="zoomIn"
              >
                <ZoomIn class="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                class="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                title="自适应"
                @click="resetZoom"
              >
                <Maximize2 class="h-3 w-3" />
              </button>
            </div>
          </div>

          <!-- 图片展示画布 / 空拖拽区 -->
          <div
            class="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-4"
            :class="imageSrc ? 'bg-checkerboard' : 'bg-zinc-50/50 dark:bg-zinc-950/50'"
          >
            <!-- 激活状态下的图片渲染 -->
            <div
              v-if="imageSrc"
              class="flex items-center justify-center transition-transform duration-150 ease-out"
              :style="{
                transform: isFit ? 'none' : `scale(${zoomLevel})`,
                maxWidth: isFit ? '100%' : 'none',
                maxHeight: isFit ? '100%' : 'none'
              }"
            >
              <img
                :src="imageSrc"
                alt="Base64 Preview"
                class="rounded-md object-contain shadow-md"
                :class="isFit ? 'max-h-full max-w-full' : ''"
                @load="onImageLoaded"
                @error="onImageError"
              />
            </div>

            <!-- 空状态：拖拽提示框 -->
            <div
              v-else
              class="flex flex-col items-center justify-center gap-3 p-6 text-center select-none"
            >
              <div
                class="flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/80 text-zinc-400 transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/30"
                @click="() => fileInputRef?.click()"
              >
                <Upload class="h-7 w-7" />
              </div>

              <div>
                <p class="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  拖拽图片到这里，或
                  <button
                    type="button"
                    class="cursor-pointer text-emerald-600 underline hover:text-emerald-500 dark:text-emerald-400"
                    @click="() => fileInputRef?.click()"
                  >
                    点击上传
                  </button>
                </p>
                <p class="mt-1 text-xs text-zinc-400">
                  支持 PNG、JPG、WebP、SVG、GIF，也可直接使用
                  <kbd
                    class="inline-flex items-center rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    <span class="shortcut-mac items-center gap-0.5">
                      <Command class="h-2.5 w-2.5" />
                      <span>V</span>
                    </span>
                    <span class="shortcut-win items-center">
                      <span>Ctrl + V</span>
                    </span>
                  </kbd>
                  粘贴剪贴板截图
                </p>
              </div>
            </div>

            <!-- 拖拽覆盖遮罩 -->
            <div
              v-if="isDraggingOver"
              class="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-emerald-50/90 backdrop-blur-xs dark:bg-emerald-950/90"
            >
              <Upload class="h-10 w-10 animate-bounce text-emerald-600 dark:text-emerald-400" />
              <p class="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                松开鼠标以载入图片
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- 右栏：Base64 代码编辑器 -->
      <template #right>
        <CodeEditor
          :model-value="base64Code"
          :title="outputFormat === 'data-url' ? 'Data URL (包含 MIME)' : '纯 Base64 编码'"
          language="plain"
          filename="image-base64.txt"
          clearable
          line-wrapping
          placeholder="在此粘贴图片 Data URL 或 Base64 编码，左侧将即时解码渲染预览..."
          @update:model-value="handleBase64Input"
          @clear="handleClear"
        />
      </template>
    </UiSplitPane>
  </div>
</template>

<style scoped>
/* 棋盘格透明背景，便于预览透明 PNG 和 SVG */
.bg-checkerboard {
  background-color: #f8fafc;
  background-image:
    linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0px;
}

:global(.dark) .bg-checkerboard {
  background-color: #0c0c0f;
  background-image:
    linear-gradient(45deg, #1e1e24 25%, transparent 25%),
    linear-gradient(-45deg, #1e1e24 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #1e1e24 75%),
    linear-gradient(-45deg, transparent 75%, #1e1e24 75%);
}
</style>
