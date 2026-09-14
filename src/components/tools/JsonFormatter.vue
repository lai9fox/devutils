<script setup lang="ts">
import { ref, watch } from 'vue'
import CodeEditor from '../editor/CodeEditor.vue'
import { repairJson } from '../../utils/json-repair'
import { formatJson, minifyJson, isValidJson } from '../../utils/json-format'
import { AlignLeft, Minimize2, Wrench } from '@lucide/vue'
import { UiButton, UiSegmented, message } from '../ui'
import { getToolDraft, setToolDraft } from '../../utils/toolDrafts'

const content = ref(getToolDraft('json-formatter:content', ''))
const indentSize = ref<number | 'tab'>(getToolDraft('json-formatter:indent', 2))

watch(content, (val) => setToolDraft('json-formatter:content', val))
watch(indentSize, (val) => setToolDraft('json-formatter:indent', val))

function handleFormat(showToast = true) {
  if (!content.value.trim()) {
    if (showToast) {
      message.warning('请输入或粘贴 JSON 内容')
    }
    return
  }

  // 1. 如果本身是有效 JSON，使用无损格式化（不转换大整数、高精度小数）
  if (isValidJson(content.value)) {
    content.value = formatJson(content.value, { indent: indentSize.value })
    if (showToast) {
      message.success('格式化成功')
    }
    return
  }

  // 2. 尝试容错修复
  const { repaired, changed, success, error } = repairJson(content.value)
  if (success && isValidJson(repaired)) {
    content.value = formatJson(repaired, { indent: indentSize.value })
    if (showToast) {
      message.info(changed ? '检测到非标准语法，已自动容错修复并完成格式化' : '格式化成功')
    }
  } else {
    if (showToast) {
      message.error(`解析错误: ${error || 'JSON 语法错误'}`)
    }
  }
}

function handleMinify() {
  if (!content.value.trim()) {
    message.warning('请输入或粘贴 JSON 内容')
    return
  }

  if (isValidJson(content.value)) {
    content.value = minifyJson(content.value)
    message.success('压缩单行成功')
    return
  }

  const { repaired, success, error } = repairJson(content.value)
  if (success && isValidJson(repaired)) {
    content.value = minifyJson(repaired)
    message.info('已自动修复语法并完成单行压缩')
  } else {
    message.error(`压缩失败: ${error || 'JSON 语法错误'}`)
  }
}

function handleRepair() {
  if (!content.value.trim()) {
    message.warning('请输入或粘贴 JSON 内容')
    return
  }

  const { repaired, changed, success, error } = repairJson(content.value)
  if (!success) {
    message.error(`修复失败: ${error || '无法解析或修复此内容'}`)
    return
  }

  content.value = formatJson(repaired, { indent: indentSize.value })
  if (changed) {
    message.success('成功修复非标准语法（单引号、键名缺少引号、尾随逗号等）')
  } else {
    message.info('当前内容无需修复或已符合标准语法')
  }
}
</script>

<template>
  <div class="flex h-full min-h-0 min-h-full w-full flex-1 flex-col gap-2.5">
    <!-- 操作工具条 -->
    <div
      class="flex shrink-0 flex-wrap items-center justify-between gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div class="flex flex-wrap items-center gap-2">
        <!-- 缩进分段选项 -->
        <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span class="shrink-0 select-none">缩进:</span>
          <UiSegmented
            v-model="indentSize"
            :options="[
              { label: '2 空格', value: 2 },
              { label: '4 空格', value: 4 },
              { label: 'Tab', value: 'tab' }
            ]"
            size="sm"
            @change="() => handleFormat(false)"
          />
        </div>

        <UiButton variant="primary" @click="() => handleFormat(true)">
          <template #prefix>
            <AlignLeft class="h-3.5 w-3.5" />
          </template>
          格式化
        </UiButton>

        <UiButton variant="secondary" @click="handleMinify">
          <template #prefix>
            <Minimize2 class="h-3.5 w-3.5" />
          </template>
          压缩单行
        </UiButton>

        <UiButton
          variant="warning"
          title="自动补全未加引号的 key、去掉尾逗号、修复单引号"
          @click="handleRepair"
        >
          <template #prefix>
            <Wrench class="h-3.5 w-3.5" />
          </template>
          智能修复
        </UiButton>
      </div>
    </div>

    <!-- 单一核心编辑器，撑满全部剩余垂直与水平空间 -->
    <div class="flex min-h-0 w-full flex-1 flex-col">
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
