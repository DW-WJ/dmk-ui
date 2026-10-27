<script setup lang="ts">
/**
 * DModal —— 模态对话框。
 * Teleport 到 body + 遮罩过渡 + Esc/遮罩关闭 + body 锁滚动；
 * 确认/取消走具名插槽（footer），也可用默认按钮组（confirmText/cancelText）。
 */
import { onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    width?: string | number
    closable?: boolean
    closeOnMaskClick?: boolean
    closeOnEsc?: boolean
    showFooter?: boolean
    confirmText?: string
    cancelText?: string
    confirmLoading?: boolean
    confirmDisabled?: boolean
  }>(),
  {
    title: '',
    width: '480px',
    closable: true,
    closeOnMaskClick: true,
    closeOnEsc: true,
    showFooter: true,
    confirmText: '确定',
    cancelText: '取消',
    confirmLoading: false,
    confirmDisabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
  closed: []
}>()

const panelRef = ref<HTMLElement | null>(null)
/** 打开前的 body overflow，用于恢复 */
let prevOverflow = ''
let escBound = false

const widthStyle = () =>
  typeof props.width === 'number' ? `${props.width}px` : props.width

function close() {
  emit('update:modelValue', false)
  emit('cancel')
}

function onMaskClick() {
  if (props.closeOnMaskClick) close()
}

function onConfirm() {
  if (props.confirmDisabled || props.confirmLoading) return
  emit('confirm')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closeOnEsc) {
    e.stopPropagation()
    close()
  }
}

function bindEsc() {
  if (!escBound) {
    document.addEventListener('keydown', onKeydown)
    escBound = true
  }
}

function unbindEsc() {
  document.removeEventListener('keydown', onKeydown)
  escBound = false
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      bindEsc()
      // 打开后把焦点移进面板，键盘用户不用 Tab 找
      requestAnimationFrame(() => panelRef.value?.focus())
    } else {
      document.body.style.overflow = prevOverflow
      unbindEsc()
      emit('closed')
    }
  }
)

onBeforeUnmount(unbindEsc)
</script>

<template>
  <Teleport to="body">
    <Transition name="dmk-modal">
      <div
        v-if="modelValue"
        class="dmk-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="title || '对话框'"
      >
        <div class="dmk-modal__mask" @click="onMaskClick" />
        <div
          ref="panelRef"
          class="dmk-modal__panel"
          :style="{ width: widthStyle() }"
          tabindex="-1"
        >
          <header v-if="title || closable" class="dmk-modal__header">
            <slot name="title">
              <span class="dmk-modal__title">{{ title }}</span>
            </slot>
            <button
              v-if="closable"
              type="button"
              class="dmk-modal__close"
              aria-label="关闭"
              @click="close"
            >
              ×
            </button>
          </header>
          <div class="dmk-modal__body">
            <slot />
          </div>
          <footer v-if="showFooter || $slots.footer" class="dmk-modal__footer">
            <slot name="footer">
              <button type="button" class="dmk-modal__btn" @click="close">{{ cancelText }}</button>
              <button
                type="button"
                class="dmk-modal__btn dmk-modal__btn--primary"
                :disabled="confirmDisabled || confirmLoading"
                :aria-busy="confirmLoading ? 'true' : undefined"
                @click="onConfirm"
              >
                <span v-if="confirmLoading" class="dmk-modal__spinner" aria-hidden="true" />
                {{ confirmText }}
              </button>
            </slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dmk-modal {
  position: fixed;
  inset: 0;
  z-index: var(--dmk-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--dmk-space-xl);
}

.dmk-modal__mask {
  position: absolute;
  inset: 0;
  background: var(--dmk-color-mask);
}

.dmk-modal__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - var(--dmk-space-xl) * 2);
  max-width: 100%;
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
  outline: none;
}

.dmk-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--dmk-space-md);
  padding: var(--dmk-space-lg) var(--dmk-space-xl) 0;
}

.dmk-modal__title {
  font-size: var(--dmk-font-lg);
  font-weight: 600;
  color: var(--dmk-color-text);
}

.dmk-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: var(--dmk-color-text-muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-modal__close:hover {
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-text);
}

.dmk-modal__close:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-modal__body {
  flex: 1;
  overflow: auto;
  padding: var(--dmk-space-lg) var(--dmk-space-xl);
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-base);
}

.dmk-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--dmk-space-sm);
  padding: 0 var(--dmk-space-xl) var(--dmk-space-lg);
}

.dmk-modal__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: var(--dmk-control-height-sm);
  padding: 0 var(--dmk-control-padding-x);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-base);
  cursor: pointer;
  transition:
    background-color var(--dmk-duration-fast) var(--dmk-ease),
    border-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-modal__btn:hover:not(:disabled) {
  border-color: var(--dmk-color-border-strong);
  background: var(--dmk-color-surface-hover);
}

.dmk-modal__btn:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-modal__btn--primary {
  background: var(--dmk-color-primary);
  border-color: transparent;
  color: var(--dmk-color-on-primary);
  font-weight: 600;
}

.dmk-modal__btn--primary:hover:not(:disabled) {
  background: var(--dmk-color-primary-hover);
}

.dmk-modal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dmk-modal__spinner {
  width: 0.85em;
  height: 0.85em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: dmk-modal-spin 0.6s linear infinite;
}

@keyframes dmk-modal-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 过渡：遮罩淡入 + 面板下落 */
.dmk-modal-enter-active,
.dmk-modal-leave-active {
  transition: opacity var(--dmk-duration-base) var(--dmk-ease);
}

.dmk-modal-enter-active .dmk-modal__panel,
.dmk-modal-leave-active .dmk-modal__panel {
  transition: transform var(--dmk-duration-base) var(--dmk-ease);
}

.dmk-modal-enter-from,
.dmk-modal-leave-to {
  opacity: 0;
}

.dmk-modal-enter-from .dmk-modal__panel,
.dmk-modal-leave-to .dmk-modal__panel {
  transform: translateY(-12px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-modal-enter-active,
  .dmk-modal-leave-active,
  .dmk-modal-enter-active .dmk-modal__panel,
  .dmk-modal-leave-active .dmk-modal__panel {
    transition: none;
  }
}
</style>
