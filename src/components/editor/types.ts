import type { EditorView } from '@codemirror/view'

export type CodeLanguage =
  | 'json'
  | 'yaml'
  | 'xml'
  | 'csv'
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'go'
  | 'rust'
  | 'python'
  | 'plain'
  | string

export interface CodeEditorProps {
  modelValue?: string
  language?: CodeLanguage
  title?: string
  readonly?: boolean
  rows?: number
  minRows?: number
  placeholder?: string
  lineWrapping?: boolean
  lineNumbers?: boolean
  codeFolding?: boolean
  lint?: boolean
  autoHeight?: boolean
  fillHeight?: boolean
  showHeader?: boolean
  showLanguage?: boolean
  showCopy?: boolean
  showDownload?: boolean
  showOpen?: boolean
  accept?: string
  filename?: string
  downloadFilename?: string
  showFold?: boolean
  showWrap?: boolean
  showSearch?: boolean
  showStats?: boolean
  clearable?: boolean
  class?: string
}

export type CodeEditorEmits = {
  'update:modelValue': [value: string]
  'copy': [value: string]
  'download': [filename: string, content: string]
  'open-file': [file: File, content: string]
  'clear': []
}

export interface CodeEditorExpose {
  getView: () => EditorView | null
  foldAll: () => void
  unfoldAll: () => void
  toggleFoldAll: () => void
  openSearch: () => void
  handleCopy: () => Promise<void>
  handleDownload: () => void
  triggerOpenFile: () => void
  handleClear: () => void
  toggleWordWrap: () => void
}

export const LANGUAGE_LABELS: Record<string, string> = {
  json: 'JSON',
  yaml: 'YAML',
  xml: 'XML',
  csv: 'CSV',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  java: 'Java',
  go: 'Go',
  rust: 'Rust',
  rs: 'Rust',
  python: 'Python',
  py: 'Python',
  plain: 'Plain Text',
  txt: 'Plain Text'
}

export interface CodeMirrorRuntime {
  EditorState: typeof import('@codemirror/state').EditorState
  EditorView: typeof import('@codemirror/view').EditorView
  Compartment: typeof import('@codemirror/state').Compartment
  keymap: typeof import('@codemirror/view').keymap
  lineNumbers: typeof import('@codemirror/view').lineNumbers
  highlightActiveLineGutter: typeof import('@codemirror/view').highlightActiveLineGutter
  highlightSpecialChars: typeof import('@codemirror/view').highlightSpecialChars
  drawSelection: typeof import('@codemirror/view').drawSelection
  dropCursor: typeof import('@codemirror/view').dropCursor
  rectangularSelection: typeof import('@codemirror/view').rectangularSelection
  crosshairCursor: typeof import('@codemirror/view').crosshairCursor
  placeholder: typeof import('@codemirror/view').placeholder
  tooltips: typeof import('@codemirror/view').tooltips
  history: typeof import('@codemirror/commands').history
  defaultKeymap: typeof import('@codemirror/commands').defaultKeymap
  historyKeymap: typeof import('@codemirror/commands').historyKeymap
  indentWithTab: typeof import('@codemirror/commands').indentWithTab
  bracketMatching: typeof import('@codemirror/language').bracketMatching
  defaultHighlightStyle: typeof import('@codemirror/language').defaultHighlightStyle
  indentOnInput: typeof import('@codemirror/language').indentOnInput
  syntaxHighlighting: typeof import('@codemirror/language').syntaxHighlighting
  codeFolding: typeof import('@codemirror/language').codeFolding
  foldGutter: typeof import('@codemirror/language').foldGutter
  foldKeymap: typeof import('@codemirror/language').foldKeymap
  foldAll: typeof import('@codemirror/language').foldAll
  unfoldAll: typeof import('@codemirror/language').unfoldAll
  foldEffect: typeof import('@codemirror/language').foldEffect
  unfoldEffect: typeof import('@codemirror/language').unfoldEffect
  foldState: typeof import('@codemirror/language').foldState
  foldable: typeof import('@codemirror/language').foldable
  foldedRanges: typeof import('@codemirror/language').foldedRanges
  linter: typeof import('@codemirror/lint').linter
  lintGutter: typeof import('@codemirror/lint').lintGutter
  json: typeof import('@codemirror/lang-json').json
  jsonParseLinter: typeof import('@codemirror/lang-json').jsonParseLinter
  yaml: typeof import('@codemirror/lang-yaml').yaml
  xml: typeof import('@codemirror/lang-xml').xml
  csv: typeof import('./csv').csv
  csvParseLinter: typeof import('./csv').csvParseLinter
  javascript: typeof import('@codemirror/lang-javascript').javascript
  java: typeof import('@codemirror/lang-java').java
  go: typeof import('@codemirror/lang-go').go
  rust: typeof import('@codemirror/lang-rust').rust
  python: typeof import('@codemirror/lang-python').python
  search: typeof import('@codemirror/search').search
  searchKeymap: typeof import('@codemirror/search').searchKeymap
  openSearchPanel: typeof import('@codemirror/search').openSearchPanel
  closeSearchPanel: typeof import('@codemirror/search').closeSearchPanel
  highlightSelectionMatches: typeof import('@codemirror/search').highlightSelectionMatches
}
