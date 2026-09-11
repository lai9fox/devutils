<script setup lang="ts">
import { ref } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import { repairJson } from '../../utils/json-repair'
import {
  AlignLeft,
  Minimize2,
  Wrench,
} from '@lucide/vue'
import { UiButton, UiSegmented, message } from '../ui'

const content = ref('')
const indentSize = ref<number | 'tab'>(2)

function getIndent(): string | number {
  return indentSize.value === 'tab' ? '\t' : Number(indentSize.value)
}

function handleFormat(showToast = true) {
  if (!content.value.trim()) {
    if (showToast) {
      message.warning('请输入或粘贴 JSON 内容')
    }
    return
  }

  try {
    const parsed = JSON.parse(content.value)
    content.value = JSON.stringify(parsed, null, getIndent())
    if (showToast) {
      message.success('格式化成功')
    }
  } catch (err) {
    const { repaired, changed } = repairJson(content.value)
    try {
      const parsed = JSON.parse(repaired)
      content.value = JSON.stringify(parsed, null, getIndent())
      if (showToast) {
        message.info(
          changed
            ? '检测到非标准语法，已自动容错修复并完成格式化'
            : '格式化成功'
        )
      }
    } catch {
      if (showToast) {
        message.error(`解析错误: ${(err as Error).message}`)
      }
    }
  }
}

function handleMinify() {
  if (!content.value.trim()) {
    message.warning('请输入或粘贴 JSON 内容')
    return
  }

  try {
    const parsed = JSON.parse(content.value)
    content.value = JSON.stringify(parsed)
    message.success('压缩单行成功')
  } catch {
    const { repaired } = repairJson(content.value)
    try {
      const parsed = JSON.parse(repaired)
      content.value = JSON.stringify(parsed)
      message.info('已自动修复语法并完成单行压缩')
    } catch (e) {
      message.error(`压缩失败: ${(e as Error).message}`)
    }
  }
}

function handleRepair() {
  if (!content.value.trim()) {
    message.warning('请输入或粘贴 JSON 内容')
    return
  }
  const { repaired, changed } = repairJson(content.value)
  content.value = repaired
  if (changed) {
    message.success('成功修复单引号、键名缺失引号及尾随逗号')
  } else {
    message.info('当前内容无需修复或已符合标准语法')
  }
}
</script>

<template>
  <div class="h-full min-h-full flex-1 flex flex-col min-h-0 w-full gap-2.5">
    <!-- 操作工具条 -->
    <div class="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs shrink-0">
      <div class="flex flex-wrap items-center gap-2">
        <!-- 缩进分段选项 -->
        <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span class="shrink-0 select-none">缩进:</span>
          <UiSegmented
            v-model="indentSize"
            :options="[
              { label: '2 空格', value: 2 },
              { label: '4 空格', value: 4 },
              { label: 'Tab', value: 'tab' },
            ]"
            size="sm"
            @change="() => handleFormat(false)"
          />
        </div>

        <UiButton
          variant="primary"
          @click="() => handleFormat(true)"
        >
          <template #prefix>
            <AlignLeft class="w-3.5 h-3.5" />
          </template>
          格式化
        </UiButton>

        <UiButton
          variant="secondary"
          @click="handleMinify"
        >
          <template #prefix>
            <Minimize2 class="w-3.5 h-3.5" />
          </template>
          压缩单行
        </UiButton>

        <UiButton
          variant="warning"
          title="自动补全未加引号的 key、去掉尾逗号、修复单引号"
          @click="handleRepair"
        >
          <template #prefix>
            <Wrench class="w-3.5 h-3.5" />
          </template>
          智能修复
        </UiButton>
      </div>
    </div>

    <!-- 单一核心编辑器，撑满全部剩余垂直与水平空间 -->
    <div class="flex-1 flex flex-col min-h-0 w-full">
      <CodeEditor
        v-model="content"
        title="JSON 编辑器"
        language="json"
        filename="devutils-formatted.json"
        clearable
        placeholder="在此粘贴或输入 JSON 代码，支持一键格式化、单行压缩与智能容错修复..."
      />
    </div>
  </div>
</template>
