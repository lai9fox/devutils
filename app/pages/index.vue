<script setup lang="ts">
import type { ToolCategoryId } from '~/types/tool'
import { toolCategories } from '~/data/tools'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: '开发者实用工具箱',
  description: 'DevUtils 收集了常用的格式化、转换、查询和校验工具，打开页面搜索一下，就能处理 JSON、Base64、URL、JWT、时间戳等日常任务。',
  keywords: 'DevUtils,开发者工具,在线工具箱,JSON格式化,Base64编解码,URL编解码,JWT解码,时间戳转换,正则测试',
  ogTitle: 'DevUtils - 开发者实用工具箱',
  ogDescription: '常用格式化、转换、查询和校验工具，一搜就能用，适合日常开发和临时排查。',
  ogUrl: 'https://devutils.fox9.dev'
})

const { tools, searchTools } = useTools()
const searchQuery = ref('')
const selectedCategory = ref<'all' | ToolCategoryId>('all')
const input = useTemplateRef('input')

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  }
})

const baseTools = computed(() => searchQuery.value.trim()
  ? searchTools(searchQuery.value)
  : tools.value
)

const filteredTools = computed(() => {
  if (selectedCategory.value === 'all') return baseTools.value
  return baseTools.value.filter(tool => tool.category === selectedCategory.value)
})

const hasActiveFilters = computed(() => Boolean(searchQuery.value.trim() || selectedCategory.value !== 'all'))

function selectCategory(category: 'all' | ToolCategoryId) {
  selectedCategory.value = category
}

function clearFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'all'
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
    <section class="border-b border-default pb-8">
      <div class="min-w-0">
        <h1 class="max-w-3xl text-3xl font-semibold tracking-normal text-default sm:text-5xl">
          常用工具，打开就能用
        </h1>
        <p class="mt-4 max-w-2xl text-base leading-7 text-muted">
          JSON 格式化、时间戳转换、Base64 编解码、正则表达式测试等高频工具一站集成。无需安装、无需注册，打开网页即可使用，帮助你快速完成开发中的各种临时任务。
        </p>
      </div>
    </section>

    <section class="flex flex-col gap-4">
      <UInput
        ref="input"
        v-model="searchQuery"
        icon="lucide:search"
        size="xl"
        placeholder="搜索工具、格式、关键词..."
        autofocus
      >
        <template #trailing>
          <UKbd value="/" />
        </template>
      </UInput>

      <div class="flex gap-2 overflow-x-auto pb-1">
        <UButton
          :variant="selectedCategory === 'all' ? 'solid' : 'soft'"
          :color="selectedCategory === 'all' ? 'primary' : 'neutral'"
          size="sm"
          icon="lucide:layout-grid"
          class="shrink-0"
          @click="selectCategory('all')"
        >
          全部
        </UButton>
        <UButton
          v-for="category in toolCategories"
          :key="category.id"
          :variant="selectedCategory === category.id ? 'solid' : 'soft'"
          :color="selectedCategory === category.id ? 'primary' : 'neutral'"
          size="sm"
          :icon="category.icon"
          class="shrink-0"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
        </UButton>
      </div>
    </section>

    <section class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-default">
          {{ hasActiveFilters ? '匹配工具' : '全部工具' }}
        </h2>
        <div class="flex items-center gap-3">
          <span class="text-sm text-muted">{{ filteredTools.length }} 个</span>
          <UButton
            v-if="hasActiveFilters && filteredTools.length"
            variant="ghost"
            color="neutral"
            size="sm"
            icon="lucide:x"
            @click="clearFilters"
          >
            清除筛选
          </UButton>
        </div>
      </div>

      <div
        v-if="filteredTools.length"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <ToolCard
          v-for="tool in filteredTools"
          :key="tool.id"
          :tool="tool"
          compact
        />
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center rounded-lg border border-dashed border-default py-16 text-center"
      >
        <UIcon
          name="lucide:search-x"
          class="mb-3 size-8 text-muted"
        />
        <h3 class="text-sm font-semibold text-default">
          没有找到匹配工具
        </h3>
      </div>
    </section>
  </div>
</template>
