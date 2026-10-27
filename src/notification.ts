/**
 * Notification —— 函数式全局通知（$notification 风格）。
 * 用法：Notification.success({ title: '已保存', message: '数据已写入' })
 *
 * 实现：单例容器 + render() 挂载 NotificationItem，右侧垂直堆叠；
 *      duration 到期自动关闭，返回 close 函数。
 */
import { h, render, type VNode } from 'vue'
import NotificationItem from './components/NotificationItem.vue'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface NotificationOptions {
  title?: string
  message?: string
  /** 自动关闭毫秒数，0 表示不自动关闭（默认 4500） */
  duration?: number
  /** 是否显示关闭按钮（默认 true） */
  closable?: boolean
  /** 右上角偏移 px（默认 16） */
  offset?: number
  /** 关闭时回调 */
  onClose?: () => void
}

interface Entry {
  el: HTMLElement
  vnode: VNode
  timer: number | undefined
  options: NotificationOptions
}

const entries: Entry[] = []
let container: HTMLElement | null = null

function ensureContainer() {
  if (container && document.body.contains(container)) return
  container = document.createElement('div')
  container.className = 'dmk-notification-container'
  container.style.cssText = [
    'position:fixed',
    'top:0',
    'right:0',
    'display:flex',
    'flex-direction:column',
    'align-items:flex-end',
    'gap:10px',
    'padding:16px',
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
  entry.el.style.transition = 'opacity 160ms ease, transform 160ms ease'
  entry.el.style.opacity = '0'
  entry.el.style.transform = 'translateX(8px)'
  window.setTimeout(() => {
    render(null, entry.el)
    entry.el.remove()
  }, 170)
}

export function showNotification(type: NotificationType, options: NotificationOptions = {}) {
  ensureContainer()
  const el = document.createElement('div')
  el.style.pointerEvents = 'auto'
  el.style.marginTop = entries.length === 0 ? '0' : '0'

  const entry: Entry = { el, vnode: null as unknown as VNode, timer: undefined, options }
  const vnode = h(NotificationItem, {
    type,
    title: options.title ?? '',
    message: options.message ?? '',
    closable: options.closable ?? true,
    onClose: () => close(entry)
  })
  entry.vnode = vnode
  render(vnode, el)
  container!.appendChild(el)
  entries.push(entry)

  const duration = options.duration ?? 4500
  if (duration > 0) {
    entry.timer = window.setTimeout(() => close(entry), duration)
  }
  return () => close(entry)
}

export const Notification = {
  info: (options?: NotificationOptions | string) =>
    showNotification('info', typeof options === 'string' ? { title: options } : options),
  success: (options?: NotificationOptions | string) =>
    showNotification('success', typeof options === 'string' ? { title: options } : options),
  warning: (options?: NotificationOptions | string) =>
    showNotification('warning', typeof options === 'string' ? { title: options } : options),
  error: (options?: NotificationOptions | string) =>
    showNotification('error', typeof options === 'string' ? { title: options } : options),
  closeAll: () => {
    ;[...entries].forEach(close)
  }
}
