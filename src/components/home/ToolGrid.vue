<script setup lang="ts">
import { ref, computed } from 'vue'
import { tools, toolCategories, type ToolCategoryId } from '../../data/tools'
import {
  Search,
  AlignLeft,
  FolderTree,
  ShieldCheck,
  Filter,
  FileType,
  ArrowLeftRight,
  LayoutGrid
} from '@lucide/vue'
import { UiButton, UiInput } from '../ui'

const selectedCategory = ref<'all' | ToolCategoryId>('all')
const searchQuery = ref('')

const filteredTools = computed(() => {
  let list = tools
  if (selectedCategory.value !== 'all') {
    list = list.filter(t => t.category === selectedCategory.value)
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some(k => k.toLowerCase().includes(q))
    )
  }
  return list
})

function getCategoryName(categoryId: string) {
  const cat = toolCategories.find(c => c.id === categoryId)
  return cat ? cat.name : ''
}

function getIconComponent(icon: string) {
  switch (icon) {
    case 'AlignLeft': return AlignLeft
    case 'FolderTree': return FolderTree
    case 'ShieldCheck': return ShieldCheck
    case 'Filter': return Filter
    case 'FileType': return FileType
    case 'ArrowLeftRight': return ArrowLeftRight
    default: return AlignLeft
  }
}
</script>

<template>
  <div id="tools-section" class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
    <!-- 头部说明 -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          所有工具
        </h2>
        <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          开箱即用、纯本地计算，点击工具卡片即可进入双栏工作台。
        </p>
      </div>
    </div>

    <!-- 搜索与分类筛选栏 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <!-- 分类 Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto p-1.5 -m-1.5">
        <UiButton
          :variant="selectedCategory === 'all' ? 'primary' : 'secondary'"
          size="sm"
          class="shrink-0"
          @click="selectedCategory = 'all'"
        >
          <template #prefix>
            <LayoutGrid class="w-3.5 h-3.5" />
          </template>
          <span>全部 ({{ tools.length }})</span>
        </UiButton>

        <UiButton
          v-for="cat in toolCategories"
          :key="cat.id"
          :variant="selectedCategory === cat.id ? 'primary' : 'secondary'"
          size="sm"
          class="shrink-0"
          @click="selectedCategory = cat.id"
        >
          <span>{{ cat.name }}</span>
        </UiButton>
      </div>

      <!-- 搜索框 -->
      <div class="w-full md:w-72">
        <UiInput
          v-model="searchQuery"
          placeholder="搜索工具、格式或关键词..."
        >
          <template #prefix>
            <Search class="w-3.5 h-3.5" />
          </template>
        </UiInput>
      </div>
    </div>

    <!-- 卡片网格 -->
    <div
      v-if="filteredTools.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      <a
        v-for="tool in filteredTools"
        :key="tool.id"
        :href="tool.path"
        class="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/90 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-[transform,border-color,box-shadow] duration-200 cursor-pointer"
      >
        <!-- 背景微光悬浮层 -->
        <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <!-- 悬浮上移防抖缓冲桥：填补向上位移留出的边缘缝隙，杜绝鼠标在底部边框处反复触发/丢失 hover 的死循环抖动 -->
        <div class="absolute inset-x-0 -bottom-2 h-2 pointer-events-none group-hover:pointer-events-auto" aria-hidden="true" />

        <div class="relative">
          <!-- 头部: 图标、名称、类型同一区块 -->
          <div class="flex items-center gap-3">
            <span class="flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors duration-200 shadow-xs shrink-0">
              <component :is="getIconComponent(tool.icon)" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            </span>

            <div class="min-w-0">
              <h3 class="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight truncate">
                {{ tool.name }}
              </h3>
              <p class="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                {{ getCategoryName(tool.category) }}
              </p>
            </div>
          </div>

          <!-- 描述 -->
          <p class="mt-3.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {{ tool.description }}
          </p>
        </div>

        <!-- 底部: 特性标签（去除【进入工作台】按钮） -->
        <div class="relative mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5 flex-wrap">
          <span
            v-for="tag in (tool.tags || tool.keywords.slice(0, 3))"
            :key="tag"
            class="text-[10px] px-2 py-0.5 rounded-md font-normal bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50"
          >
            {{ tag }}
          </span>
        </div>
      </a>
    </div>

    <!-- 空搜索状态 -->
    <div
      v-else
      class="py-16 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30"
    >
      <Search class="w-8 h-8 mx-auto text-zinc-400 mb-3" />
      <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300">未找到匹配的工具</p>
      <p class="text-xs text-zinc-400 mt-1">尝试搜索其他关键词或切换分类筛选</p>
    </div>
  </div>
</template>
