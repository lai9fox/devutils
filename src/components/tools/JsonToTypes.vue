<script setup lang="ts">
import { ref, computed } from 'vue'
import CodeEditor, { type CodeLanguage } from '../editor/CodeEditor.vue'
import {
  jsonToTypeScript,
  jsonToJava,
  jsonToGo,
  jsonToRust,
  jsonToPython,
  type JavaStyle
} from '../../utils/type-generator'
import {
  Copy,
  Check,
  Download,
  Trash2,
  FlaskConical
} from '@lucide/vue'

type TargetLang = 'typescript' | 'java' | 'go' | 'rust' | 'python'

const inputJson = ref(`{
  "id": 101,
  "title": "Astro Framework Deep Dive",
  "author": {
    "name": "Evan",
    "email": "evan@example.com",
    "verified": true
  },
  "tags": ["astro", "vue", "tailwindcss"],
  "metrics": {
    "views": 25400,
    "likes": 1820
  }
}`)

const selectedLang = ref<TargetLang>('typescript')
const javaStyle = ref<JavaStyle>('pojo')
const rootTypeName = ref('Article')
const copied = ref(false)

const languages: { id: TargetLang; name: string; ext: string; editorLang: CodeLanguage }[] = [
  { id: 'typescript', name: 'TypeScript', ext: 'ts', editorLang: 'javascript' },
  { id: 'java', name: 'Java', ext: 'java', editorLang: 'plain' },
  { id: 'go', name: 'Go Struct', ext: 'go', editorLang: 'plain' },
  { id: 'rust', name: 'Rust Serde', ext: 'rs', editorLang: 'plain' },
  { id: 'python', name: 'Python Pydantic', ext: 'py', editorLang: 'plain' }
]

const currentEditorLang = computed<CodeLanguage>(() => {
  const match = languages.find(l => l.id === selectedLang.value)
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

async function handleCopy() {
  if (!generatedCode.value) return
  await navigator.clipboard.writeText(generatedCode.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1800)
}

function handleDownload() {
  if (!generatedCode.value) return
  const current = languages.find(l => l.id === selectedLang.value)
  const ext = current?.ext || 'txt'
  const blob = new Blob([generatedCode.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${rootTypeName.value.toLowerCase() || 'model'}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

function handleClear() {
  inputJson.value = ''
}

function handleLoadSample() {
  inputJson.value = JSON.stringify({
    productId: "P-9872",
    productName: "Mechanical Keyboard",
    price: 89.99,
    inStock: true,
    specs: {
      switches: "Cherry MX Red",
      layout: "TKL 80%",
      wireless: true
    },
    reviews: [
      { user: "dev_user", rating: 5, comment: "Crisp and smooth!" }
    ]
  }, null, 2)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 顶部操作栏 -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
      <div class="flex flex-wrap items-center gap-2">
        <!-- 语言选择 Tabs: 聚焦 TypeScript, Java, Go -->
        <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <button
            v-for="lang in languages"
            :key="lang.id"
            class="px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer"
            :class="selectedLang === lang.id ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            @click="selectedLang = lang.id"
          >
            {{ lang.name }}
          </button>
        </div>

        <!-- Java 风格切换下拉框 -->
        <div v-if="selectedLang === 'java'" class="flex items-center gap-1.5 ml-1 text-xs">
          <span class="text-zinc-500 dark:text-zinc-400">代码风格:</span>
          <select
            v-model="javaStyle"
            class="h-8 px-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 shadow-xs transition-colors cursor-pointer"
          >
            <option value="pojo">POJO (Getter / Setter)</option>
            <option value="record">Record (Java 16+)</option>
            <option value="lombok">Lombok (@Data)</option>
          </select>
        </div>

        <!-- 根类型名称输入 -->
        <div class="flex items-center gap-1.5 ml-2 text-xs">
          <span class="text-zinc-500 dark:text-zinc-400">根类型名:</span>
          <input
            v-model="rootTypeName"
            type="text"
            placeholder="Root"
            class="w-28 h-8 px-2.5 text-xs font-mono rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-xs transition-colors"
          >
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1 px-2.5 h-8 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          @click="handleLoadSample"
        >
          <FlaskConical class="w-3.5 h-3.5 text-emerald-500" />
          <span class="hidden sm:inline">示例</span>
        </button>

        <button
          class="inline-flex items-center gap-1 px-2.5 h-8 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          @click="handleDownload"
        >
          <Download class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">导出代码</span>
        </button>

        <button
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          :class="copied ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200'"
          @click="handleCopy"
        >
          <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-600" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span>{{ copied ? '已复制' : '复制代码' }}</span>
        </button>

        <button
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
          @click="handleClear"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 双栏工作台 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">源 JSON 对象</span>
        <CodeEditor
          v-model="inputJson"
          language="json"
          :rows="18"
          placeholder="粘贴任意结构复杂 JSON..."
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">生成的 {{ selectedLang.toUpperCase() }} 类型定义</span>
        <CodeEditor
          :model-value="generatedCode"
          :language="currentEditorLang"
          :rows="18"
          readonly
          placeholder="生成的强类型模型将在此展示..."
        />
      </div>
    </div>
  </div>
</template>
