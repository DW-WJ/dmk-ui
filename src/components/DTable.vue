<script setup lang="ts">
/**
 * DTable —— 数据表格。
 * 设计要点：原生 <table> 语义（th scope="col"），列配置驱动渲染；
 * 支持 cell-<key> / header-<key> / empty 三种插槽，斑马纹与三档密度；
 * loading 时表体替换为骨架行并置 aria-busy，空数据回落 emptyText。
 */
import { computed } from 'vue'

type Align = 'left' | 'center' | 'right'
type Size = 'sm' | 'md' | 'lg'

interface DTableColumn {
  key: string
  title: string
  width?: string | number
  align?: Align
}

const props = withDefaults(
  defineProps<{
    data?: Record<string, unknown>[]
    columns?: DTableColumn[]
    rowKey?: string
    striped?: boolean
    size?: Size
    loading?: boolean
    emptyText?: string
  }>(),
  {
    data: () => [],
    columns: () => [],
    rowKey: 'id',
    striped: false,
    size: 'md',
    loading: false,
    emptyText: '暂无数据'
  }
)

/** 骨架行数：跟随数据量，兜底 5 行，最多 10 行 */
const skeletonRowCount = computed(() => Math.min(props.data.length || 5, 10))

const isEmpty = computed(() => !props.loading && props.data.length === 0)

function getRowKey(row: Record<string, unknown>, index: number): string | number {
  const key = row[props.rowKey]
  return typeof key === 'string' || typeof key === 'number' ? key : index
}

function cellStyle(column: DTableColumn) {
  if (column.width === undefined) return undefined
  return {
    width: typeof column.width === 'number' ? `${column.width}px` : column.width
  }
}
</script>

<template>
  <div class="dmk-table" :class="[`dmk-table--${size}`, { 'is-striped': striped }]">
    <table class="dmk-table__table" :aria-busy="loading ? 'true' : undefined">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            class="dmk-table__cell dmk-table__head-cell"
            :class="column.align ? `dmk-table__cell--${column.align}` : undefined"
            scope="col"
            :style="cellStyle(column)"
          >
            <slot :name="`header-${column.key}`" :column="column">{{ column.title }}</slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr v-for="i in skeletonRowCount" :key="`skeleton-${i}`" class="dmk-table__row dmk-table__row--skeleton" aria-hidden="true">
            <td v-for="column in columns" :key="column.key" class="dmk-table__cell" :style="cellStyle(column)">
              <span class="dmk-table__skeleton" />
            </td>
          </tr>
        </template>
        <template v-else-if="data.length > 0">
          <tr v-for="(row, index) in data" :key="getRowKey(row, index)" class="dmk-table__row">
            <td
              v-for="column in columns"
              :key="column.key"
              class="dmk-table__cell"
              :class="column.align ? `dmk-table__cell--${column.align}` : undefined"
              :style="cellStyle(column)"
            >
              <slot :name="`cell-${column.key}`" :row="row" :index="index" :column="column">{{ row[column.key] }}</slot>
            </td>
          </tr>
        </template>
        <tr v-else-if="isEmpty" class="dmk-table__row dmk-table__row--empty">
          <td class="dmk-table__cell dmk-table__empty" :colspan="columns.length || 1">
            <slot name="empty">{{ emptyText }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.dmk-table {
  width: 100%;
  overflow-x: auto;
  font-family: var(--dmk-font-family);
  color: var(--dmk-color-text);
}

.dmk-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--dmk-font-base);
}

.dmk-table__cell {
  padding: var(--dmk-space-sm) var(--dmk-space-md);
  border-bottom: 1px solid var(--dmk-color-border-subtle);
  text-align: left;
  vertical-align: middle;
  transition: background-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-table__cell--left {
  text-align: left;
}

.dmk-table__cell--center {
  text-align: center;
}

.dmk-table__cell--right {
  text-align: right;
}

.dmk-table__head-cell {
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-secondary);
  font-weight: 600;
  white-space: nowrap;
  border-bottom-color: var(--dmk-color-border);
}

.dmk-table__row:hover .dmk-table__cell {
  background: var(--dmk-color-surface-hover);
}

.dmk-table.is-striped .dmk-table__row:nth-child(even) .dmk-table__cell {
  background: var(--dmk-color-surface-hover);
}

.dmk-table.is-striped .dmk-table__row:nth-child(even):hover .dmk-table__cell {
  background: var(--dmk-color-surface-active);
}

.dmk-table__row--skeleton:hover .dmk-table__cell {
  background: transparent;
}

.dmk-table__skeleton {
  display: block;
  height: 14px;
  border-radius: var(--dmk-radius-sm);
  background: linear-gradient(
    90deg,
    var(--dmk-color-surface-hover) 25%,
    var(--dmk-color-surface-active) 37%,
    var(--dmk-color-surface-hover) 63%
  );
  background-size: 400% 100%;
  animation: dmk-table-shimmer 1.4s linear infinite;
}

@keyframes dmk-table-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.dmk-table__empty {
  padding: var(--dmk-space-xl) var(--dmk-space-md);
  text-align: center;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
}

/* 密度 */
.dmk-table--sm .dmk-table__cell {
  padding: var(--dmk-space-xs) var(--dmk-space-sm);
  font-size: var(--dmk-font-sm);
}

.dmk-table--lg .dmk-table__cell {
  padding: var(--dmk-space-md) var(--dmk-space-lg);
  font-size: var(--dmk-font-md);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-table__skeleton {
    animation: none;
    background: var(--dmk-color-surface-hover);
  }

  .dmk-table__cell {
    transition: none;
  }
}
</style>
