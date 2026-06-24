<script setup lang="ts">
import type { CommandPaletteGroup } from '@nuxt/ui'
import type { ToolMeta } from '~/types/tool'
import { useMagicKeys, whenever } from '@vueuse/core'

const { searchTools } = useTools()

const searchOpen = ref(false)
const searchTerm = ref('')

const commandGroups = computed<CommandPaletteGroup[]>(() => [
  {
    id: 'tools',
    label: '工具',
    ignoreFilter: true,
    items: searchTools(searchTerm.value).map((tool: ToolMeta) => ({
      id: tool.id,
      label: tool.name,
      suffix: tool.description,
      icon: tool.icon,
      to: tool.path,
      onSelect() {
        searchOpen.value = false
        navigateTo(tool.path)
      }
    }))
  }
])

const keys = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (
      (e.metaKey || e.ctrlKey)
      && e.key === 'k'
      && e.type === 'keydown'
    ) {
      e.preventDefault()
    }
  }
})

whenever(() => keys['Meta+K']?.value === true, () => {
  searchOpen.value = true
})
whenever(() => keys['Ctrl+K']?.value === true, () => {
  searchOpen.value = true
})
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-default bg-default/90 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 text-base font-semibold text-default"
      >
        <span class="flex size-8 items-center justify-center rounded-md bg-primary-500 text-white">
          <UIcon
            name="lucide:terminal"
            class="size-4"
          />
        </span>
        <span>DevUtils</span>
      </NuxtLink>

      <div class="flex min-w-0 flex-1 items-center justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="lucide:search"
          class="hidden min-w-64 justify-start text-muted md:flex"
          @click="searchOpen = true"
        >
          搜索工具
          <template #trailing>
            <div class="ml-auto flex items-center gap-1">
              <UKbd value="meta" />
              <UKbd value="K" />
            </div>
          </template>
        </UButton>

        <UButton
          color="neutral"
          variant="ghost"
          icon="lucide:search"
          class="md:hidden"
          aria-label="搜索工具"
          @click="searchOpen = true"
        />
        <UColorModeButton />
        <UButton
          color="neutral"
          as="a"
          href="https://github.com/fox9dev/devutils"
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          icon="simple-icons:github"
          aria-label="GitHub"
        />
      </div>
    </div>

    <UModal
      v-model:open="searchOpen"
      description="输入关键词快速打开工具"
      title="搜索工具"
      :ui="{ content: 'max-w-3xl p-0 overflow-hidden', body: 'p-0' }"
    >
      <template #content>
        <UCommandPalette
          v-model:open="searchOpen"
          v-model:search-term="searchTerm"
          :groups="commandGroups"
          placeholder="搜索 JSON、Base64、JWT、时间戳..."
          icon="lucide:search"
          close
          class="h-[50vh] border-0 shadow-none"
        >
          <template #empty>
            没有找到匹配的工具
          </template>
        </UCommandPalette>
      </template>
    </UModal>
  </header>
</template>
