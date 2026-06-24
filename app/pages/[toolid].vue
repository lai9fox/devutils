<script setup lang="ts">
import { getToolById, isReservedToolId } from '~/data/tools'
import { toolComponentMap } from '~/data/tool-components'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { getRelatedTools } = useTools()
const siteUrl = 'https://devutils.fox9.dev'

const toolId = computed(() => {
  const value = route.params.toolid
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
})

function toolNotFound() {
  return createError({
    statusCode: 404,
    statusMessage: '工具不存在',
    fatal: true
  })
}

const tool = computed(() => {
  if (isReservedToolId(toolId.value)) throw toolNotFound()
  const matchedTool = getToolById(toolId.value)
  if (!matchedTool || !toolComponentMap[matchedTool.id]) throw toolNotFound()
  return matchedTool
})

const toolComponent = computed(() => toolComponentMap[tool.value.id])
const relatedTools = computed(() => getRelatedTools(tool.value))
const canonicalUrl = computed(() => `${siteUrl}${tool.value.path}`)
const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  'name': tool.value.name,
  'description': tool.value.seoDescription,
  'url': canonicalUrl.value,
  'applicationCategory': 'DeveloperApplication',
  'operatingSystem': 'Any',
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'USD'
  }
}))

useSeoMeta({
  title: () => tool.value.seoTitle,
  description: () => tool.value.seoDescription,
  keywords: () => tool.value.keywords.join(','),
  ogTitle: () => `DevUtils - ${tool.value.seoTitle}`,
  ogDescription: () => tool.value.seoDescription,
  ogUrl: () => canonicalUrl.value
})

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonicalUrl.value }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(structuredData.value)
    }
  ]
}))
</script>

<template>
  <ToolPageShell
    :tool="tool"
    :related-tools="relatedTools"
  >
    <component :is="toolComponent" />
  </ToolPageShell>
</template>
