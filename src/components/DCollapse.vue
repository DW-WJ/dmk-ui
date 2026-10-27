<script setup lang="ts">
/**
 * DCollapse —— 折叠面板。
 * 设计要点：items 数组驱动（不拆子组件，逻辑自洽、可测）；
 * 每项是原生 button + aria-expanded/aria-controls，键盘 ↑↓ Home/End 可在项间移动；
 * 图标用 SVG 箭头/加号（不用 Unicode 字符 —— 字符渲染只有几像素，是站内踩过的坑）。
 */
import { computed, ref } from 'vue'

export interface CollapseItem {
  /** 唯一标识（用于 v-model） */
  name: string | number
  /** 标题文字 */
  title: string
  /** 折叠区内容（简单文本；复杂内容走默认插槽的 content 插槽） */
  content?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    /** 展开项：数组（多开）或单值（手风琴） */
    modelValue?: Array<string | number> | string | number
    items?: CollapseItem[]
    /** 手风琴模式：同时只开一项 */
    accordion?: boolean
    disabled?: boolean
    /** 折叠图标形态 */
    icon?: 'arrow' | 'plus'
  }>(),
  {
    modelValue: () => [],
    items: () => [],
    accordion: false,
    disabled: false,
    icon: 'arrow'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: Array<string | number> | string | number]
  change: [value: Array<string | number> | string | number]
}>()

const rootRef = ref<HTMLElement | null>(null)

const active = computed<Array<string | number>>(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue
  return props.modelValue === '' ? [] : [props.modelValue]
})

function isOpen(name: string | number) {
  return active.value.includes(name)
}

function toggle(item: CollapseItem) {
  if (props.disabled || item.disabled) return
  let next: Array<string | number> | string | number
  if (props.accordion) {
    next = isOpen(item.name) ? '' : item.name
  } else {
    const arr = [...active.value]
    const i = arr.indexOf(item.name)
    if (i >= 0) arr.splice(i, 1)
    else arr.push(item.name)
    next = arr
  }
  emit('update:modelValue', next)
  emit('change', next)
}

function onKey(e: KeyboardEvent, idx: number) {
  const items = props.items
  if (!items.length) return
  let target = -1
  if (e.key === 'ArrowDown') target = (idx + 1) % items.length
  else if (e.key === 'ArrowUp') target = (idx - 1 + items.length) % items.length
  else if (e.key === 'Home') target = 0
  else if (e.key === 'End') target = items.length - 1
  if (target < 0) return
  e.preventDefault()
  const btns = rootRef.value?.querySelectorAll<HTMLButtonElement>('.dmk-collapse__header')
  btns?.[target]?.focus()
}

/* ---------- exposes ---------- */
function open(name: string | number) {
  if (isOpen(name)) return
  const next = props.accordion ? name : [...active.value, name]
  emit('update:modelValue', next)
  emit('change', next)
}
function close(name: string | number) {
  if (!isOpen(name)) return
  const next = Array.isArray(props.modelValue)
    ? props.modelValue.filter((n) => n !== name)
    : ''
  emit('update:modelValue', next)
  emit('change', next)
}
function focus() {
  rootRef.value?.querySelector<HTMLButtonElement>('.dmk-collapse__header')?.focus()
}

defineExpose({ open, close, focus })
</script>

<template>
  <div ref="rootRef" class="dmk-collapse" :class="{ 'is-disabled': disabled }">
    <div v-for="(item, idx) in items" :key="item.name" class="dmk-collapse__item">
      <button
        type="button"
        class="dmk-collapse__header"
        :class="{ 'is-open': isOpen(item.name) }"
        :disabled="disabled || item.disabled"
        :aria-expanded="isOpen(item.name)"
        :aria-controls="`dmk-collapse-panel-${item.name}`"
        @click="toggle(item)"
        @keydown="onKey($event, idx)"
      >
        <span class="dmk-collapse__title">
          <slot name="title" :item="item">{{ item.title }}</slot>
        </span>
        <svg
          class="dmk-collapse__icon"
          :class="{ 'is-open': isOpen(item.name), 'is-plus': icon === 'plus' }"
          viewBox="0 0 12 12"
          aria-hidden="true"
          focusable="false"
        >
          <path
            v-if="icon === 'arrow'"
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            v-else
            d="M6 2.5v7M2.5 6h7"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
      <div
        v-show="isOpen(item.name)"
        :id="`dmk-collapse-panel-${item.name}`"
        class="dmk-collapse__content"
        role="region"
      >
        <slot name="content" :item="item">{{ item.content }}</slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dmk-collapse {
  border-top: 1px solid var(--dmk-color-border-subtle);
  border-bottom: 1px solid var(--dmk-color-border-subtle);
  font-family: var(--dmk-font-family);
}

.dmk-collapse.is-disabled {
  opacity: 0.6;
}

.dmk-collapse__item + .dmk-collapse__item {
  border-top: 1px solid var(--dmk-color-border-subtle);
}

.dmk-collapse__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 40px;
  padding: 8px 2px;
  font-family: inherit;
  font-size: var(--dmk-font-base);
  color: var(--dmk-color-text);
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-collapse__header:hover:not(:disabled) {
  color: var(--dmk-color-primary);
}

.dmk-collapse__header:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dmk-collapse__header:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
  border-radius: var(--dmk-radius-sm);
}

.dmk-collapse__title {
  flex: 1;
  min-width: 0;
  font-weight: 500;
}

.dmk-collapse__icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  color: var(--dmk-color-text-muted);
  transition: transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-collapse__icon.is-open {
  transform: rotate(180deg);
}

.dmk-collapse__icon.is-plus.is-open {
  transform: rotate(45deg);
}

.dmk-collapse__content {
  padding: 2px 2px 14px;
  font-size: var(--dmk-font-sm);
  line-height: 1.7;
  color: var(--dmk-color-text-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-collapse__icon,
  .dmk-collapse__header {
    transition: none;
  }
}
</style>
