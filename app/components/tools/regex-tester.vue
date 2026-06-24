<script setup lang="ts">
/**
 * 正则表达式测试器
 * 实时匹配高亮、捕获组展示
 */
const pattern = ref('')
const flags = ref('g')
const testText = ref('')

const flagOptions = [
  { key: 'g', label: 'g (全局)' },
  { key: 'i', label: 'i (忽略大小写)' },
  { key: 'm', label: 'm (多行)' },
  { key: 's', label: 's (dotAll)' },
  { key: 'u', label: 'u (Unicode)' }
]

function toggleFlag(flag: string) {
  if (flags.value.includes(flag)) {
    flags.value = flags.value.replace(flag, '')
  } else {
    flags.value += flag
  }
}

function parseRegex(patternValue: string, flagsValue: string) {
  if (!patternValue) {
    return {
      regex: null as RegExp | null,
      error: ''
    }
  }

  try {
    return {
      regex: new RegExp(patternValue, flagsValue),
      error: ''
    }
  } catch (e) {
    return {
      regex: null as RegExp | null,
      error: (e as Error).message
    }
  }
}

const regexState = computed(() => parseRegex(pattern.value, flags.value))
const regexError = computed(() => regexState.value.error)
const compiledRegex = computed(() => regexState.value.regex)

interface MatchResult {
  index: number
  match: string
  groups: string[]
  namedGroups: Record<string, string>
}

interface HighlightPart {
  text: string
  matched: boolean
  colorClass?: string
}

const matches = computed<MatchResult[]>(() => {
  const re = compiledRegex.value
  if (!re || !testText.value) return []

  const results: MatchResult[] = []
  const text = testText.value

  if (flags.value.includes('g')) {
    let m: RegExpExecArray | null
    const regex = new RegExp(re.source, re.flags)
    while ((m = regex.exec(text)) !== null) {
      results.push({
        index: m.index,
        match: m[0],
        groups: m.slice(1),
        namedGroups: m.groups ? { ...m.groups } : {}
      })
      if (!m[0]) regex.lastIndex++
    }
  } else {
    const m = re.exec(text)
    if (m) {
      results.push({
        index: m.index,
        match: m[0],
        groups: m.slice(1),
        namedGroups: m.groups ? { ...m.groups } : {}
      })
    }
  }

  return results
})

const highlightedParts = computed<HighlightPart[]>(() => {
  if (!testText.value) return []
  if (!matches.value.length) return [{ text: testText.value, matched: false }]
  const text = testText.value
  let lastIndex = 0
  const parts: HighlightPart[] = []
  const colors = ['bg-yellow-400/40', 'bg-cyan-400/40', 'bg-pink-400/40', 'bg-green-400/40']

  for (let i = 0; i < matches.value.length; i++) {
    const m = matches.value[i]!
    const color = colors[i % colors.length]
    if (m.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, m.index), matched: false })
    }
    parts.push({ text: m.match || '∅', matched: true, colorClass: color })
    lastIndex = m.index + m.match.length
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), matched: false })
  }
  return parts
})

const regexString = computed(() => pattern.value ? `/${pattern.value}/${flags.value}` : '')

function clear() {
  pattern.value = ''
  testText.value = ''
  flags.value = 'g'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="输入正则表达式和测试文本，匹配结果将实时高亮显示。" />

    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">正则表达式</label>
      <div class="flex items-center gap-2">
        <span class="text-lg text-muted font-mono">/</span>
        <UInput
          v-model="pattern"
          placeholder="输入正则表达式..."
          class="flex-1 font-mono"
        />
        <span class="text-lg text-muted font-mono">/</span>
        <UInput
          v-model="flags"
          placeholder="flags"
          class="w-20 font-mono"
        />
      </div>
      <p
        v-if="regexError"
        class="text-sm text-error"
      >
        {{ regexError }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <label
        v-for="opt in flagOptions"
        :key="opt.key"
        class="flex items-center gap-1.5 cursor-pointer"
      >
        <UCheckbox
          :model-value="flags.includes(opt.key)"
          @update:model-value="toggleFlag(opt.key)"
        />
        <span class="text-sm text-muted font-mono">{{ opt.label }}</span>
      </label>
    </div>

    <ToolTextSplit>
      <template #input>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-muted">测试文本</label>
          <UTextarea
            v-model="testText"
            :rows="8"
            placeholder="输入要测试的文本..."
            class="font-mono text-sm"
          />
        </div>
      </template>

      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            variant="ghost"
            color="error"
            icon="lucide:trash-2"
            @click="clear"
          >
            清空
          </UButton>
          <Copy :text="regexString" />
          <span class="text-sm text-muted">
            匹配数：<strong class="text-default">{{ matches.length }}</strong>
          </span>
        </div>
      </template>

      <template #output>
        <div class="flex min-w-0 flex-col gap-4">
          <div
            class="flex flex-col gap-2"
          >
            <label class="text-sm font-medium text-muted">匹配高亮</label>
            <div
              class="min-h-33 overflow-x-auto rounded-lg border border-default bg-elevated p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all"
            >
              <template
                v-for="(part, index) in highlightedParts"
                :key="index"
              >
                <mark
                  v-if="part.matched"
                  :class="[part.colorClass, 'rounded px-0.5']"
                >{{ part.text }}</mark>
                <span v-else>{{ part.text }}</span>
              </template>
            </div>
          </div>

          <div
            v-if="matches.length"
            class="flex flex-col gap-2"
          >
            <label class="text-sm font-medium text-muted">匹配详情</label>
            <div class="rounded-lg border border-default bg-elevated divide-y divide-default">
              <div
                v-for="(m, i) in matches"
                :key="i"
                class="p-3 text-sm font-mono"
              >
                <div class="flex flex-wrap items-center gap-3">
                  <span class="text-muted">#{{ i + 1 }}</span>
                  <span class="break-all text-default font-medium">"{{ m.match }}"</span>
                  <span class="text-dimmed text-xs">index: {{ m.index }}</span>
                </div>
                <div
                  v-if="m.groups.length"
                  class="mt-1 flex flex-wrap gap-2"
                >
                  <span
                    v-for="(g, gi) in m.groups"
                    :key="gi"
                    class="text-xs bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded px-1.5 py-0.5"
                  >
                    ${{ gi + 1 }}: "{{ g }}"
                  </span>
                </div>
                <div
                  v-if="Object.keys(m.namedGroups).length"
                  class="mt-1 flex flex-wrap gap-2"
                >
                  <span
                    v-for="(val, key) in m.namedGroups"
                    :key="key"
                    class="text-xs bg-green-500/10 text-green-600 dark:text-green-400 rounded px-1.5 py-0.5"
                  >
                    {{ key }}: "{{ val }}"
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ToolTextSplit>
  </div>
</template>
