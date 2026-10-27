<script setup lang="ts">
/**
 * DDescriptions —— 描述列表。
 * 设计要点：items 驱动（label/value 列表），支持多列布局、边框线、label 宽度；
 * label / content 插槽可定制单格渲染。
 */
import { computed } from 'vue'

export interface DescriptionItem {
  label: string
  value?: string | number
  /** 跨列数 */
  span?: number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    items?: DescriptionItem[]
    /** 每行列数 */
    column?: 1 | 2 | 3 | 4
    /** 显示边框线 */
    border?: boolean
    direction?: 'horizontal' | 'vertical'
    size?: 'default' | 'small' | 'large'
    /** label 宽度（仅横向） */
    labelWidth?: string
    title?: string
    ariaLabel?: string
  }>(),
  {
    items: () => [],
    column: 3,
    border: false,
    direction: 'horizontal',
    size: 'default',
    labelWidth: undefined,
    title: undefined,
    ariaLabel: undefined
  }
)

/** 按 column 切列：span 支持跨列（占满剩余列） */
const rows = computed<Array<Array<{ item: DescriptionItem; span: number }>>>(() => {
  const out: Array<Array<{ item: DescriptionItem; span: number }>> = []
  let row: Array<{ item: DescriptionItem; span: number }> = []
  let used = 0
  for (const item of props.items) {
    const span = Math.min(item.span ?? 1, props.column)
    if (used + span > props.column) {
      out.push(row)
      row = []
      used = 0
    }
    row.push({ item, span })
    used += span
    if (used >= props.column) {
      out.push(row)
      row = []
      used = 0
    }
  }
  if (row.length) out.push(row)
  return out
})
</script>

<template>
  <div class="dmk-descriptions" :class="[`s-${size}`, `is-${direction}`]">
    <div v-if="title" class="dmk-descriptions__title">{{ title }}</div>
    <div
      v-for="(row, ri) in rows"
      :key="ri"
      class="dmk-descriptions__row"
      :style="{ gridTemplateColumns: `repeat(${column}, 1fr)` }"
    >
      <template v-for="cell in row" :key="cell.item.label">
        <div
          class="dmk-descriptions__cell"
          :class="{ 'is-border': border, 'is-disabled': cell.item.disabled }"
          :style="{ gridColumn: `span ${cell.span}` }"
        >
          <div class="dmk-descriptions__label" :style="labelWidth ? { width: labelWidth } : undefined">
            <slot name="label" :item="cell.item">{{ cell.item.label }}</slot>
          </div>
          <div class="dmk-descriptions__content">
            <slot name="content" :item="cell.item">{{ cell.item.value ?? '—' }}</slot>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dmk-descriptions {
  font-family: var(--dmk-font-family);
  color: var(--dmk-color-text);
}

.dmk-descriptions__title {
  margin-bottom: 12px;
  font-size: var(--dmk-font-md);
  font-weight: 600;
}

.dmk-descriptions__row {
  display: grid;
  gap: 0;
}

.dmk-descriptions__cell {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
}

.dmk-descriptions__cell.is-border {
  border-bottom: 1px solid var(--dmk-color-border-subtle);
  padding: 10px 12px;
}

.dmk-descriptions__cell.is-disabled {
  opacity: 0.5;
}

.dmk-descriptions__label {
  flex-shrink: 0;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
}

.dmk-descriptions__content {
  flex: 1;
  min-width: 0;
  font-size: var(--dmk-font-sm);
  word-break: break-word;
}

.dmk-descriptions.is-vertical .dmk-descriptions__cell {
  flex-direction: column;
  gap: 4px;
}

.dmk-descriptions.s-small .dmk-descriptions__cell {
  padding: 6px 0;
}

.dmk-descriptions.s-large .dmk-descriptions__cell {
  padding: 14px 0;
}
</style>
