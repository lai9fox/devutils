<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Extension } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

export type CodeLanguage = 'json' | 'yaml' | 'xml' | 'javascript' | 'plain'

interface CodeMirrorRuntime {
  EditorState: typeof import('@codemirror/state').EditorState
  EditorView: typeof import('@codemirror/view').EditorView
  keymap: typeof import('@codemirror/view').keymap
  lineNumbers: typeof import('@codemirror/view').lineNumbers
  highlightActiveLineGutter: typeof import('@codemirror/view').highlightActiveLineGutter
  highlightSpecialChars: typeof import('@codemirror/view').highlightSpecialChars
  drawSelection: typeof import('@codemirror/view').drawSelection
  dropCursor: typeof import('@codemirror/view').dropCursor
  rectangularSelection: typeof import('@codemirror/view').rectangularSelection
  crosshairCursor: typeof import('@codemirror/view').crosshairCursor
  placeholder: typeof import('@codemirror/view').placeholder
  history: typeof import('@codemirror/commands').history
  defaultKeymap: typeof import('@codemirror/commands').defaultKeymap
  historyKeymap: typeof import('@codemirror/commands').historyKeymap
  indentWithTab: typeof import('@codemirror/commands').indentWithTab
  bracketMatching: typeof import('@codemirror/language').bracketMatching
  defaultHighlightStyle: typeof import('@codemirror/language').defaultHighlightStyle
  indentOnInput: typeof import('@codemirror/language').indentOnInput
  syntaxHighlighting: typeof import('@codemirror/language').syntaxHighlighting
  json: typeof import('@codemirror/lang-json').json
  yaml: typeof import('@codemirror/lang-yaml').yaml
  xml: typeof import('@codemirror/lang-xml').xml
  javascript: typeof import('@codemirror/lang-javascript').javascript
}

const props = withDefaults(defineProps<{
  modelValue?: string
  language?: CodeLanguage
  readonly?: boolean
  rows?: number
  minRows?: number
  placeholder?: string
  lineWrapping?: boolean
  lineNumbers?: boolean
  autoHeight?: boolean
  class?: string
}>(), {
  modelValue: '',
  language: 'json',
  readonly: false,
  rows: 14,
  minRows: 4,
  placeholder: '',
  lineWrapping: false,
  lineNumbers: true,
  autoHeight: false,
  class: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorHost = ref<HTMLElement | null>(null)
let runtime: CodeMirrorRuntime | null = null
let view: EditorView | null = null
let internalUpdate = false

const minHeightRem = computed(() => `${props.minRows * 1.5 + 1}rem`)
const maxHeightRem = computed(() => (props.autoHeight ? 'none' : `${props.rows * 1.5 + 1.5}rem`))

async function loadCodeMirror(): Promise<CodeMirrorRuntime> {
  if (runtime) return runtime

  const [
    state,
    viewMod,
    commands,
    languageMod,
    jsonLang,
    yamlLang,
    xmlLang,
    jsLang
  ] = await Promise.all([
    import('@codemirror/state'),
    import('@codemirror/view'),
    import('@codemirror/commands'),
    import('@codemirror/language'),
    import('@codemirror/lang-json'),
    import('@codemirror/lang-yaml'),
    import('@codemirror/lang-xml'),
    import('@codemirror/lang-javascript')
  ])

  runtime = {
    EditorState: state.EditorState,
    EditorView: viewMod.EditorView,
    keymap: viewMod.keymap,
    lineNumbers: viewMod.lineNumbers,
    highlightActiveLineGutter: viewMod.highlightActiveLineGutter,
    highlightSpecialChars: viewMod.highlightSpecialChars,
    drawSelection: viewMod.drawSelection,
    dropCursor: viewMod.dropCursor,
    rectangularSelection: viewMod.rectangularSelection,
    crosshairCursor: viewMod.crosshairCursor,
    placeholder: viewMod.placeholder,
    history: commands.history,
    defaultKeymap: commands.defaultKeymap,
    historyKeymap: commands.historyKeymap,
    indentWithTab: commands.indentWithTab,
    bracketMatching: languageMod.bracketMatching,
    defaultHighlightStyle: languageMod.defaultHighlightStyle,
    indentOnInput: languageMod.indentOnInput,
    syntaxHighlighting: languageMod.syntaxHighlighting,
    json: jsonLang.json,
    yaml: yamlLang.yaml,
    xml: xmlLang.xml,
    javascript: jsLang.javascript
  }

  return runtime
}

function getLanguageExtension(cm: CodeMirrorRuntime): Extension | null {
  if (props.language === 'json') return cm.json()
  if (props.language === 'yaml') return cm.yaml()
  if (props.language === 'xml') return cm.xml()
  if (props.language === 'javascript') return cm.javascript({ typescript: true })
  return null
}

function buildExtensions(cm: CodeMirrorRuntime): Extension[] {
  const exts: Extension[] = []

  if (props.lineNumbers) {
    exts.push(cm.lineNumbers())
    exts.push(cm.highlightActiveLineGutter())
  }

  exts.push(
    cm.highlightSpecialChars(),
    cm.history(),
    cm.drawSelection(),
    cm.dropCursor(),
    cm.rectangularSelection(),
    cm.crosshairCursor(),
    cm.indentOnInput(),
    cm.bracketMatching(),
    cm.syntaxHighlighting(cm.defaultHighlightStyle, { fallback: true }),
    cm.EditorState.tabSize.of(2),
    cm.EditorState.readOnly.of(props.readonly),
    cm.EditorView.editable.of(!props.readonly),
    cm.EditorView.updateListener.of((update) => {
      if (!update.docChanged) return
      const value = update.state.doc.toString()
      internalUpdate = true
      emit('update:modelValue', value)
      nextTick(() => {
        internalUpdate = false
      })
    }),
    cm.keymap.of([
      cm.indentWithTab,
      ...cm.defaultKeymap,
      ...cm.historyKeymap
    ])
  )

  const lang = getLanguageExtension(cm)
  if (lang) exts.push(lang)

  if (props.placeholder) {
    exts.push(cm.placeholder(props.placeholder))
  }
  if (props.lineWrapping) {
    exts.push(cm.EditorView.lineWrapping)
  }

  return exts
}

async function mountEditor() {
  if (!editorHost.value) return
  const cm = await loadCodeMirror()

  view = new cm.EditorView({
    parent: editorHost.value,
    state: cm.EditorState.create({
      doc: props.modelValue || '',
      extensions: buildExtensions(cm)
    })
  })
}

function syncValue(val: string) {
  if (!view || internalUpdate) return
  const current = view.state.doc.toString()
  if (val === current) return

  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: val || ''
    }
  })
}

