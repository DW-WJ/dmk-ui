<script setup lang="ts">
/**
 * MessageBox —— 函数式确认框（$msgbox 风格）。
 * 契约参考 Element Plus ElMessageBox：
 *   type（success|info|warning|error）/ title / message /
 *   confirmButtonText / cancelButtonText / showConfirmButton / showCancelButton /
 *   showClose / closeOnClickModal / closeOnPressEscape / distinguishCancelAndClose /
 *   customClass / center / draggable / icon / zIndex
 *   Promise 语义：确认 → resolve('confirm')；取消 → reject('cancel')；
 *                Esc/遮罩关闭 → reject('close')。
 */
import { nextTick, onMounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'success' | 'info' | 'warning' | 'error'
    title?: string
    message?: string
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
  }>(),
  {
    type: 'info',
    title: '提示',
    message: '',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    showConfirmButton: true,
    showCancelButton: false,
    showClose: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    distinguishCancelAndClose: false,
    customClass: undefined,
    center: false,
    draggable: false,
    icon: undefined,
    zIndex: undefined
  }
)

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
}>()

/** 焦点归还：关闭时把焦点还给打开前的元素 */
let lastFocused: HTMLElement | null = null

const titleId = `dmk-msgbox-title-${Math.random().toString(36).slice(2, 8)}`
const bodyId = `dmk-msgbox-body-${Math.random().toString(36).slice(2, 8)}`

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closeOnPressEscape) {
    e.stopPropagation()
    emit('close')
  }
}

onMounted(() => {
  lastFocused = document.activeElement as HTMLElement | null
  window.addEventListener('keydown', onKeydown)
  void nextTick(() => {
    document.querySelector<HTMLElement>('.dmk-msgbox__confirm')?.focus()
  })
})

watch(
  () => props.draggable,
  (v) => {
    if (v) enableDrag()
  }
)

/* ---------- 拖拽 ---------- */
let dragging = false
let startX = 0
let startY = 0
let originX = 0
let originY = 0
let boxRef: HTMLElement | null = null

function enableDrag() {
  const handle = document.querySelector<HTMLElement>('.dmk-msgbox__header')
  if (!handle) return
  handle.addEventListener('mousedown', onMouseDown)
}

function onMouseDown(e: MouseEvent) {
  if (!props.draggable) return
  const target = e.target as HTMLElement
  // 关闭按钮不触发拖拽
  if (target.closest('.dmk-msgbox__close')) return
  dragging = true
  startX = e.clientX
  startY = e.clientY
  originX = 0
  originY = 0
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  e.preventDefault()
}

function onMouseMove(e: MouseEvent) {
  if (!dragging) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  originX += dx
  originY += dy
  startX = e.clientX
  startY = e.clientY
  if (boxRef) {
    boxRef.style.transform = `translate(${originX}px, ${originY}px)`
  }
}

function onMouseUp() {
  dragging = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

defineExpose({
  /** 关闭后归还焦点 */
  restoreFocus: () => lastFocused?.focus?.()
})
</script>

<template>
  <div class="dmk-msgbox__overlay" @click.self="closeOnClickModal && emit('close')">
    <div
      ref="boxRef"
      class="dmk-msgbox"
      :class="[customClass, { 'is-center': center, 'is-draggable': draggable }]"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="bodyId"
      :style="zIndex ? { zIndex: String(zIndex) } : undefined"
    >
      <header v-if="title" class="dmk-msgbox__header">
        <span v-if="icon" class="dmk-msgbox__icon" :class="`is-${type}`" aria-hidden="true">{{ icon }}</span>
        <span :id="titleId" class="dmk-msgbox__title">{{ title }}</span>
        <button
          v-if="showClose"
          type="button"
          class="dmk-msgbox__close"
          aria-label="关闭"
          @click="emit('close')"
        >
          ×
        </button>
      </header>

      <div class="dmk-msgbox__body">
        <p v-if="icon && !title" class="dmk-msgbox__icon" :class="`is-${type}`" aria-hidden="true">{{ icon }}</p>
        <p :id="bodyId" class="dmk-msgbox__message">{{ message }}</p>
      </div>

      <footer class="dmk-msgbox__footer">
        <button
          v-if="showCancelButton"
          type="button"
          class="dmk-msgbox__cancel"
          @click="emit('cancel')"
        >
          {{ cancelButtonText }}
        </button>
        <button
          v-if="showConfirmButton"
          type="button"
          class="dmk-msgbox__confirm"
          :class="`is-${type}`"
          @click="emit('confirm')"
        >
          {{ confirmButtonText }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.dmk-msgbox__overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--dmk-color-mask);
  z-index: var(--dmk-z-modal);
}

