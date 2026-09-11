<script setup lang="ts">
import { ref, computed } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import { validateJson, type ValidationResult } from '../../utils/json-validator'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  ShieldCheck,
  FileCode2,
  Layers,
  Hash,
  Binary,
  Check
} from '@lucide/vue'
import { UiButton, UiSplitPane } from '../ui'

const inputJson = ref('')

// 即时同步校验，无防抖延迟
const validationResult = computed<ValidationResult | null>(() => {
  const text = inputJson.value
  if (!text.trim()) return null
  return validateJson(text)
})

// 输入文本的统计信息（用于异常状态下依然保持统一指标看板）
const inputStats = computed(() => {
  const text = inputJson.value
  if (!text) return { lines: 0, byteSize: 0, charCount: 0 }
  const lines = text.split('\n').length
  const byteSize = new TextEncoder().encode(text).length
  const charCount = text.length
  return { lines, byteSize, charCount }
})

function handleApplyRepair() {
  if (
    validationResult.value &&
    !validationResult.value.isValid &&
    validationResult.value.canRepair &&
    validationResult.value.repairedPreview
  ) {
    inputJson.value = validationResult.value.repairedPreview
  }
}

function handleClear() {
  inputJson.value = ''
}
</script>

<template>
  <!-- 主体双栏区域：左侧代码编辑器，右侧诊断看板，全高填满，支持拖拽重分配宽度 (默认 60%:40%) -->
  <UiSplitPane :default-percent="60">
    <!-- 左侧：代码编辑器 -->
    <template #left>
      <CodeEditor
        v-model="inputJson"
        title="待检测 JSON 文本"
        language="json"
        filename="devutils-validated.json"
        clearable
        placeholder="在此粘贴或输入需要验证的 JSON 代码..."
        @clear="handleClear"
      />
    </template>

    <!-- 右侧：诊断报告与状态看板 (固定容器 + 42px 标头对齐 + 恒定结构，杜绝跳动) -->
    <template #right>
      <div
        class="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-[#121215]"
      >
        <!-- 统一顶部标题栏 (与左侧 CodeEditor 42px 严格水平对齐) -->
        <div
          class="box-border flex h-[42px] shrink-0 items-center justify-between border-b border-zinc-200/80 bg-zinc-50/80 px-3 backdrop-blur-xs select-none dark:border-zinc-800/80 dark:bg-[#18181d]"
        >
          <div
            class="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200"
          >
            <ShieldCheck class="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>RFC 8259 校验诊断</span>
          </div>

          <div class="flex items-center gap-1.5">
            <span
              v-if="!validationResult"
              class="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 select-none dark:bg-zinc-800 dark:text-zinc-400"
            >
              <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              等待输入
            </span>
            <span
              v-else-if="validationResult.isValid"
              class="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 select-none dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              通过 (VALID)
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 rounded-md border border-red-200/60 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 select-none dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300"
            >
              <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              异常 (INVALID)
            </span>
          </div>
        </div>

        <!-- 右侧内容滚动区：模块化三段式排布 (状态 Banner + 2x2 指标看板 + 详细诊断建议) -->
        <div class="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-3.5 sm:p-4">
          <!-- 1. 检测状态 Banner：图标调大至 w-11 h-11，与主文本(20px) + 次文本(20px) 两行高度严格对齐一致 -->
          <!-- A. 校验通过状态 -->
          <div
            v-if="validationResult?.isValid"
            class="flex items-center gap-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 shadow-xs sm:p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30"
          >
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400"
            >
              <CheckCircle2 class="h-6.5 w-6.5" />
            </span>
            <div class="flex min-w-0 flex-1 flex-col justify-center">
              <h3 class="text-sm leading-5 font-bold text-emerald-950 dark:text-emerald-100">
                JSON 语法完全合法
              </h3>
              <p class="mt-0.5 text-xs leading-5 text-emerald-700/90 dark:text-emerald-400/80">
                完全符合 RFC 8259 标准规范，结构严密无语法错误。
              </p>
            </div>
          </div>

          <!-- B. 校验异常状态 -->
          <div
            v-else-if="validationResult && !validationResult.isValid"
            class="flex items-center gap-3.5 rounded-xl border border-red-200/80 bg-red-50/70 p-3.5 shadow-xs sm:p-4 dark:border-red-900/60 dark:bg-red-950/30"
          >
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/80 dark:text-red-400"
            >
              <XCircle class="h-6.5 w-6.5" />
            </span>
            <div class="flex min-w-0 flex-1 flex-col justify-center">
              <div class="flex items-center justify-between gap-2">
                <h3 class="truncate text-sm leading-5 font-bold text-red-950 dark:text-red-100">
                  {{ validationResult.friendlyMessage }}
                </h3>
                <span
                  class="shrink-0 rounded-md border border-red-200/80 bg-white/90 px-2 py-0.5 font-mono text-xs font-medium text-red-600 select-none dark:border-red-900/60 dark:bg-zinc-800 dark:text-red-400"
                >
                  {{ validationResult.location.line }}:{{ validationResult.location.column }}
                </span>
              </div>
              <p class="mt-0.5 text-xs leading-5 text-red-700/90 dark:text-red-400/80">
                在第 {{ validationResult.location.line }} 行第
                {{ validationResult.location.column }} 列（偏移
                {{ validationResult.location.position }}）发现异常标记
              </p>
            </div>
          </div>

          <!-- C. 等待输入状态 -->
          <div
            v-else
            class="flex items-center gap-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3.5 shadow-xs sm:p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40"
          >
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
            >
              <ShieldCheck class="h-6.5 w-6.5" />
            </span>
            <div class="flex min-w-0 flex-1 flex-col justify-center">
              <h3 class="text-sm leading-5 font-bold text-zinc-800 dark:text-zinc-200">
                等待输入 JSON 文本
              </h3>
              <p class="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                在左侧编辑器输入或粘贴内容，系统将即时按 RFC 8259 规范校验语法
              </p>
            </div>
          </div>

          <!-- 2. 数据指标看板 (在所有状态下均为 2x2 网格，保持视觉结构绝对稳定) -->
          <!-- A. 校验通过指标 -->
          <div v-if="validationResult?.isValid" class="flex flex-col gap-2">
            <span class="px-0.5 text-xs font-semibold text-zinc-500 select-none dark:text-zinc-400">
              数据结构概览
            </span>
            <div class="grid grid-cols-2 gap-2.5">
              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <Layers class="h-3.5 w-3.5" />
                  <span>根节点类型</span>
                </div>
                <span
                  class="mt-1.5 font-mono text-xs font-semibold text-zinc-800 uppercase dark:text-zinc-200"
                >
                  {{ validationResult.rootType }}
                </span>
              </div>

              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <Hash class="h-3.5 w-3.5" />
                  <span>总键名 (Keys)</span>
                </div>
                <span
                  class="mt-1.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  {{ validationResult.stats.keysCount }} 个
                </span>
              </div>

              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <FileCode2 class="h-3.5 w-3.5" />
                  <span>代码行数 / 大小</span>
                </div>
                <span
                  class="mt-1.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  {{ validationResult.stats.lines }} 行 /
                  {{ (validationResult.stats.byteSize / 1024).toFixed(2) }} KB
                </span>
              </div>

              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <Binary class="h-3.5 w-3.5" />
                  <span>最大嵌套深度</span>
                </div>
                <span
                  class="mt-1.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  {{ validationResult.stats.maxDepth }} 层
                </span>
              </div>
            </div>
          </div>

          <!-- B. 校验异常指标 -->
          <div
            v-else-if="validationResult && !validationResult.isValid"
            class="flex flex-col gap-2"
          >
            <span class="px-0.5 text-xs font-semibold text-zinc-500 select-none dark:text-zinc-400">
              异常诊断概览
            </span>
            <div class="grid grid-cols-2 gap-2.5">
              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <Layers class="h-3.5 w-3.5" />
                  <span>异常定位</span>
                </div>
                <span class="mt-1.5 font-mono text-xs font-semibold text-red-600 dark:text-red-400">
                  第 {{ validationResult.location.line }} 行 :
                  {{ validationResult.location.column }} 列
                </span>
              </div>

              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <Hash class="h-3.5 w-3.5" />
                  <span>字符偏移位置</span>
                </div>
                <span
                  class="mt-1.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  偏移 {{ validationResult.location.position }}
                </span>
              </div>

              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <FileCode2 class="h-3.5 w-3.5" />
                  <span>代码行数 / 大小</span>
                </div>
                <span
                  class="mt-1.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  {{ inputStats.lines }} 行 / {{ (inputStats.byteSize / 1024).toFixed(2) }} KB
                </span>
              </div>

              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <Binary class="h-3.5 w-3.5" />
                  <span>智能修复能力</span>
                </div>
                <span
                  class="mt-1.5 font-mono text-xs font-semibold"
                  :class="
                    validationResult.canRepair
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-500'
                  "
                >
                  {{ validationResult.canRepair ? '支持自动修复' : '需手动修正' }}
                </span>
              </div>
            </div>
          </div>

          <!-- C. 空状态规范看板 -->
          <div v-else class="flex flex-col gap-2">
            <span class="px-0.5 text-xs font-semibold text-zinc-500 select-none dark:text-zinc-400">
              检测规范看板
            </span>
            <div class="grid grid-cols-2 gap-2.5">
              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <Layers class="h-3.5 w-3.5" />
                  <span>核心标准</span>
                </div>
                <span
                  class="mt-1.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  RFC 8259 规范
                </span>
              </div>

              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <Hash class="h-3.5 w-3.5" />
                  <span>检测定位精度</span>
                </div>
                <span
                  class="mt-1.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  行 / 列 / 偏移量
                </span>
              </div>

              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <FileCode2 class="h-3.5 w-3.5" />
                  <span>容错引擎</span>
                </div>
                <span
                  class="mt-1.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  智能语法修复
                </span>
              </div>

              <div
                class="flex flex-col rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-800/40"
              >
                <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <Binary class="h-3.5 w-3.5" />
                  <span>数据安全</span>
                </div>
                <span
                  class="mt-1.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  纯本地离线计算
                </span>
              </div>
            </div>
          </div>

          <!-- 校验异常：诊断建议 + 一键修复 + 错误上下文 -->
          <template v-if="validationResult && !validationResult.isValid">
            <!-- 中文诊断修复建议 -->
            <div
              class="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs leading-relaxed text-zinc-700 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-zinc-300"
            >
              <div
                class="mb-1 flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200"
              >
                <AlertTriangle class="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>排错诊断建议</span>
              </div>
              <p class="leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                {{ validationResult.suggestion }}
              </p>
            </div>

            <!-- 一键修复快捷按钮（如果可以自动修复） -->
            <div v-if="validationResult.canRepair">
              <UiButton
                variant="warning-solid"
                size="md"
                class="w-full justify-center shadow-xs"
                @click="handleApplyRepair"
              >
                <template #prefix>
                  <Wrench class="h-4 w-4" />
                </template>
                <span>检测到可修复语法，点击一键自动修复</span>
              </UiButton>
            </div>

            <!-- 精确指针代码预览框 -->
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between px-0.5">
                <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400"
                  >错误上下文定位</span
                >
                <span class="font-mono text-[11px] text-zinc-400"
                  >第 {{ validationResult.location.line }} 行</span
                >
              </div>
              <div
                class="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-300 select-text"
              >
                <!-- 前置行 -->
                <div
                  v-for="line in validationResult.snippet.beforeLines"
                  :key="'before-' + line.lineNum"
                  class="flex gap-3 text-zinc-500 opacity-70"
                >
                  <span class="w-7 shrink-0 text-right select-none">{{ line.lineNum }}</span>
                  <span class="whitespace-pre">{{ line.text }}</span>
                </div>

                <!-- 错误行高亮 -->
                <div class="-mx-3 flex gap-3 bg-red-950/40 px-3 py-0.5 font-semibold text-red-400">
                  <span class="w-7 shrink-0 text-right text-red-500 select-none">{{
                    validationResult.snippet.errorLine.lineNum
                  }}</span>
                  <span class="whitespace-pre">{{ validationResult.snippet.errorLine.text }}</span>
                </div>

                <!-- 视差指示针行 -->
                <div class="-mx-3 flex gap-3 px-3 py-0.5 font-bold text-amber-400">
                  <span class="w-7 shrink-0 select-none" />
                  <span class="whitespace-pre">{{ validationResult.snippet.pointer }}</span>
                </div>

                <!-- 后置行 -->
                <div
                  v-for="line in validationResult.snippet.afterLines"
                  :key="'after-' + line.lineNum"
                  class="flex gap-3 text-zinc-500 opacity-70"
                >
                  <span class="w-7 shrink-0 text-right select-none">{{ line.lineNum }}</span>
                  <span class="whitespace-pre">{{ line.text }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </UiSplitPane>
</template>
