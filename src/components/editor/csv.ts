import { StreamLanguage, LanguageSupport, type StringStream } from '@codemirror/language'
import type { EditorView } from '@codemirror/view'
import type { Diagnostic } from '@codemirror/lint'
import Papa from 'papaparse'

export interface CSVParserState {
  inQuotes: boolean
  quoteChar: string
  column: number
  line: number
}

export const csvLanguage = StreamLanguage.define<CSVParserState>({
  name: 'csv',
  startState() {
    return {
      inQuotes: false,
      quoteChar: '"',
      column: 0,
      line: 0
    }
  },
  blankLine(state) {
    if (!state.inQuotes) {
      state.line++
      state.column = 0
    }
  },
  token(stream: StringStream, state: CSVParserState): string | null {
    if (stream.sol() && !state.inQuotes) {
      state.line++
      state.column = 0
    }

    // Comment line support (if line starts with #)
    if (!state.inQuotes && stream.sol() && stream.match(/^#.*/)) {
      return 'comment'
    }

    // Inside quoted field
    if (state.inQuotes) {
      while (!stream.eol()) {
        const ch = stream.next()
        if (ch === state.quoteChar) {
          // Double quote escape: ""
          if (stream.peek() === state.quoteChar) {
            stream.next()
          } else {
            state.inQuotes = false
            break
          }
        }
      }
      return 'string'
    }

    // Spaces
    if (stream.eatSpace()) {
      return null
    }

    // Delimiters (comma, semicolon, tab)
    const ch = stream.peek()
    if (ch === ',' || ch === ';' || ch === '\t') {
      stream.next()
      state.column++
      return 'punctuation'
    }

    // Quoted field start
    if (ch === '"' || ch === "'") {
      state.quoteChar = stream.next() as string
      state.inQuotes = true
      while (!stream.eol()) {
        const nextCh = stream.next()
        if (nextCh === state.quoteChar) {
          if (stream.peek() === state.quoteChar) {
            stream.next()
          } else {
            state.inQuotes = false
            break
          }
        }
      }
      return 'string'
    }

    // Number (integer, decimal, scientific notation)
    if (stream.match(/^[+-]?(0x[\da-fA-F]+|\d+(\.\d+)?([eE][+-]?\d+)?)(?=[,;\t\r\n]|$)/)) {
      return 'number'
    }

    // Boolean / Null literal
    if (stream.match(/^(true|false|null|nan|undefined)\b/i)) {
      return 'bool'
    }

    // Unquoted text field: consume until next delimiter, quote or newline
    stream.eatWhile(/[^,;\t\r\n"']/)

    // First line is header
    if (state.line <= 1) {
      return 'heading'
    }

    return state.column % 2 === 0 ? 'variableName' : 'propertyName'
  },
  copyState(state) {
    return { ...state }
  }
})

export function csv(): LanguageSupport {
  return new LanguageSupport(csvLanguage)
}

export function csvParseLinter() {
  return (view: EditorView): Diagnostic[] => {
    const doc = view.state.doc.toString()
    if (!doc.trim()) return []

    const results = Papa.parse(doc)
    if (!results.errors || results.errors.length === 0) return []

    const diagnostics: Diagnostic[] = []
    for (const err of results.errors) {
      let from = 0
      let to = 0
      if (typeof err.index === 'number' && err.index >= 0 && err.index <= view.state.doc.length) {
        from = err.index
        to = Math.min(view.state.doc.length, err.index + 1)
      } else if (typeof err.row === 'number' && err.row >= 0) {
        const lineNum = Math.min(view.state.doc.lines, err.row + 1)
        const line = view.state.doc.line(lineNum)
        from = line.from
        to = line.to
      }

      diagnostics.push({
        from,
        to,
        severity: (err.type === 'FieldMismatch' ? 'warning' : 'error') as 'warning' | 'error',
        message: err.message
      })
    }
    return diagnostics
  }
}
