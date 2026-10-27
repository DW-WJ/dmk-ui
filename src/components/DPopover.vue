<script setup lang="ts">
/**
 * DPopover —— 气泡卡片。
 * 设计要点：reference 插槽挂触发元素，浮层面板按 placement 对齐；
 * click / hover / focus 三种触发；Esc 关闭、点击外部关闭、关闭后焦点归位；
 * 支持受控 visible（v-model:visible）。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 面板内容（也可用 default 插槽） */
    content?: string
    title?: string
    width?: string
    trigger?: 'click' | 'hover' | 'focus'
    placement?: 'top' | 'bottom' | 'left' | 'right'
    disabled?: boolean
    /** 受控显示 */
    visible?: boolean
    /** 显示小箭头 */
    arrow?: boolean
    ariaLabel?: string
  }>(),
  {
    content: '',
    title: '',
    width: '220px',
    trigger: 'click',
    placement: 'bottom',
    disabled: false,
    visible: undefined,
    arrow: true,
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  show: []
  hide: []
}>()

const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const inner = ref(false)
const isControlled = computed(() => props.visible !== undefined)
const shown = computed(() => (isControlled.value ? props.visible : inner.value))

function setVisible(v: boolean) {
  if (props.disabled) return
  // 受控模式（给了 visible）：组件不存内部状态，显示完全由父组件决定
  if (!isControlled.value) inner.value = v
  emit('update:visible', v)
  if (v) {
    emit('show')
    nextTick(() => panelRef.value?.focus())
  } else {
    emit('hide')
  }
}

function onDocPointerDown(e: MouseEvent) {
  if (!shown.value) return
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    // 受控模式：只发 hide 通知，**不擅自改受控值** ——
    // 否则 emit('update:visible', false) 会与父组件自己的 toggle 逻辑打架
    // （父组件在 click 里读到的已是改过的值，再取反就把面板又打开了）。
    // 父组件可监听 @hide 自行决定是否关闭。
    if (isControlled.value) {
      emit('hide')
      return
    }
    setVisible(false)
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && shown.value) {
    e.stopPropagation()
    setVisible(false)
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v !== undefined) inner.value = v
  }
)

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
  <span ref="rootRef" class="dmk-popover" :class="`is-${placement}`">
    <span
      class="dmk-popover__reference"
      tabindex="0"
      role="button"
      :aria-expanded="shown"
      :aria-label="ariaLabel"
      @click="trigger === 'click' && setVisible(!shown)"
      @mouseenter="trigger === 'hover' && setVisible(true)"
      @mouseleave="trigger === 'hover' && setVisible(false)"
      @focus="trigger === 'focus' && setVisible(true)"
      @blur="trigger === 'focus' && setVisible(false)"
    >
      <slot name="reference" />
    </span>

    <Transition name="pop">
      <div
        v-if="shown"
        ref="panelRef"
        class="dmk-popover__panel"
        role="dialog"
        tabindex="-1"
        :aria-label="ariaLabel ?? title"
        :style="{ width }"
      >
        <span v-if="arrow" class="dmk-popover__arrow" aria-hidden="true" />
        <div v-if="title || $slots.title" class="dmk-popover__title">
          <slot name="title">{{ title }}</slot>
        </div>
        <div class="dmk-popover__content">
          <slot>{{ content }}</slot>
        </div>
        <div v-if="$slots.footer" class="dmk-popover__footer">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </span>
</template>

<style scoped>
.dmk-popover {
  position: relative;
  display: inline-block;
  font-family: var(--dmk-font-family);
}

.dmk-popover__reference {
  display: inline-flex;
  outline: none;
  cursor: pointer;
}

.dmk-popover__reference:focus-visible {
  box-shadow: var(--dmk-shadow-focus);
  border-radius: var(--dmk-radius-sm);
}

.dmk-popover__panel {
  position: absolute;
  z-index: var(--dmk-z-popup);
  padding: 10px 12px;
  color: var(--dmk-color-text);
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  box-shadow: var(--dmk-shadow-md);
  outline: none;
}

.dmk-popover.is-bottom .dmk-popover__panel { top: calc(100% + 8px); left: 0; }
.dmk-popover.is-top .dmk-popover__panel { bottom: calc(100% + 8px); left: 0; }
.dmk-popover.is-left .dmk-popover__panel { right: calc(100% + 8px); top: 50%; transform: translateY(-50%); }
.dmk-popover.is-right .dmk-popover__panel { left: calc(100% + 8px); top: 50%; transform: translateY(-50%); }

.dmk-popover__arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  transform: rotate(45deg);
}

.dmk-popover.is-bottom .dmk-popover__arrow { top: -5px; left: 12px; border-right: none; border-bottom: none; }
.dmk-popover.is-top .dmk-popover__arrow { bottom: -5px; left: 12px; border-left: none; border-top: none; }
.dmk-popover.is-left .dmk-popover__arrow { right: -5px; top: 50%; margin-top: -4px; border-left: none; border-bottom: none; }
.dmk-popover.is-right .dmk-popover__arrow { left: -5px; top: 50%; margin-top: -4px; border-right: none; border-top: none; }

.dmk-popover__title {
  margin-bottom: 4px;
  font-size: var(--dmk-font-sm);
  font-weight: 600;
}

.dmk-popover__content {
  font-size: var(--dmk-font-sm);
  line-height: 1.7;
  color: var(--dmk-color-text-secondary);
  word-break: break-word;
}

.dmk-popover__footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--dmk-color-border-subtle);
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
