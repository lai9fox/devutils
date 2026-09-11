import { ref, createVNode, render } from 'vue'
import UiMessageContainer from './UiMessageContainer.vue'
import type { MessageInstance, MessageOptions, MessageType } from './types'

export const messageList = ref<MessageInstance[]>([])

let seed = 0
let containerElement: HTMLElement | null = null

function ensureContainer(): HTMLElement | null {
  if (typeof document === 'undefined') return null

  if (!containerElement || !document.body.contains(containerElement)) {
    const existing = document.getElementById('ui-message-root')
    if (existing) {
      containerElement = existing
    } else {
      containerElement = document.createElement('div')
      containerElement.id = 'ui-message-root'
      document.body.appendChild(containerElement)
      const vnode = createVNode(UiMessageContainer)
      render(vnode, containerElement)
    }
  }

  return containerElement
}

export function removeMessage(id: number) {
  const index = messageList.value.findIndex((item) => item.id === id)
  if (index !== -1) {
    messageList.value.splice(index, 1)
  }
}

function show(options: MessageOptions | string, type: MessageType = 'info'): () => void {
  if (typeof window === 'undefined') return () => {}

  ensureContainer()

  const normalizedOptions: MessageOptions =
    typeof options === 'string' ? { content: options, type } : { type, ...options }

  const id = ++seed
  const duration = normalizedOptions.duration ?? 2500

  const instance: MessageInstance = {
    id,
    type: normalizedOptions.type || type,
    content: normalizedOptions.content,
    duration,
    closable: normalizedOptions.closable ?? false
  }

  if (messageList.value.length >= 4) {
    messageList.value.shift()
  }

  messageList.value.push(instance)

  if (duration > 0) {
    setTimeout(() => {
      removeMessage(id)
    }, duration)
  }

  return () => removeMessage(id)
}

export const message = Object.assign((options: MessageOptions | string) => show(options), {
  success: (content: string, duration?: number) =>
    show({ content, duration, type: 'success' }, 'success'),
  error: (content: string, duration?: number) =>
    show({ content, duration, type: 'error' }, 'error'),
  warning: (content: string, duration?: number) =>
    show({ content, duration, type: 'warning' }, 'warning'),
  info: (content: string, duration?: number) => show({ content, duration, type: 'info' }, 'info'),
  destroy: () => {
    messageList.value = []
  }
})
