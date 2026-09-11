import { ref, watch, onMounted, onBeforeUnmount, nextTick, type Ref } from 'vue'
import type { Extension, Compartment } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import type { CodeEditorProps, CodeMirrorRuntime } from './types'

export function createFoldMarker(open: boolean): HTMLElement {
  const span = document.createElement('span')
  span.className = `cm-fold-marker ${open ? 'cm-fold-open' : 'cm-fold-closed'}`
  span.setAttribute('aria-label', open ? '折叠代码' : '展开代码')
  span.innerHTML = open
    ? '<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>'
    : '<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>'
  return span
}

export function useCodeMirror(
  editorHost: Ref<HTMLElement | null>,
  props: CodeEditorProps,
  emit: (event: 'update:modelValue', val: string) => void
) {
  let runtime: CodeMirrorRuntime | null = null
  let view: EditorView | null = null
  let wrapCompartment: Compartment | null = null
  let internalUpdate = false
  let isDisposed = false

  const isWrapped = ref(Boolean(props.lineWrapping))
  const isAllFolded = ref(false)

  async function loadCodeMirror(): Promise<CodeMirrorRuntime> {
    if (runtime) return runtime

    const [
      state,
      viewMod,
      commands,
      languageMod,
      lintMod,
      jsonLang,
      yamlLang,
      xmlLang,
      jsLang,
      searchMod,
      csvLang,
      javaLang,
      goLang,
      rustLang,
      pythonLang
    ] = await Promise.all([
      import('@codemirror/state'),
      import('@codemirror/view'),
      import('@codemirror/commands'),
      import('@codemirror/language'),
      import('@codemirror/lint'),
      import('@codemirror/lang-json'),
      import('@codemirror/lang-yaml'),
      import('@codemirror/lang-xml'),
      import('@codemirror/lang-javascript'),
      import('@codemirror/search'),
      import('./csv'),
      import('@codemirror/lang-java'),
      import('@codemirror/lang-go'),
      import('@codemirror/lang-rust'),
      import('@codemirror/lang-python')
    ])

    runtime = {
      EditorState: state.EditorState,
      EditorView: viewMod.EditorView,
      Compartment: state.Compartment,
      keymap: viewMod.keymap,
      lineNumbers: viewMod.lineNumbers,
      highlightActiveLineGutter: viewMod.highlightActiveLineGutter,
      highlightSpecialChars: viewMod.highlightSpecialChars,
      drawSelection: viewMod.drawSelection,
      dropCursor: viewMod.dropCursor,
      rectangularSelection: viewMod.rectangularSelection,
      crosshairCursor: viewMod.crosshairCursor,
      placeholder: viewMod.placeholder,
      tooltips: viewMod.tooltips,
      history: commands.history,
      defaultKeymap: commands.defaultKeymap,
      historyKeymap: commands.historyKeymap,
      indentWithTab: commands.indentWithTab,
      bracketMatching: languageMod.bracketMatching,
      defaultHighlightStyle: languageMod.defaultHighlightStyle,
      indentOnInput: languageMod.indentOnInput,
      syntaxHighlighting: languageMod.syntaxHighlighting,
      codeFolding: languageMod.codeFolding,
      foldGutter: languageMod.foldGutter,
      foldKeymap: languageMod.foldKeymap,
      foldAll: languageMod.foldAll,
      unfoldAll: languageMod.unfoldAll,
      foldEffect: languageMod.foldEffect,
      unfoldEffect: languageMod.unfoldEffect,
      foldState: languageMod.foldState,
      foldable: languageMod.foldable,
      foldedRanges: languageMod.foldedRanges,
      linter: lintMod.linter,
      lintGutter: lintMod.lintGutter,
      json: jsonLang.json,
      jsonParseLinter: jsonLang.jsonParseLinter,
      yaml: yamlLang.yaml,
      xml: xmlLang.xml,
      csv: csvLang.csv,
      csvParseLinter: csvLang.csvParseLinter,
      javascript: jsLang.javascript,
      java: javaLang.java,
      go: goLang.go,
      rust: rustLang.rust,
      python: pythonLang.python,
      search: searchMod.search,
      searchKeymap: searchMod.searchKeymap,
      openSearchPanel: searchMod.openSearchPanel,
      closeSearchPanel: searchMod.closeSearchPanel,
      highlightSelectionMatches: searchMod.highlightSelectionMatches
    }

    wrapCompartment = new runtime.Compartment()

    return runtime
  }

  function getLanguageExtension(cm: CodeMirrorRuntime): Extension | null {
    const lang = (props.language || '').toLowerCase()
    if (lang === 'json') return cm.json()
    if (lang === 'yaml') return cm.yaml()
    if (lang === 'xml') return cm.xml()
    if (lang === 'csv') return cm.csv()
    if (lang === 'javascript' || lang === 'js') return cm.javascript({ typescript: false })
    if (lang === 'typescript' || lang === 'ts') return cm.javascript({ typescript: true })
    if (lang === 'java') return cm.java()
    if (lang === 'go') return cm.go()
    if (lang === 'rust' || lang === 'rs') return cm.rust()
    if (lang === 'python' || lang === 'py') return cm.python()
    return null
  }

  function getLintExtension(cm: CodeMirrorRuntime): Extension[] {
    if (props.lint === false || !cm.linter) return []

    const exts: Extension[] = []
    if (cm.lintGutter) {
      exts.push(cm.lintGutter())
    }

    const lang = (props.language || '').toLowerCase()
    if (lang === 'json' && cm.jsonParseLinter) {
      exts.push(cm.linter(cm.jsonParseLinter()))
    }
    if (lang === 'csv' && cm.csvParseLinter) {
      exts.push(cm.linter(cm.csvParseLinter()))
    }

    return exts
  }

  function unfoldRangeAndDescendants(
    editorView: EditorView,
    cm: CodeMirrorRuntime,
    targetRange: { from: number; to: number }
  ) {
    const field = editorView.state.field(cm.foldState, false)
    const effects: ReturnType<typeof cm.unfoldEffect.of>[] = [cm.unfoldEffect.of(targetRange)]
    if (field) {
      field.between(targetRange.from, targetRange.to, (from, to) => {
        effects.push(cm.unfoldEffect.of({ from, to }))
      })
    }
    editorView.dispatch({ effects })
  }

  function buildExtensions(cm: CodeMirrorRuntime): Extension[] {
    const exts: Extension[] = []

    if (props.lineNumbers) {
      exts.push(cm.lineNumbers())
      exts.push(cm.highlightActiveLineGutter())
    }

    if (props.codeFolding) {
      exts.push(
        cm.codeFolding({
          preparePlaceholder: (state, range) => {
            const fromLine = state.doc.lineAt(range.from).number
            const toLine = state.doc.lineAt(range.to).number
            const lines = Math.max(1, toLine - fromLine)
            return { range, lines }
          },
          placeholderDOM: (view, _onclick, prepared) => {
            const span = document.createElement('span')
            span.className = 'cm-foldPlaceholder'
            const lines = prepared?.lines || 0
            span.textContent = lines > 1 ? `… ${lines} 行` : '…'
            span.setAttribute('aria-label', `展开折叠的 ${lines} 行代码`)
            span.title = `点击展开代码 (${lines} 行)`

            span.addEventListener('click', (e) => {
              e.preventDefault()
              e.stopPropagation()
              const targetRange = prepared?.range
              if (targetRange) {
                unfoldRangeAndDescendants(view, cm, targetRange)
              } else {
                const line = view.lineBlockAt(view.posAtDOM(span))
                const field = view.state.field(cm.foldState, false)
                let folded: { from: number; to: number } | null = null
                field?.between(line.from, line.to, (from, to) => {
                  if (!folded || folded.from > from) folded = { from, to }
                })
                if (folded) {
                  unfoldRangeAndDescendants(view, cm, folded)
                }
              }
            })
            return span
          }
        }),
        cm.foldGutter({
          markerDOM: (open) => createFoldMarker(open),
          domEventHandlers: {
            click: (view, line) => {
              const field = view.state.field(cm.foldState, false)
              if (!field) return false
              let targetFold: { from: number; to: number } | null = null
              field.between(line.from, line.to, (from, to) => {
                if (!targetFold || targetFold.from > from) {
                  targetFold = { from, to }
                }
              })
              if (targetFold) {
                unfoldRangeAndDescendants(view, cm, targetFold)
                return true
              }
              const range = cm.foldable(view.state, line.from, line.to)
              if (range) {
                view.dispatch({ effects: cm.foldEffect.of(range) })
                return true
              }
              return false
            }
          }
        }),
        cm.EditorView.domEventHandlers({
          dblclick: (event, view) => {
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
            if (pos == null) return false
            const line = view.lineBlockAt(pos)
            const field = view.state.field(cm.foldState, false)
            if (!field || field.size === 0) return false
            let targetFold: { from: number; to: number } | null = null
            field.between(line.from, line.to, (from, to) => {
              if (!targetFold || targetFold.from > from) {
                targetFold = { from, to }
              }
            })
            if (targetFold) {
              unfoldRangeAndDescendants(view, cm, targetFold)
              event.preventDefault()
              return true
            }
            return false
          }
        })
      )
    }

    exts.push(
      cm.search({ top: true }),
      cm.EditorState.phrases.of({
        Find: '查找...',
        Replace: '替换为...',
        next: '下一个',
        previous: '上一个',
        all: '全部',
        'match case': '大小写',
        regexp: '正则',
        'by word': '全词',
        replace: '替换',
        'replace all': '全部替换',
        close: '关闭'
      }),
      cm.highlightSelectionMatches(),
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
      cm.EditorState.readOnly.of(Boolean(props.readonly)),
      cm.EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const value = update.state.doc.toString()
          internalUpdate = true
          emit('update:modelValue', value)
          nextTick(() => {
            internalUpdate = false
          })
        }
        if (props.codeFolding && cm.foldState) {
          const field = update.state.field(cm.foldState, false)
          const hasFolds = Boolean(field && field.size > 0)
          if (isAllFolded.value !== hasFolds) {
            isAllFolded.value = hasFolds
          }
        }
      }),
      cm.keymap.of([
        {
          key: 'Mod-k',
          run: () => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('devutils:open-command-palette'))
            }
            return true
          }
        },
        ...(props.showSearch !== false ? cm.searchKeymap : []),
        cm.indentWithTab,
        ...(props.codeFolding ? cm.foldKeymap : []),
        ...cm.defaultKeymap,
        ...cm.historyKeymap
      ])
    )

    const lang = getLanguageExtension(cm)
    if (lang) exts.push(lang)

    const lintExts = getLintExtension(cm)
    if (lintExts.length > 0) {
      exts.push(...lintExts)
    }

    exts.push(
      cm.tooltips({
        parent: typeof document !== 'undefined' ? document.body : undefined,
        tooltipSpace: (v) => {
          const rect = v.dom.getBoundingClientRect()
          return {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right
          }
        }
      })
    )

    if (props.placeholder) {
      exts.push(cm.placeholder(props.placeholder))
    }

    if (wrapCompartment) {
      exts.push(wrapCompartment.of(isWrapped.value ? cm.EditorView.lineWrapping : []))
    }

    return exts
  }

  async function mountEditor() {
    if (!editorHost.value || isDisposed) return
    const cm = await loadCodeMirror()
    if (isDisposed || !editorHost.value) return

    if (view) {
      view.destroy()
      view = null
    }

    view = new cm.EditorView({
      parent: editorHost.value,
      state: cm.EditorState.create({
        doc: props.modelValue || '',
        extensions: buildExtensions(cm)
      })
    })

    if (isDisposed) {
      view.destroy()
      view = null
      return
    }

    if (props.codeFolding && cm.foldState) {
      const field = view.state.field(cm.foldState, false)
      isAllFolded.value = Boolean(field && field.size > 0)
    }
  }

  async function remountEditor() {
    view?.destroy()
    view = null
    await mountEditor()
  }

  function syncValue(val?: string) {
    if (!view || internalUpdate) return
    const current = view.state.doc.toString()
    if ((val || '') === current) return

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: val || ''
      }
    })
  }

  function setValue(text: string) {
    internalUpdate = true
    emit('update:modelValue', text)
    if (view) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: text
        }
      })
    }
    nextTick(() => {
      internalUpdate = false
    })
  }

  function foldAll() {
    if (!view || !runtime) return
    runtime.foldAll(view)
    isAllFolded.value = true
  }

  function unfoldAll() {
    if (!view || !runtime) return
    runtime.unfoldAll(view)
    isAllFolded.value = false
  }

  function toggleFoldAll() {
    if (!view || !runtime) return
    const field = view.state.field(runtime.foldState, false)
    const hasFolds = Boolean(field && field.size > 0)
    if (hasFolds) {
      unfoldAll()
    } else {
      foldAll()
    }
  }

  function toggleWordWrap() {
    isWrapped.value = !isWrapped.value
    if (view && runtime && wrapCompartment) {
      view.dispatch({
        effects: wrapCompartment.reconfigure(isWrapped.value ? runtime.EditorView.lineWrapping : [])
      })
    }
  }

  function openSearch() {
    if (!view || !runtime) return
    runtime.openSearchPanel(view)
  }

  function destroy() {
    isDisposed = true
    view?.destroy()
    view = null
  }

  onMounted(() => {
    void mountEditor()
  })

  onBeforeUnmount(() => {
    destroy()
  })

  watch(() => props.modelValue, (val) => syncValue(val))

  watch(
    () => [props.language, props.readonly, props.placeholder, props.lineNumbers, props.codeFolding, props.lint, props.showSearch],
    () => {
      if (view) void remountEditor()
    }
  )

  watch(
    () => props.lineWrapping,
    (val) => {
      if (val !== isWrapped.value) {
        isWrapped.value = Boolean(val)
        if (view && runtime && wrapCompartment) {
          view.dispatch({
            effects: wrapCompartment.reconfigure(val ? runtime.EditorView.lineWrapping : [])
          })
        }
      }
    }
  )

  return {
    view: () => view,
    isWrapped,
    isAllFolded,
    mountEditor,
    remountEditor,
    syncValue,
    setValue,
    foldAll,
    unfoldAll,
    toggleFoldAll,
    toggleWordWrap,
    openSearch,
    destroy
  }
}
