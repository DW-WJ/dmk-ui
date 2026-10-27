<script setup lang="ts">
/**
 * DDrawer —— 抽屉浮层。
 * 设计要点：Teleport 到 body；遮罩淡入 + 面板按 placement 滑入（单 Transition，面板 transform 由派生类驱动）；
 * 打开时锁 body 滚动（保存/恢复 overflow），Esc / 遮罩点击可关闭；
 * role="dialog" + aria-modal="true"，z-index 用 --dmk-z-modal；
 * 事件：update:modelValue / close / closed / open / opened。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type Placement = 'right' | 'left' | 'top' | 'bottom'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    placement?: Placement
    size?: string | number
    closable?: boolean
    mask?: boolean
    closeOnMaskClick?: boolean
    closeOnEsc?: boolean
  }>(),
  {
    title: undefined,
    placement: 'right',
    size: '360',
    closable: true,
    mask: true,
    closeOnMaskClick: true,
    closeOnEsc: true
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  closed: []
  open: []
  opened: []
}>()

/* 实例唯一标题 id（script setup 顶层变量按实例隔离，用随机串保证全局唯一） */
const titleId = `dmk-drawer-title-${Math.random().toString(36).slice(2, 8)}`

const panelRef = ref<HTMLElement | null>(null)
const hasTitle = computed(() => props.title !== undefined)

const panelStyle = computed(() => {
  const s = typeof props.size === 'number' ? `${props.size}px` : String(props.size)
  return props.placement === 'left' || props.placement === 'right'
    ? { width: s, maxWidth: '100%' }
    : { height: s, maxHeight: '100%' }
})

function requestClose() {
  if (props.modelValue) emit('update:modelValue', false)
}

function onMaskClick() {
  if (props.closeOnMaskClick) requestClose()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closeOnEsc && props.modelValue) {
    e.preventDefault()
    requestClose()
  }
}

function onAfterEnter() {
  emit('opened')
  panelRef.value?.focus()
}

function onAfterLeave() {
  emit('closed')
}

/* body 滚动锁定：保存/恢复 overflow */
let savedOverflow = ''
watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      savedOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown, true)
      emit('open')
    } else {
      document.body.style.overflow = savedOverflow
      document.removeEventListener('keydown', onKeydown, true)
      emit('close')
    }
  }
)

onMounted(() => {
  // 初始即打开：只补锁滚动与 Esc 监听（无打开过渡，不补发 open/opened）
  if (props.modelValue) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown, true)
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = savedOverflow
  document.removeEventListener('keydown', onKeydown, true)
})
</script>

<template>
  <teleport to="body">
    <transition
      name="dmk-drawer"
      @after-enter="onAfterEnter"
      @after-leave="onAfterLeave"
    >
      <div v-if="modelValue" class="dmk-drawer" :class="`p-${placement}`">
        <div v-if="mask" class="dmk-drawer__mask" @click="onMaskClick" />
        <div
          ref="panelRef"
          class="dmk-drawer__panel"
          :style="panelStyle"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="hasTitle ? titleId : undefined"
          :aria-label="hasTitle ? undefined : '抽屉'"
          tabindex="-1"
        >
          <div v-if="closable || hasTitle || $slots.title" class="dmk-drawer__header">
            <div :id="titleId" class="dmk-drawer__title">
              <slot name="title">{{ title }}</slot>
            </div>
            <button
              v-if="closable"
              type="button"
              class="dmk-drawer__close"
              aria-label="关闭"
              @click="requestClose"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path
                  d="M3 3l8 8M11 3l-8 8"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
          <div class="dmk-drawer__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="dmk-drawer__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.dmk-drawer {
  position: fixed;
  inset: 0;
  z-index: var(--dmk-z-modal);
}

.dmk-drawer__mask {
  position: absolute;
  inset: 0;
  background: var(--dmk-color-mask);
}

.dmk-drawer__panel {
  position: absolute;
  display: flex;
  flex-direction: column;
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
  outline: none;
}

.dmk-drawer.p-right .dmk-drawer__panel {
  top: 0;
  right: 0;
  height: 100%;
  border-radius: var(--dmk-radius-lg) 0 0 var(--dmk-radius-lg);
}

.dmk-drawer.p-left .dmk-drawer__panel {
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 0 var(--dmk-radius-lg) var(--dmk-radius-lg) 0;
}

.dmk-drawer.p-top .dmk-drawer__panel {
  top: 0;
  left: 0;
  width: 100%;
  border-radius: 0 0 var(--dmk-radius-lg) var(--dmk-radius-lg);
}

.dmk-drawer.p-bottom .dmk-drawer__panel {
  bottom: 0;
  left: 0;
  width: 100%;
  border-radius: var(--dmk-radius-lg) var(--dmk-radius-lg) 0 0;
}

.dmk-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--dmk-space-md);
  padding: var(--dmk-space-lg) var(--dmk-space-xl);
  border-bottom: 1px solid var(--dmk-color-border-subtle);
}

.dmk-drawer__title {
  font-size: var(--dmk-font-md);
  font-weight: 600;
  color: var(--dmk-color-text);
  font-family: var(--dmk-font-family);
}

.dmk-drawer__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--dmk-space-xs);
  border: none;
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: var(--dmk-color-text-muted);
  cursor: pointer;
  transition:
    color var(--dmk-duration-fast) var(--dmk-ease),
    background-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-drawer__close:hover {
  color: var(--dmk-color-text);
  background: var(--dmk-color-surface-hover);
}

.dmk-drawer__close:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-drawer__body {
  flex: 1;
  padding: var(--dmk-space-xl);
  overflow-y: auto;
  color: var(--dmk-color-text);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  line-height: 1.6;
}

.dmk-drawer__footer {
  padding: var(--dmk-space-lg) var(--dmk-space-xl);
  border-top: 1px solid var(--dmk-color-border-subtle);
}

/* ---- 过渡：遮罩淡入，面板按 placement 滑入 ---- */
.dmk-drawer-enter-active,
.dmk-drawer-leave-active {
  transition: opacity var(--dmk-duration-slow) var(--dmk-ease);
}

.dmk-drawer-enter-from,
.dmk-drawer-leave-to {
  opacity: 0;
}

.dmk-drawer-enter-active .dmk-drawer__panel,
.dmk-drawer-leave-active .dmk-drawer__panel {
  transition: transform var(--dmk-duration-slow) var(--dmk-ease);
}

.dmk-drawer-enter-from.p-right .dmk-drawer__panel,
.dmk-drawer-leave-to.p-right .dmk-drawer__panel {
  transform: translateX(100%);
}

.dmk-drawer-enter-from.p-left .dmk-drawer__panel,
.dmk-drawer-leave-to.p-left .dmk-drawer__panel {
  transform: translateX(-100%);
}

.dmk-drawer-enter-from.p-top .dmk-drawer__panel,
.dmk-drawer-leave-to.p-top .dmk-drawer__panel {
  transform: translateY(-100%);
}

.dmk-drawer-enter-from.p-bottom .dmk-drawer__panel,
.dmk-drawer-leave-to.p-bottom .dmk-drawer__panel {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-drawer-enter-active,
  .dmk-drawer-leave-active,
  .dmk-drawer-enter-active .dmk-drawer__panel,
  .dmk-drawer-leave-active .dmk-drawer__panel {
    transition: none;
  }
}
</style>
