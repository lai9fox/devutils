export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'danger-hover'
  | 'warning'
  | 'warning-solid'
  | 'success'
  | 'outline'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'

export type InputSize = 'sm' | 'md' | 'lg'

export interface SelectOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export type SelectSize = 'sm' | 'md'

export interface SegmentedOption<T = any> {
  label: string
  value: T
  icon?: any
}

export type SegmentedItem = SegmentedOption | string

export type MessageType = 'success' | 'error' | 'warning' | 'info'

export interface MessageOptions {
  type?: MessageType
  content: string
  duration?: number
  closable?: boolean
}

export interface MessageInstance extends MessageOptions {
  id: number
  type: MessageType
  duration: number
}

export interface SliderProps {
  modelValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  class?: string
}

export type CheckboxSize = 'sm' | 'md'

export interface CheckboxProps {
  modelValue?: boolean | any[] | any
  value?: any
  trueValue?: any
  falseValue?: any
  disabled?: boolean
  indeterminate?: boolean
  size?: CheckboxSize
  label?: string
  description?: string
  id?: string
  name?: string
  title?: string
  class?: string
  checkboxClass?: string
}

export type SplitPaneBreakpoint = 'none' | 'sm' | 'md' | 'lg' | 'xl'

export interface SplitPaneProps {
  modelValue?: number
  defaultPercent?: number
  minPercent?: number
  maxPercent?: number
  breakpoint?: SplitPaneBreakpoint
  disabled?: boolean
  leftClass?: string
  rightClass?: string
}
