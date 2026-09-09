<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import { validateJson, type ValidationResult } from '../../utils/json-validator'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  Copy,
  Check,
  Trash2,
  FlaskConical,
  ArrowRight,
  ShieldCheck,
  FileCode2,
  Layers,
  Hash,
  Binary
} from '@lucide/vue'

const sampleValid = `{
  "product": "DevUtils",
  "version": "2.0.0",
  "features": [
    "JSON Formatter",
    "JSON Validator",
    "JSON Viewer",
    "JSON Path",
    "JSON Converter",
    "JSON to Type"
  ],
  "author": {
    "organization": "fox9dev",
    "localFirst": true
  }
}`

const sampleMissingComma = `{
  "name": "DevUtils"
  "version": "2.0.0",
  "author": "fox9dev"
}`

const sampleTrailingComma = `{
  "title": "Developer Toolkit",
  "tags": ["developer", "tools",],
  "active": true,
}`

const sampleSingleQuotes = `{
  name: 'DevUtils Tool',
  description: 'Fast local JSON validator'
}`

const sampleUnclosed = `{
  "name": "DevUtils",
  "metadata": {
    "stage": "preview"
`

const inputJson = ref(sampleValid)
const autoValidate = ref(true)
const copied = ref(false)

const validationResult = computed<ValidationResult>(() => {
  return validateJson(inputJson.value)
})

function handleLoadSample(type: 'valid' | 'missing-comma' | 'trailing-comma' | 'single-quotes' | 'unclosed') {
  switch (type) {
    case 'valid':
      inputJson.value = sampleValid
      break
    case 'missing-comma':
      inputJson.value = sampleMissingComma
      break
    case 'trailing-comma':
      inputJson.value = sampleTrailingComma
      break
    case 'single-quotes':
      inputJson.value = sampleSingleQuotes
      break
    case 'unclosed':
      inputJson.value = sampleUnclosed
      break
  }
}

function handleApplyRepair() {
  if (!validationResult.value.isValid && validationResult.value.canRepair && validationResult.value.repairedPreview) {
    inputJson.value = validationResult.value.repairedPreview
  }
}

async function handleCopy() {
  if (!inputJson.value) return
  await navigator.clipboard.writeText(inputJson.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1800)
}

