/**
 * Message —— 函数式全局消息（$message 风格）。
 * 用法：Message.success('已保存')；无需写模板，返回 close 函数。
 * 实现：单例容器 + render() 挂载 MessageItem，队列垂直堆叠，duration 后自动关闭。
 */
import { h, render, type VNode } from 'vue'
import MessageItem from './components/MessageItem.vue'

export type MessageType = 'info' | 'success' | 'warning' | 'error'

export interface MessageOptions {
  /** 自动关闭毫秒数，0 表示不自动关闭（默认 3000） */
  duration?: number
  /** 是否显示关闭按钮（默认 true） */
  closable?: boolean
  /** 顶部偏移 px（默认 16） */
  offset?: number
  /** 关闭时回调 */
  onClose?: () => void
}

interface Entry {
  el: HTMLElement
  vnode: VNode
  timer: number | undefined
  options: MessageOptions
}

const entries: Entry[] = []
let container: HTMLElement | null = null

function ensureContainer() {
  if (container && document.body.contains(container)) return
  container = document.createElement('div')
  container.className = 'dmk-message-container'
  container.style.cssText = [
    'position:fixed',
    'top:0',
    'left:50%',
    'transform:translateX(-50%)',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'gap:8px',
    'z-index:var(--dmk-z-message)',
    'pointer-events:none'
  ].join(';')
  document.body.appendChild(container)
}

function close(entry: Entry) {
  const idx = entries.indexOf(entry)
  if (idx === -1) return
  entries.splice(idx, 1)
  if (entry.timer) window.clearTimeout(entry.timer)
  entry.options.onClose?.()
  // 淡出后再卸载，避免硬切
  entry.el.style.transition = 'opacity 160ms ease, transform 160ms ease'
  entry.el.style.opacity = '0'
  entry.el.style.transform = 'translateY(-6px)'
  window.setTimeout(() => {
    render(null, entry.el)
    entry.el.remove()
  }, 170)
}

export function showMessage(type: MessageType, text: string, options: MessageOptions = {}) {
  ensureContainer()
  const offset = options.offset ?? 16
  const el = document.createElement('div')
  el.style.pointerEvents = 'auto'
  el.style.marginTop = entries.length === 0 ? `${offset}px` : '0'

  const entry: Entry = { el, vnode: null as unknown as VNode, timer: undefined, options }
  const vnode = h(MessageItem, {
    type,
    text,
    closable: options.closable ?? true,
    onClose: () => close(entry)
  })
  entry.vnode = vnode
  render(vnode, el)
  container!.appendChild(el)
  entries.push(entry)

  const duration = options.duration ?? 3000
  if (duration > 0) {
    entry.timer = window.setTimeout(() => close(entry), duration)
  }
  return () => close(entry)
}

export const Message = {
  info: (text: string, options?: MessageOptions) => showMessage('info', text, options),
  success: (text: string, options?: MessageOptions) => showMessage('success', text, options),
  warning: (text: string, options?: MessageOptions) => showMessage('warning', text, options),
  error: (text: string, options?: MessageOptions) => showMessage('error', text, options),
  closeAll: () => {
    ;[...entries].forEach(close)
  }
}