.dmk-msgbox {
  width: 100%;
  max-width: 420px;
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
  color: var(--dmk-color-text);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  overflow: hidden;
}

.dmk-msgbox.is-center {
  text-align: center;
}

.dmk-msgbox.is-draggable .dmk-msgbox__header {
  cursor: move;
  user-select: none;
}

.dmk-msgbox__header {
  display: flex;
  align-items: center;
  gap: var(--dmk-space-sm);
  padding: var(--dmk-space-md) var(--dmk-space-lg);
  border-bottom: 1px solid var(--dmk-color-border-subtle);
}

.dmk-msgbox__title {
  flex: 1 1 auto;
  font-size: var(--dmk-font-md);
  font-weight: 600;
  line-height: 1.4;
}

.dmk-msgbox__icon {
  font-size: 20px;
  line-height: 1;
}

.dmk-msgbox__icon.is-success {
  color: var(--dmk-color-success);
}
.dmk-msgbox__icon.is-warning {
  color: var(--dmk-color-warning);
}
.dmk-msgbox__icon.is-error {
  color: var(--dmk-color-danger);
}
.dmk-msgbox__icon.is-info {
  color: var(--dmk-color-info);
}

.dmk-msgbox__close {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: var(--dmk-color-text-muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.dmk-msgbox__close:hover {
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-text);
}

.dmk-msgbox__body {
  display: flex;
  align-items: flex-start;
  gap: var(--dmk-space-sm);
  padding: var(--dmk-space-lg);
}

.dmk-msgbox__message {
  margin: 0;
  color: var(--dmk-color-text-secondary);
  line-height: 1.6;
  word-break: break-word;
}

.dmk-msgbox__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--dmk-space-sm);
  padding: var(--dmk-space-md) var(--dmk-space-lg);
  border-top: 1px solid var(--dmk-color-border-subtle);
  background: var(--dmk-color-surface-hover);
}

.dmk-msgbox.is-center .dmk-msgbox__footer {
  justify-content: center;
}

.dmk-msgbox__cancel,
.dmk-msgbox__confirm {
  min-height: var(--dmk-control-height);
  padding: 0 var(--dmk-control-padding-x);
  border-radius: var(--dmk-radius-md);
  border: 1px solid var(--dmk-color-border);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-secondary);
  font-family: inherit;
  font-size: var(--dmk-font-base);
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color var(--dmk-duration-fast) var(--dmk-ease),
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-msgbox__cancel:hover {
  background: var(--dmk-color-surface-hover);
}

.dmk-msgbox__confirm {
  background: var(--dmk-color-primary);
  border-color: var(--dmk-color-primary);
  color: var(--dmk-color-on-primary);
}

.dmk-msgbox__confirm:hover {
  background: var(--dmk-color-primary-hover);
  border-color: var(--dmk-color-primary-hover);
}

.dmk-msgbox__confirm.is-success {
  background: var(--dmk-color-success);
  border-color: var(--dmk-color-success);
}

.dmk-msgbox__confirm.is-warning {
  background: var(--dmk-color-warning);
  border-color: var(--dmk-color-warning);
}

.dmk-msgbox__confirm.is-error {
  background: var(--dmk-color-danger);
  border-color: var(--dmk-color-danger);
}

.dmk-msgbox__cancel:focus-visible,
.dmk-msgbox__confirm:focus-visible,
.dmk-msgbox__close:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}
</style>
