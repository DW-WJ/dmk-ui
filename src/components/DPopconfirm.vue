<script setup lang="ts">
/**
 * DPopconfirm —— 气泡确认。
 * 设计要点：reference 插槽 + 确认/取消两按钮；点击外部或 Esc 关闭；
 * 确认走 confirm 事件、取消走 cancel 事件；type 决定强调色。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    confirmButtonText?: string
    cancelButtonText?: string
    type?: 'primary' | 'success' | 'warning' | 'danger'
    width?: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    trigger?: 'click' | 'hover'
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    title: '确认操作？',
    description: '',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'primary',
    width: '240px',
    placement: 'bottom',
    trigger: 'click',
    disabled: false,
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  confirm: []
  cancel: []
  'update:visible': [value: boolean]
}>()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)

const accent = computed(() => {
  if (props.type === 'success') return 'var(--dmk-color-success)'
  if (props.type === 'warning') return 'var(--dmk-color-warning)'
  if (props.type === 'danger') return 'var(--dmk-color-danger)'
  return 'var(--dmk-color-primary)'
})

function setOpen(v: boolean) {
  if (props.disabled) return
  open.value = v
  emit('update:visible', v)
}

function onConfirm() {
  emit('confirm')
  setOpen(false)
}

function onCancel() {
  emit('cancel')
  setOpen(false)
}

function onDocPointerDown(e: MouseEvent) {
  if (!open.value) return
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) setOpen(false)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    e.stopPropagation()
    setOpen(false)
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocPointerDown, true)
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocPointerDown, true)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <span ref="rootRef" class="dmk-popconfirm" :class="`is-${placement}`">
    <span
      class="dmk-popconfirm__reference"
      tabindex="0"
      role="button"
      :aria-expanded="open"
      :aria-label="ariaLabel"
      @click="trigger === 'click' && setOpen(!open)"
      @mouseenter="trigger === 'hover' && setOpen(true)"
      @mouseleave="trigger === 'hover' && setOpen(false)"
    >
      <slot name="reference" />
    </span>

    <Transition name="pop">
      <div
        v-if="open"
        class="dmk-popconfirm__panel"
        role="alertdialog"
        :aria-label="title"
        :style="{ width }"
      >
        <div class="dmk-popconfirm__title" :style="{ color: accent }">
          <slot name="title">{{ title }}</slot>
        </div>
        <div v-if="description || $slots.description" class="dmk-popconfirm__desc">
          <slot name="description">{{ description }}</slot>
        </div>
        <div class="dmk-popconfirm__actions">
          <slot name="footer" :confirm="onConfirm" :cancel="onCancel">
            <button type="button" class="dmk-popconfirm__btn" @click="onCancel">
              {{ cancelButtonText }}
            </button>
            <button
              type="button"
              class="dmk-popconfirm__btn is-primary"
              :style="{ background: accent, borderColor: accent }"
              @click="onConfirm"
            >
              {{ confirmButtonText }}
            </button>
          </slot>
        </div>
      </div>
    </Transition>
  </span>
</template>

<style scoped>
.dmk-popconfirm {
  position: relative;
  display: inline-block;
  font-family: var(--dmk-font-family);
}

.dmk-popconfirm__reference {
  display: inline-flex;
  outline: none;
  cursor: pointer;
}

.dmk-popconfirm__reference:focus-visible {
  box-shadow: var(--dmk-shadow-focus);
  border-radius: var(--dmk-radius-sm);
}

.dmk-popconfirm__panel {
  position: absolute;
  z-index: var(--dmk-z-popup);
  padding: 12px;
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  box-shadow: var(--dmk-shadow-md);
}

.dmk-popconfirm.is-bottom .dmk-popconfirm__panel { top: calc(100% + 8px); left: 0; }
.dmk-popconfirm.is-top .dmk-popconfirm__panel { bottom: calc(100% + 8px); left: 0; }
.dmk-popconfirm.is-left .dmk-popconfirm__panel { right: calc(100% + 8px); top: 50%; transform: translateY(-50%); }
.dmk-popconfirm.is-right .dmk-popconfirm__panel { left: calc(100% + 8px); top: 50%; transform: translateY(-50%); }

.dmk-popconfirm__title {
  font-size: var(--dmk-font-sm);
  font-weight: 600;
}

.dmk-popconfirm__desc {
  margin-top: 4px;
  font-size: var(--dmk-font-sm);
  line-height: 1.6;
  color: var(--dmk-color-text-secondary);
}

.dmk-popconfirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.dmk-popconfirm__btn {
  height: 28px;
  padding: 0 12px;
  font-family: inherit;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-secondary);
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  cursor: pointer;
}

.dmk-popconfirm__btn:hover {
  color: var(--dmk-color-text);
  background: var(--dmk-color-surface-hover);
}

.dmk-popconfirm__btn.is-primary {
  color: var(--dmk-color-on-primary);
}

.dmk-popconfirm__btn:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity var(--dmk-duration-fast) var(--dmk-ease),
    transform var(--dmk-duration-fast) var(--dmk-ease);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .pop-enter-active,
  .pop-leave-active {
    transition: none;
  }
}
</style>
