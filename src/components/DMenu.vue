<script setup lang="ts">
/**
 * DMenu —— 菜单。
 * 设计要点：items 驱动，支持分组标题、禁用项、图标；纵向/横向两种模式；
 * 点击项触发 select；键盘 ↑↓ 在项间移动。
 */
import { ref } from 'vue'

export interface MenuItem {
  /** 菜单项文字（分组标题项可省略，只给 group） */
  label?: string
  value?: string | number
  icon?: string
  disabled?: boolean
  /** 分组标题 */
  group?: string
  /** 前置分隔线 */
  divided?: boolean
}

const props = withDefaults(
  defineProps<{
    items?: MenuItem[]
    mode?: 'vertical' | 'horizontal'
    /** 选中的值 */
    active?: string | number
    ariaLabel?: string
  }>(),
  {
    items: () => [],
    mode: 'vertical',
    active: undefined,
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  select: [item: MenuItem]
  'update:active': [value: string | number]
}>()

const rootRef = ref<HTMLElement | null>(null)

function onSelect(item: MenuItem) {
  if (item.disabled || item.group) return
  emit('select', item)
  emit('update:active', item.value ?? item.label ?? '')
}

function onKey(e: KeyboardEvent, idx: number) {
  const list = props.items.filter((i) => !i.group)
  if (!list.length) return
  const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(e.key)) return
  e.preventDefault()
  let target = 0
  if (e.key === 'ArrowDown') target = (idx + 1) % list.length
  else if (e.key === 'ArrowUp') target = (idx - 1 + list.length) % list.length
  else if (e.key === 'End') target = list.length - 1
  // 只在本菜单内移动焦点（用全局选择器会导致多个菜单互相抢焦点）
  const el = rootRef.value?.querySelectorAll<HTMLElement>('.dmk-menu__item')
  el?.[target]?.focus()
}
</script>

<template>
  <ul ref="rootRef" class="dmk-menu" :class="`is-${mode}`" role="menu" :aria-label="ariaLabel">
    <template v-for="(item, i) in items" :key="i">
      <li v-if="item.divided" class="dmk-menu__divided" role="separator" />
      <li v-if="item.group" class="dmk-menu__group">{{ item.group }}</li>
      <li
        v-else
        class="dmk-menu__item"
        :class="{
          'is-active': active !== undefined && active === (item.value ?? item.label),
          'is-disabled': item.disabled
        }"
        role="menuitem"
        :tabindex="item.disabled ? -1 : 0"
        :aria-disabled="item.disabled"
        @click="onSelect(item)"
        @keydown="onKey($event, i)"
      >
        <span v-if="item.icon" class="dmk-menu__icon" aria-hidden="true">{{ item.icon }}</span>
        <span class="dmk-menu__label">
          <slot name="item" :item="item">{{ item.label }}</slot>
        </span>
      </li>
    </template>
  </ul>
</template>

<style scoped>
.dmk-menu {
  margin: 0;
  padding: 4px;
  list-style: none;
  min-width: 140px;
  font-family: var(--dmk-font-family);
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
}

.dmk-menu.is-horizontal {
  display: flex;
  align-items: center;
  gap: 2px;
  border: none;
  background: transparent;
  padding: 0;
}

.dmk-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text);
  border-radius: var(--dmk-radius-sm);
  cursor: pointer;
  user-select: none;
}

.dmk-menu.is-horizontal .dmk-menu__item {
  padding: 6px 10px;
}

.dmk-menu__item:hover:not(.is-disabled) {
  color: var(--dmk-color-primary);
  background: var(--dmk-color-primary-subtle);
}

.dmk-menu__item.is-active {
  color: var(--dmk-color-primary);
  background: var(--dmk-color-primary-subtle);
  font-weight: 500;
}

.dmk-menu__item.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dmk-menu__item:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-menu__icon {
  width: 16px;
  text-align: center;
  opacity: 0.8;
}

.dmk-menu__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dmk-menu__group {
  padding: 6px 12px 2px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-faint);
}

.dmk-menu__divided {
  height: 1px;
  margin: 4px 0;
  background: var(--dmk-color-border-subtle);
}
</style>
