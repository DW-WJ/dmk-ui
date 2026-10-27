<script setup lang="ts">
/**
 * DDropdown —— 下拉菜单。
 * 设计要点：触发器 + 浮层面板；click / hover 两种触发；分组分隔线、禁用项；
 * Esc 关闭、点击外部关闭、关闭后焦点归还触发器。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

export interface DropdownItem {
  /** 菜单项文字（分组标题项可省略，只给 group） */
  label?: string
  value?: string | number
  disabled?: boolean
  /** 前置分隔线（分组标题用） */
  divided?: boolean
  /** 分组标题（只显示不可点） */
  group?: string
}

const props = withDefaults(
  defineProps<{
    items?: DropdownItem[]
    trigger?: 'click' | 'hover'
    placement?: 'bottom' | 'top' | 'left' | 'right'
    disabled?: boolean
    /** 面板宽度 */
    width?: string
    ariaLabel?: string
  }>(),
  {
    items: () => [],
    trigger: 'click',
    placement: 'bottom',
    disabled: false,
    width: '160px',
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  command: [value: string | number]
  select: [item: DropdownItem]
  'visible-change': [visible: boolean]
  open: []
  close: []
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

const visibleItems = computed(() => props.items.filter((i) => !i.group))

function toggle() {
  if (props.disabled) return
  open.value ? close() : show()
}

function show() {
  if (props.disabled || open.value) return
  open.value = true
  emit('open')
  emit('visible-change', true)
  nextTick(() => {
    panelRef.value?.querySelector<HTMLElement>('.dmk-dropdown__item:not(.is-disabled)')?.focus()
  })
}

function close() {
  if (!open.value) return
  open.value = false
  emit('close')
  emit('visible-change', false)
  nextTick(() => triggerRef.value?.focus())
}

function onSelect(item: DropdownItem) {
  if (item.disabled || item.group) return
  emit('command', item.value ?? item.label ?? '')
  emit('select', item)
  close()
}

function onDocPointerDown(e: MouseEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(e.target as Node)) close()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    e.stopPropagation()
    close()
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
  <div ref="rootRef" class="dmk-dropdown" :class="`is-${placement}`">
    <button
      ref="triggerRef"
      type="button"
      class="dmk-dropdown__trigger"
      :disabled="disabled"
      :aria-haspopup="'menu'"
      :aria-expanded="open"
      :aria-label="ariaLabel"
      @click="trigger === 'click' && toggle()"
      @mouseenter="trigger === 'hover' && show()"
      @mouseleave="trigger === 'hover' && close()"
    >
      <slot name="default" :open="open">
        <span>{{ visibleItems[0]?.label ?? '菜单' }}</span>
      </slot>
      <svg class="dmk-dropdown__caret" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <Transition name="pop">
      <div
        v-if="open"
        ref="panelRef"
        class="dmk-dropdown__panel"
        role="menu"
        :aria-label="ariaLabel"
        :style="{ width }"
        @mouseenter="trigger === 'hover' && (open = true)"
        @mouseleave="trigger === 'hover' && close()"
      >
        <slot name="dropdown" :close="close">
          <template v-for="(item, i) in items" :key="i">
            <div v-if="item.divided" class="dmk-dropdown__divided" role="separator" />
            <div v-if="item.group" class="dmk-dropdown__group">{{ item.group }}</div>
            <button
              v-else
              type="button"
              class="dmk-dropdown__item"
              :class="{ 'is-disabled': item.disabled }"
              role="menuitem"
              :disabled="item.disabled"
              @click="onSelect(item)"
            >
              <slot name="item" :item="item">{{ item.label }}</slot>
            </button>
          </template>
        </slot>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dmk-dropdown {
  position: relative;
  display: inline-block;
  font-family: var(--dmk-font-family);
}

.dmk-dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 10px;
  font-family: inherit;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text);
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  cursor: pointer;
}

.dmk-dropdown__trigger:hover:not(:disabled) {
  border-color: var(--dmk-color-primary);
}

.dmk-dropdown__trigger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dmk-dropdown__trigger:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-dropdown__caret {
  width: 11px;
  height: 11px;
  opacity: 0.7;
}

.dmk-dropdown__panel {
  position: absolute;
  z-index: var(--dmk-z-popup);
  padding: 4px;
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  box-shadow: var(--dmk-shadow-md);
}

.dmk-dropdown.is-bottom .dmk-dropdown__panel { top: calc(100% + 4px); left: 0; }
.dmk-dropdown.is-top .dmk-dropdown__panel { bottom: calc(100% + 4px); left: 0; }
.dmk-dropdown.is-left .dmk-dropdown__panel { right: calc(100% + 4px); top: 0; }
.dmk-dropdown.is-right .dmk-dropdown__panel { left: calc(100% + 4px); top: 0; }

.dmk-dropdown__item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  font-family: inherit;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text);
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--dmk-radius-sm);
  cursor: pointer;
  white-space: nowrap;
}

.dmk-dropdown__item:hover:not(.is-disabled) {
  color: var(--dmk-color-primary);
  background: var(--dmk-color-primary-subtle);
}

.dmk-dropdown__item.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dmk-dropdown__item:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-dropdown__divided {
  height: 1px;
  margin: 4px 0;
  background: var(--dmk-color-border-subtle);
}

.dmk-dropdown__group {
  padding: 5px 10px 2px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-faint);
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