function handleClear() {
  inputJson.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 顶部操作栏 -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
      <div class="flex flex-wrap items-center gap-2">
        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
          <ShieldCheck class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>RFC 8259 规范校验</span>
        </div>

        <!-- 样本快速体验下拉 -->
        <div class="flex items-center gap-1 ml-1 text-xs">
          <span class="text-zinc-500 dark:text-zinc-400">测试用例:</span>
          <select
            class="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-8 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 shadow-xs transition-colors cursor-pointer"
            @change="(e) => handleLoadSample((e.target as HTMLSelectElement).value as any)"
          >
            <option value="valid">✅ 标准合法 JSON</option>
            <option value="missing-comma">❌ 缺少逗号错误</option>
            <option value="trailing-comma">❌ 尾随逗号 (Trailing Comma)</option>
            <option value="single-quotes">❌ 单引号与未引键名</option>
            <option value="unclosed">❌ 未闭合大括号</option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          :class="copied ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200'"
          @click="handleCopy"
        >
          <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-600" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span>{{ copied ? '已复制' : '复制 JSON' }}</span>
        </button>

        <button
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
          @click="handleClear"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>清空</span>
        </button>
      </div>
    </div>

    <!-- 主体双栏区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- 左侧：代码编辑器 -->
      <div class="lg:col-span-7 flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
          <span>待检测 JSON 文本</span>
          <span class="font-mono">{{ inputJson.length }} 字符</span>
        </div>
        <CodeEditor
          v-model="inputJson"
          language="json"
          :rows="20"
          placeholder="在此粘贴或输入需要验证的 JSON 代码..."
        />
      </div>

      <!-- 右侧：诊断诊断报告与状态看板 -->
      <div class="lg:col-span-5 flex flex-col gap-4">
        <div class="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
          <span>校验诊断结果</span>
          <span
            class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
            :class="validationResult.isValid ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300'"
          >
            {{ validationResult.isValid ? '通过 (VALID)' : '异常 (INVALID)' }}
          </span>
        </div>

        <!-- 校验通过卡片 -->
        <div
          v-if="validationResult.isValid"
          class="flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs"
        >
          <div class="flex items-start gap-3">
            <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 class="w-6 h-6" />
            </span>
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                JSON 语法完全合法
              </h3>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                完全符合 RFC 8259 标准规范，结构严密无错误。
              </p>
            </div>
          </div>

          <!-- 统计指标网格 -->
          <div class="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div class="flex flex-col p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div class="flex items-center gap-1.5 text-zinc-400 text-xs">
                <Layers class="w-3.5 h-3.5" />
                <span>根节点类型</span>
              </div>
              <span class="mt-1 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase">
                {{ validationResult.rootType }}
              </span>
            </div>

            <div class="flex flex-col p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div class="flex items-center gap-1.5 text-zinc-400 text-xs">
                <Hash class="w-3.5 h-3.5" />
                <span>总键名 (Keys)</span>
              </div>
              <span class="mt-1 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {{ validationResult.stats.keysCount }} 个
              </span>
            </div>

            <div class="flex flex-col p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div class="flex items-center gap-1.5 text-zinc-400 text-xs">
                <FileCode2 class="w-3.5 h-3.5" />
                <span>总行数 / 大小</span>
              </div>
              <span class="mt-1 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {{ validationResult.stats.lines }} 行 / {{ (validationResult.stats.byteSize / 1024).toFixed(2) }} KB
              </span>
            </div>

            <div class="flex flex-col p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div class="flex items-center gap-1.5 text-zinc-400 text-xs">
                <Binary class="w-3.5 h-3.5" />
                <span>最大嵌套深度</span>
              </div>
              <span class="mt-1 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {{ validationResult.stats.maxDepth }} 层
              </span>
            </div>
          </div>
        </div>

        <!-- 校验失败与精确定位卡片 -->
        <div
          v-else
          class="flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/60 shadow-xs"
        >
          <!-- 错误概括头部 -->
          <div class="flex items-start gap-3">
            <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 shrink-0">
              <XCircle class="w-6 h-6" />
            </span>
            <div class="min-w-0">
              <h3 class="text-sm font-bold text-red-600 dark:text-red-400 truncate">
                {{ validationResult.friendlyMessage }}
              </h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="font-mono text-xs px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50">
                  行: {{ validationResult.location.line }}，列: {{ validationResult.location.column }}
                </span>
                <span class="text-[11px] text-zinc-400">
                  偏移: {{ validationResult.location.position }}
                </span>
              </div>
            </div>
          </div>

          <!-- 中文诊断修复建议 -->
          <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            <div class="font-semibold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
              <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
              <span>排错诊断建议</span>
            </div>
            <p>{{ validationResult.suggestion }}</p>
          </div>

          <!-- 精确指针代码预览框 -->
          <div class="flex flex-col gap-1.5">
            <span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">错误代码上下文定位</span>
            <div class="p-3 rounded-xl bg-zinc-950 font-mono text-xs text-zinc-300 overflow-x-auto select-text leading-relaxed border border-zinc-800">
              <!-- 前置行 -->
              <div
                v-for="line in validationResult.snippet.beforeLines"
                :key="'before-' + line.lineNum"
                class="flex gap-3 text-zinc-500 opacity-70"
              >
                <span class="w-7 text-right select-none shrink-0">{{ line.lineNum }}</span>
                <span class="whitespace-pre">{{ line.text }}</span>
              </div>

              <!-- 错误行高亮 -->
              <div class="flex gap-3 text-red-400 bg-red-950/40 -mx-3 px-3 py-0.5 font-semibold">
                <span class="w-7 text-right select-none shrink-0 text-red-500">{{ validationResult.snippet.errorLine.lineNum }}</span>
                <span class="whitespace-pre">{{ validationResult.snippet.errorLine.text }}</span>
              </div>

              <!-- 视差指示针行 -->
              <div class="flex gap-3 text-amber-400 font-bold -mx-3 px-3 py-0.5">
                <span class="w-7 select-none shrink-0" />
                <span class="whitespace-pre">{{ validationResult.snippet.pointer }}</span>
              </div>

              <!-- 后置行 -->
              <div
                v-for="line in validationResult.snippet.afterLines"
                :key="'after-' + line.lineNum"
                class="flex gap-3 text-zinc-500 opacity-70"
              >
                <span class="w-7 text-right select-none shrink-0">{{ line.lineNum }}</span>
                <span class="whitespace-pre">{{ line.text }}</span>
              </div>
            </div>
          </div>

          <!-- 一键修复快捷按钮（如果可以自动修复） -->
          <div
            v-if="validationResult.canRepair"
            class="pt-2 border-t border-zinc-100 dark:border-zinc-800"
          >
            <button
              class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              @click="handleApplyRepair"
            >
              <Wrench class="w-4 h-4" />
              <span>检测到非规范语法，点击一键自动修复</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
