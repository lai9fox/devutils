<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import CodeEditor, { type CodeLanguage } from '../editor/CodeEditor.vue'
import {
  jsonToTypeScript,
  jsonToJava,
  jsonToGo,
  jsonToRust,
  jsonToPython,
  type JavaStyle
} from '../../utils/type-generator'
import { UiInput, UiSelect, UiSegmented, UiSplitPane } from '../ui'
import { getToolDraft, setToolDraft } from '../../utils/toolDrafts'

type TargetLang = 'typescript' | 'java' | 'go' | 'rust' | 'python'

const inputJson = ref(getToolDraft('json-to-types:input', ''))
const selectedLang = ref<TargetLang>(getToolDraft('json-to-types:lang', 'typescript'))
const javaStyle = ref<JavaStyle>(getToolDraft('json-to-types:javaStyle', 'pojo'))
const rootTypeName = ref(getToolDraft('json-to-types:rootTypeName', ''))
const isMobile = ref(false)

watch(inputJson, (val) => setToolDraft('json-to-types:input', val))
watch(selectedLang, (val) => setToolDraft('json-to-types:lang', val))
watch(javaStyle, (val) => setToolDraft('json-to-types:javaStyle', val))
watch(rootTypeName, (val) => setToolDraft('json-to-types:rootTypeName', val))

function checkMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 640
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkMobile)
  }
})

const languages: { id: TargetLang; name: string; ext: string; editorLang: CodeLanguage }[] = [
  { id: 'typescript', name: 'TypeScript', ext: 'ts', editorLang: 'typescript' },
  { id: 'java', name: 'Java', ext: 'java', editorLang: 'java' },
  { id: 'go', name: 'Go Struct', ext: 'go', editorLang: 'go' },
  { id: 'rust', name: 'Rust Serde', ext: 'rs', editorLang: 'rust' },
  { id: 'python', name: 'Python Pydantic', ext: 'py', editorLang: 'python' }
]

const languageOptions = computed(() => [
  { label: isMobile.value ? 'TS' : 'TypeScript', value: 'typescript' },
  { label: 'Java', value: 'java' },
  { label: isMobile.value ? 'Go' : 'Go Struct', value: 'go' },
  { label: isMobile.value ? 'Rust' : 'Rust Serde', value: 'rust' },
  { label: isMobile.value ? 'Python' : 'Python Pydantic', value: 'python' }
])

const currentEditorLang = computed<CodeLanguage>(() => {
  const match = languages.find((l) => l.id === selectedLang.value)
  return match?.editorLang || 'plain'
})

const generatedCode = computed(() => {
  const raw = inputJson.value.trim()
  if (!raw) return ''

  try {
    const parsed = JSON.parse(raw)
    const name = rootTypeName.value.trim() || 'Root'

    switch (selectedLang.value) {
      case 'typescript':
        return jsonToTypeScript(parsed, name)
      case 'java':
        return jsonToJava(parsed, name, javaStyle.value)
      case 'go':
        return jsonToGo(parsed, name)
      case 'rust':
        return jsonToRust(parsed, name)
      case 'python':
        return jsonToPython(parsed, name)
      default:
        return ''
    }
  } catch (err) {
    return `// JSON 解析异常: ${(err as Error).message}`
  }
})
</script>

<template>
  <div class="flex h-full min-h-0 min-h-full w-full flex-1 flex-col gap-2.5">
    <!-- 顶部操作栏 -->
    <div
      class="flex shrink-0 flex-wrap items-center justify-between gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-xs dark:border-zinc-800 dark:bg-[#121215]"
    >
      <div class="flex max-w-full flex-wrap items-center gap-2">
        <!-- 语言选择 Tabs: 桌面端全名，移动端紧凑 TS/Java/Go/Rust/Python，杜绝文字折行与样式错位 -->
        <div class="scrollbar-none max-w-full shrink-0 overflow-x-auto pb-0.5">
          <UiSegmented v-model="selectedLang" :options="languageOptions" />
        </div>

        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <!-- Java 风格切换下拉框 -->
          <div v-if="selectedLang === 'java'" class="flex shrink-0 items-center gap-1.5 text-xs">
            <span class="shrink-0 text-zinc-500 dark:text-zinc-400">代码风格:</span>
            <UiSelect
              v-model="javaStyle"
              :options="[
                { label: 'POJO (Getter / Setter)', value: 'pojo' },
                { label: 'Record (Java 16+)', value: 'record' },
                { label: 'Lombok (@Data)', value: 'lombok' }
              ]"
            />
          </div>

          <!-- 根类型名称输入 -->
          <div class="flex shrink-0 items-center gap-1.5 text-xs">
            <span class="shrink-0 text-zinc-500 dark:text-zinc-400">类型名:</span>
            <div class="w-24">
              <UiInput v-model="rootTypeName" placeholder="Root" mono />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 双栏工作台：撑满高度，支持拖拽重分配宽度 (默认 50%:50%) -->
    <UiSplitPane>
      <template #left>
        <CodeEditor
          v-model="inputJson"
          title="源 JSON 数据"
          language="json"
          filename="devutils-source.json"
          clearable
          placeholder="在此粘贴或输入 JSON 数据对象..."
        />
      </template>

      <template #right>
        <CodeEditor
          :lint="false"
          :model-value="generatedCode"
          :title="`生成的 ${selectedLang.toUpperCase()} 类型模型`"
          :language="currentEditorLang"
          :filename="`${(rootTypeName.trim() || 'root').toLowerCase()}.${languages.find((l) => l.id === selectedLang)?.ext || 'txt'}`"
          readonly
          placeholder="生成的强类型模型将在此实时展示..."
        />
      </template>
    </UiSplitPane>
  </div>
</template>