async function remountEditor() {
  view?.destroy()
  view = null
  await mountEditor()
}

onMounted(() => {
  void mountEditor()
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

watch(() => props.modelValue, syncValue)
watch(
  () => [props.language, props.readonly, props.placeholder, props.lineWrapping, props.lineNumbers],
  () => {
    if (view) void remountEditor()
  }
)
</script>

<template>
  <div
    class="code-editor-container relative w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors shadow-xs"
    :class="[props.class, readonly ? 'bg-zinc-50/70 dark:bg-zinc-900/40' : 'focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30']"
  >
    <div
      ref="editorHost"
      class="editor-host w-full"
      :style="{
        minHeight: minHeightRem,
        maxHeight: maxHeightRem
      }"
    />
  </div>
</template>

<style>
.editor-host {
  overflow: auto;
}

.editor-host .cm-editor {
  background: transparent !important;
  outline: none !important;
  border: none !important;
  min-height: inherit;
  font-size: 0.85rem;
  line-height: 1.6;
}

.editor-host .cm-scroller {
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
}

.editor-host .cm-content {
  padding: 0.75rem 0;
}

.editor-host .cm-line {
  padding: 0 0.875rem;
}

.editor-host .cm-gutters {
  background-color: rgba(244, 244, 245, 0.6) !important;
  border-right: 1px solid rgba(228, 228, 231, 0.8) !important;
  color: #a1a1aa !important;
}

.dark .editor-host .cm-gutters {
  background-color: rgba(24, 24, 27, 0.5) !important;
  border-right: 1px solid rgba(39, 39, 42, 0.8) !important;
  color: #71717a !important;
}

.editor-host .cm-activeLineGutter,
.editor-host .cm-activeLine {
  background-color: rgba(59, 130, 246, 0.08) !important;
}

.dark .editor-host .cm-activeLineGutter,
.dark .editor-host .cm-activeLine {
  background-color: rgba(59, 130, 246, 0.12) !important;
}

.editor-host .cm-placeholder {
  color: #a1a1aa !important;
}
.dark .editor-host .cm-placeholder {
  color: #71717a !important;
}
</style>
