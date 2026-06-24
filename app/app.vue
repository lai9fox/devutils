<script lang="ts" setup>
const route = useRoute()

useHead({
  link: computed(() => [
    { rel: 'canonical', href: `https://devutils.fox9.dev${route.path}` }
  ])
})
</script>

<template>
  <UApp :toaster="{ position: 'top-center' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
