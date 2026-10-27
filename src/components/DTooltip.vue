<script setup lang="ts">
/**
 * DTooltip —— 文字提示气泡。
 * 设计要点：默认插槽包裹触发元素，hover（进入延迟 delay）+ 键盘 focus 触发，Esc 关闭；
 * 气泡 role="tooltip" 并与触发元素 aria-describedby 关联；
 * 绝对定位按 placement 放置，translate 过渡入场/出场，留足偏移量避免被 overflow 裁掉。
 */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

type Placement = 'top' | 'bottom' | 'left' | 'right'

const props = withDefaults(
  defineProps<{
    content?: string
    placement?: Placement
    disabled?: boolean
    delay?: number
  }>(),
  {
    content: undefined,
    placement: 'top',
    disabled: false,
    delay: 80
  }
)

const popperId = `dmk-tooltip-${Math.random().toString(36).slice(2, 8)}`
const wrapperRef = ref<HTMLElement | null>(null)
const visible = ref(false)
let openTimer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (openTimer !== null) {
    clearTimeout(openTimer)
    openTimer = null
  }
}

function open() {
  if (props.disabled || !props.content || visible.value) return
  clearTimer()
  openTimer = setTimeout(() => {
    visible.value = true
    openTimer = null
  }, Math.max(0, props.delay))
}

function close() {
  clearTimer()
  visible.value = false
}

function openNow() {
  if (props.disabled || !props.content) return
  clearTimer()
  visible.value = true
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

/* 气泡显示时把 aria-describedby 挂到触发元素上 */
watch(visible, async (val) => {
  if (val) {
    window.addEventListener('keydown', onKeydown)
  } else {
    window.removeEventListener('keydown', onKeydown)
  }
  await nextTick()
  const trigger = wrapperRef.value?.firstElementChild as HTMLElement | null
  if (!trigger) return
  if (val) {
    trigger.setAttribute('aria-describedby', popperId)
  } else {
    trigger.removeAttribute('aria-describedby')
  }
})

onBeforeUnmount(() => {
  clearTimer()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    ref="wrapperRef"
    class="dmk-tooltip"
    @mouseenter="open"
    @mouseleave="close"
    @focusin="openNow"
    @focusout="close"
  >
    <slot />
    <transition name="dmk-tooltip">
      <div
        v-if="visible && content"
        :id="popperId"
        class="dmk-tooltip__popper"
        :class="`dmk-tooltip__popper--${placement}`"
        role="tooltip"
      >
        {{ content }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dmk-tooltip {
  position: relative;
  display: inline-flex;
  font-family: var(--dmk-font-family);
}

.dmk-tooltip__popper {
  position: absolute;
  z-index: var(--dmk-z-popup);
  max-width: 240px;
  padding: var(--dmk-space-xs) var(--dmk-space-sm);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-text);
  color: var(--dmk-color-text-inverse);
  box-shadow: var(--dmk-shadow-md);
  font-size: var(--dmk-font-sm);
  line-height: 1.6;
  word-break: break-word;
  pointer-events: none;
  transition:
    opacity var(--dmk-duration-fast) var(--dmk-ease),
    transform var(--dmk-duration-fast) var(--dmk-ease);
}

/* 四向定位：10px 间隙 + 8px translate 余量，避免被 overflow 裁掉 */
.dmk-tooltip__popper--top {
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translate(-50%, -8px);
}

.dmk-tooltip__popper--bottom {
  left: 50%;
  top: calc(100% + 10px);
  transform: translate(-50%, 8px);
}

.dmk-tooltip__popper--left {
  right: calc(100% + 10px);
  top: 50%;
  transform: translate(-8px, -50%);
}

.dmk-tooltip__popper--right {
  left: calc(100% + 10px);
  top: 50%;
  transform: translate(8px, -50%);
}

/* 入场/出场：从触发元素一侧滑入 */
.dmk-tooltip__popper--top.dmk-tooltip-enter-from,
.dmk-tooltip__popper--top.dmk-tooltip-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

.dmk-tooltip__popper--bottom.dmk-tooltip-enter-from,
.dmk-tooltip__popper--bottom.dmk-tooltip-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

.dmk-tooltip__popper--left.dmk-tooltip-enter-from,
.dmk-tooltip__popper--left.dmk-tooltip-leave-to {
  opacity: 0;
  transform: translate(8px, -50%);
}

.dmk-tooltip__popper--right.dmk-tooltip-enter-from,
.dmk-tooltip__popper--right.dmk-tooltip-leave-to {
  opacity: 0;
  transform: translate(-8px, -50%);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-tooltip__popper {
    transition: opacity var(--dmk-duration-fast) var(--dmk-ease);
  }

  .dmk-tooltip__popper--top,
  .dmk-tooltip__popper--top.dmk-tooltip-enter-from,
  .dmk-tooltip__popper--top.dmk-tooltip-leave-to {
    transform: translate(-50%, -8px);
  }

  .dmk-tooltip__popper--bottom,
  .dmk-tooltip__popper--bottom.dmk-tooltip-enter-from,
  .dmk-tooltip__popper--bottom.dmk-tooltip-leave-to {
    transform: translate(-50%, 8px);
  }

  .dmk-tooltip__popper--left,
  .dmk-tooltip__popper--left.dmk-tooltip-enter-from,
  .dmk-tooltip__popper--left.dmk-tooltip-leave-to {
    transform: translate(-8px, -50%);
  }

  .dmk-tooltip__popper--right,
  .dmk-tooltip__popper--right.dmk-tooltip-enter-from,
  .dmk-tooltip__popper--right.dmk-tooltip-leave-to {
    transform: translate(8px, -50%);
  }
}
</style>
