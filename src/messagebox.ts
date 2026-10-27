/**
 * MessageBox —— 函数式确认框服务层。
 * 用法：MessageBox.confirm('确定删除吗？', '提示')
 *
 * Promise 语义（对齐 Element Plus）：
 *   确认按钮 → resolve('confirm')
 *   取消按钮 → reject('cancel')
 *   Esc / 遮罩 / 右上角关闭 → reject('close')
 *   distinguishCancelAndClose=true 时，取消与关闭区分得更细：
 *   取消 → reject('cancel')，关闭 → reject('close')（默认行为已区分）。
 */
import { h, render, type VNode } from 'vue'
import MessageBoxView from './components/MessageBox.vue'

export type MessageBoxType = 'success' | 'info' | 'warning' | 'error'
export type MessageBoxAction = 'confirm' | 'cancel' | 'close'

export interface MessageBoxOptions {
  title?: string
  message?: string
  type?: MessageBoxType
  confirmButtonText?: string
  cancelButtonText?: string
  showConfirmButton?: boolean
  showCancelButton?: boolean
  showClose?: boolean
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  distinguishCancelAndClose?: boolean
  customClass?: string
  center?: boolean
  draggable?: boolean
  icon?: string
  zIndex?: number
}

interface Entry {
  el: HTMLElement
  vnode: VNode
}

const entries: Entry[] = []
let container: HTMLElement | null = null

function ensureContainer() {
  if (container && document.body.contains(container)) return
  container = document.createElement('div')
  container.className = 'dmk-msgbox-container'
  container.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:var(--dmk-z-modal)',
    'pointer-events:none'
  ].join(';')
  document.body.appendChild(container)
}

function destroy(entry: Entry) {
  const idx = entries.indexOf(entry)
  if (idx !== -1) entries.splice(idx, 1)
  render(null, entry.el)
  entry.el.remove()
  if (entries.length === 0 && container) {
    container.remove()
    container = null
  }
}

function open(options: MessageBoxOptions = {}): Promise<MessageBoxAction> {
  ensureContainer()
  const el = document.createElement('div')
  el.style.pointerEvents = 'auto'
  container!.appendChild(el)

  const entry: Entry = { el, vnode: null as unknown as VNode }

  return new Promise<MessageBoxAction>((resolve, reject) => {
    let settled = false
    const settle = (action: MessageBoxAction) => {
      if (settled) return
      settled = true
      destroy(entry)
      if (action === 'confirm') resolve(action)
      else reject(action)
    }

    const vnode = h(MessageBoxView, {
      type: options.type ?? 'info',
      title: options.title ?? '提示',
      message: options.message ?? '',
      confirmButtonText: options.confirmButtonText ?? '确定',
      cancelButtonText: options.cancelButtonText ?? '取消',
      showConfirmButton: options.showConfirmButton ?? true,
      showCancelButton: options.showCancelButton ?? false,
      showClose: options.showClose ?? true,
      closeOnClickModal: options.closeOnClickModal ?? true,
      closeOnPressEscape: options.closeOnPressEscape ?? true,
      distinguishCancelAndClose: options.distinguishCancelAndClose ?? false,
      customClass: options.customClass,
      center: options.center ?? false,
      draggable: options.draggable ?? false,
      icon: options.icon,
      zIndex: options.zIndex,
      onConfirm: () => settle('confirm'),
      onCancel: () => settle('cancel'),
      onClose: () => settle('close')
    })
    entry.vnode = vnode
    render(vnode, el)
  })
}

/** 关闭所有打开的 MessageBox */
export function closeAllMessageBoxes() {
  ;[...entries].forEach(destroy)
}

export const MessageBox = {
  /** 确认框（带取消按钮） */
  confirm: (message: string, title = '提示', options: MessageBoxOptions = {}) =>
    open({ ...options, message, title, showCancelButton: true, showConfirmButton: true }),
  /** 提示框（只有确认按钮） */
  alert: (message: string, title = '提示', options: MessageBoxOptions = {}) =>
    open({ ...options, message, title, showCancelButton: false, showConfirmButton: true }),
  /** 带类型语义的快捷方法 */
  success: (message: string, title = '成功', options: MessageBoxOptions = {}) =>
    open({ ...options, message, title, type: 'success' }),
  warning: (message: string, title = '警告', options: MessageBoxOptions = {}) =>
    open({ ...options, message, title, type: 'warning' }),
  error: (message: string, title = '错误', options: MessageBoxOptions = {}) =>
    open({ ...options, message, title, type: 'error' }),
  info: (message: string, title = '提示', options: MessageBoxOptions = {}) =>
    open({ ...options, message, title, type: 'info' }),
  closeAll: closeAllMessageBoxes
}
