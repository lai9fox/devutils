<script setup lang="ts">
import type { Extension } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

type CodeLanguage = 'json' | 'yaml' | 'xml' | 'html' | 'markdown' | 'csv' | 'plain'

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
  html: typeof import('@codemirror/lang-html').html
  xml: typeof import('@codemirror/lang-xml').xml
  markdown: typeof import('@codemirror/lang-markdown').markdown
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
  highlightActiveLine?: boolean
  autoHeight?: boolean
}>(), {
  modelValue: '',
  language: 'plain',
  readonly: false,
  rows: 12,
  minRows: 1,
  placeholder: '',
  lineWrapping: false,
  lineNumbers: true,
  highlightActiveLine: true,
  autoHeight: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorHost = useTemplateRef<HTMLElement>('editorHost')
const minVisibleRows = computed(() =>
  props.autoHeight
    ? Math.max(1, props.minRows)
    : Math.max(3, props.rows)
)
const maxVisibleRows = computed(() => Math.max(minVisibleRows.value, props.rows))
const editorMinHeight = computed(() => `${minVisibleRows.value * 1.5 + 1.75}rem`)
const editorMaxHeight = computed(() => `${maxVisibleRows.value * 1.5 + 1.75}rem`)

let runtime: CodeMirrorRuntime | null = null
let view: EditorView | null = null
let internalUpdate = false

async function loadCodeMirror(): Promise<CodeMirrorRuntime> {
  if (runtime) return runtime

  const [
    state,
    viewModule,
    commands,
    language,
    jsonLanguage,
    yamlLanguage,
    htmlLanguage,
    xmlLanguage,
    markdownLanguage
  ] = await Promise.all([
    import('@codemirror/state'),
    import('@codemirror/view'),
    import('@codemirror/commands'),
    import('@codemirror/language'),
    import('@codemirror/lang-json'),
    import('@codemirror/lang-yaml'),
    import('@codemirror/lang-html'),
    import('@codemirror/lang-xml'),
    import('@codemirror/lang-markdown')
  ])

  runtime = {
    EditorState: state.EditorState,
    EditorView: viewModule.EditorView,
    keymap: viewModule.keymap,
    lineNumbers: viewModule.lineNumbers,
    highlightActiveLineGutter: viewModule.highlightActiveLineGutter,
    highlightSpecialChars: viewModule.highlightSpecialChars,
    drawSelection: viewModule.drawSelection,
    dropCursor: viewModule.dropCursor,
    rectangularSelection: viewModule.rectangularSelection,
    crosshairCursor: viewModule.crosshairCursor,
    placeholder: viewModule.placeholder,
    history: commands.history,
    defaultKeymap: commands.defaultKeymap,
    historyKeymap: commands.historyKeymap,
    indentWithTab: commands.indentWithTab,
    bracketMatching: language.bracketMatching,
    defaultHighlightStyle: language.defaultHighlightStyle,
    indentOnInput: language.indentOnInput,
    syntaxHighlighting: language.syntaxHighlighting,
    json: jsonLanguage.json,
    yaml: yamlLanguage.yaml,
    html: htmlLanguage.html,
    xml: xmlLanguage.xml,
    markdown: markdownLanguage.markdown
  }

  return runtime
}

function languageExtension(cm: CodeMirrorRuntime): Extension | null {
  if (props.language === 'json') return cm.json()
  if (props.language === 'yaml') return cm.yaml()
  if (props.language === 'xml') return cm.xml()
  if (props.language === 'html') return cm.html()
  if (props.language === 'markdown') return cm.markdown()
  return null
}

function editorExtensions(cm: CodeMirrorRuntime): Extension[] {
  const extensions: Extension[] = []

  if (props.lineNumbers) extensions.push(cm.lineNumbers())
  if (props.lineNumbers && props.highlightActiveLine) extensions.push(cm.highlightActiveLineGutter())

  extensions.push(
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
    cm.EditorView.theme({
      '&': {
        minHeight: 'var(--code-editor-min-height)',
        maxHeight: 'var(--code-editor-max-height)'
      },
      '.cm-scroller': {
        minHeight: 'var(--code-editor-min-height)',
        maxHeight: 'var(--code-editor-max-height)',
        overflow: 'auto'
      }
    }),
    cm.keymap.of([
      cm.indentWithTab,
      ...cm.defaultKeymap,
      ...cm.historyKeymap
    ])
  )

  const language = languageExtension(cm)
  if (language) extensions.push(language)
  if (props.placeholder) extensions.push(cm.placeholder(props.placeholder))
  if (props.lineWrapping) extensions.push(cm.EditorView.lineWrapping)

  return extensions
}

async function mountEditor() {
  const host = editorHost.value
  if (!host) return

  const cm = await loadCodeMirror()
  view = new cm.EditorView({
    parent: host,
    state: cm.EditorState.create({
      doc: props.modelValue,
      extensions: editorExtensions(cm)
    })
  })
}

function syncDocument(value: string) {
  if (!view || internalUpdate) return

  const currentValue = view.state.doc.toString()
  if (value === currentValue) return

  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: value
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

watch(() => props.modelValue, syncDocument)

watch(
  () => [props.language, props.readonly, props.placeholder, props.lineWrapping, props.lineNumbers, props.highlightActiveLine] as const,
  () => {
    if (view) void remountEditor()
  }
)
</script>

<template>
  <div
    class="code-editor"
    :class="{
      'code-editor-auto-height': autoHeight,
      'code-editor-readonly': readonly,
      'code-editor-line-wrapping': lineWrapping
    }"
    :style="{
      '--code-editor-min-height': editorMinHeight,
      '--code-editor-max-height': editorMaxHeight
    }"
  >
    <div ref="editorHost" />
  </div>
</template>

<style scoped>
.code-editor {
  width: 100%;
}

.code-editor :deep(.cm-editor) {
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-lg);
  background: var(--ui-bg-elevated);
  color: var(--ui-text);
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background-color 150ms ease;
}

.code-editor :deep(.cm-editor.cm-focused) {
  border-color: var(--ui-primary);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--ui-primary) 28%, transparent);
  outline: none;
}

.code-editor-readonly :deep(.cm-editor) {
  background: var(--ui-bg-muted);
}

.code-editor :deep(.cm-scroller) {
  align-items: stretch !important;
  font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.875rem;
  line-height: 1.5rem;
}

.code-editor :deep(.cm-content) {
  padding: 0.875rem 0;
}

.code-editor :deep(.cm-line) {
  padding: 0 1rem;
}

.code-editor-line-wrapping :deep(.cm-line) {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.code-editor :deep(.cm-gutters) {
  align-self: stretch;
  min-height: var(--code-editor-min-height) !important;
  border-right: 1px solid var(--ui-border);
  background: var(--ui-bg);
  color: var(--ui-text-dimmed);
}

.code-editor :deep(.cm-lineNumbers .cm-gutterElement) {
  min-width: 2.5rem;
  padding: 0 0.75rem;
}

.code-editor :deep(.cm-activeLineGutter),
.code-editor :deep(.cm-activeLine) {
  background: color-mix(in oklab, var(--ui-primary) 8%, transparent);
}

.code-editor :deep(.cm-placeholder) {
  color: var(--ui-text-dimmed);
}

.code-editor :deep(.cm-selectionBackground),
.code-editor :deep(.cm-focused .cm-selectionBackground),
.code-editor :deep(.cm-content ::selection) {
  background: color-mix(in oklab, var(--ui-primary) 26%, transparent);
}
</style>
