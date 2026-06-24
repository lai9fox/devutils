<script setup lang="ts">
import type { ToolMeta } from '~/types/tool'

defineProps<{
  tool: ToolMeta
  relatedTools: ToolMeta[]
}>()
</script>

<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
    <header class="flex flex-col gap-6 border-b border-default pb-6">
      <div class="flex items-center justify-between gap-3">
        <UButton
          to="/"
          variant="ghost"
          color="neutral"
          icon="lucide:arrow-left"
          size="sm"
        >
          返回首页
        </UButton>
        <div class="hidden items-center gap-2 text-xs text-muted sm:flex">
          <UIcon
            name="lucide:shield-check"
            class="size-4 text-success"
          />
          <span>本地处理，不上传输入</span>
        </div>
      </div>

      <div class="flex min-w-0 items-start gap-4 sm:gap-5">
        <div class="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-lg border border-default bg-elevated text-primary sm:size-14">
          <UIcon
            :name="tool.icon"
            class="size-6 sm:size-7"
          />
        </div>
        <div class="min-w-0 flex-1 pt-0.5">
          <h1 class="text-2xl font-semibold leading-tight tracking-normal text-default sm:text-3xl">
            {{ tool.name }}
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">
            {{ tool.description }}
          </p>
        </div>
      </div>
    </header>

    <main class="min-w-0">
      <slot />
    </main>

    <section
      v-if="relatedTools.length"
      class="border-t border-default pt-6"
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-base font-semibold text-default">
          相关工具
        </h2>
        <UButton
          to="/"
          variant="ghost"
          color="neutral"
          trailing-icon="lucide:arrow-right"
          size="sm"
        >
          查看全部
        </UButton>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ToolCard
          v-for="item in relatedTools"
          :key="item.id"
          :tool="item"
          compact
        />
      </div>
    </section>
  </div>
</template>
