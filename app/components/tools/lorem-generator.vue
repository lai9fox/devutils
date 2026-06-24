<script setup lang="ts">
/**
 * Lorem Ipsum 占位文本生成器
 * 支持按段落/句子/单词数量生成
 */
import { loremIpsum } from 'lorem-ipsum'

type GenerateMode = 'paragraphs' | 'sentences' | 'words'

const mode = ref<GenerateMode>('paragraphs')
const count = ref(3)
const startWithLorem = ref(true)
const output = ref('')

const modeOptions = [
  { label: '段落', value: 'paragraphs' as GenerateMode },
  { label: '句子', value: 'sentences' as GenerateMode },
  { label: '单词', value: 'words' as GenerateMode }
]

function generate() {
  const num = Math.max(1, Math.min(count.value || 1, 100))

  let result = loremIpsum({
    count: num,
    units: mode.value,
    format: 'plain',
    paragraphLowerBound: 4,
    paragraphUpperBound: 8,
    sentenceLowerBound: 6,
    sentenceUpperBound: 14,
    suffix: '\n\n'
  })

  if (startWithLorem.value && result.length > 0) {
    const prefix = 'Lorem ipsum dolor sit amet'
    const firstSpace = result.indexOf(' ', 5)
    if (firstSpace > 0) {
      result = prefix + result.slice(firstSpace)
    }
  }

  output.value = result.trim()
}

function clear() {
  output.value = ''
}

onMounted(() => generate())
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">生成模式</label>
      <div>
        <SegmentControl
          v-model="mode"
          :options="modeOptions"
        />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">数量：{{ count }}</label>
      <USlider
        v-model="count"
        :min="1"
        :max="100"
        :step="1"
        class="w-full"
        tooltip
      />
    </div>

    <UCheckbox
      v-model="startWithLorem"
      label="以 &quot;Lorem ipsum dolor sit amet&quot; 开头"
    />

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        icon="lucide:play"
        color="success"
        @click="generate"
      >
        生成
      </UButton>
      <UButton
        variant="ghost"
        color="error"
        icon="lucide:trash-2"
        @click="clear"
      >
        清空
      </UButton>
      <Copy :text="output" />
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">生成结果</label>
      <UTextarea
        v-model="output"
        :rows="12"
        placeholder="生成结果"
        readonly
        class="text-sm"
      />
    </div>
  </div>
</template>
