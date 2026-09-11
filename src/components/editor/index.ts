import CodeEditor from './CodeEditor.vue'
import EditorHeader from './EditorHeader.vue'

export { CodeEditor, EditorHeader }
export { useCodeMirror, createFoldMarker } from './useCodeMirror'
export {
  LANGUAGE_LABELS,
  type CodeLanguage,
  type CodeEditorProps,
  type CodeEditorEmits,
  type CodeEditorExpose,
  type CodeMirrorRuntime
} from './types'
export { csv, csvLanguage, csvParseLinter } from './csv'

export default CodeEditor
