<script setup lang="ts">
/**
 * DPagination —— 分页器。
 * 设计要点：上一页/下一页 + 页码，省略号算法左右各留 1 页、中间 pagerCount-4 页（pagerCount 强制奇数）；
 * 当前页 aria-current="page"，页码越界自动钳制；showTotal 显示「共 N 条」；
 * prev/next 越界或 disabled 时禁用，键盘可达（原生 button）。
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    total: number
    pageSize?: number
    modelValue?: number
    pagerCount?: number
    disabled?: boolean
    showTotal?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    pageSize: 10,
    modelValue: 1,
    pagerCount: 7,
    disabled: false,
    showTotal: true,
    size: 'md'
  }
)

const emit = defineEmits<{
  'update:modelValue': [page: number]
  change: [page: number]
}>()

/** pagerCount 归一为 >=5 的奇数 */
const normalizedPagerCount = computed(() => {
  const n = Math.floor(props.pagerCount)
  const odd = n % 2 === 0 ? n + 1 : n
  return Math.max(5, odd)
})

const pageCount = computed(() =>
  Math.max(1, Math.ceil((props.total || 0) / Math.max(1, props.pageSize)))
)

/** 越界自动钳制 */
const current = computed(() =>
  Math.min(Math.max(1, Math.floor(props.modelValue || 1)), pageCount.value)
)

type PageItem = number | 'ellipsis'

const items = computed<PageItem[]>(() => {
  const count = pageCount.value
  const cur = current.value
  const pagerCount = normalizedPagerCount.value
  if (count <= pagerCount) {
    return Array.from({ length: count }, (_, i) => i + 1)
  }
  const middle = pagerCount - 4 // 中间页码个数（去掉首尾 2 个 + 省略号 2 个）
  const half = Math.floor((middle - 1) / 2)
  let start = cur - half
  let end = start + middle - 1
  const minStart = 2
  const maxEnd = count - 1
  if (start < minStart) {
    start = minStart
    end = start + middle - 1
  }
  if (end > maxEnd) {
    end = maxEnd
    start = end - middle + 1
  }
  const res: PageItem[] = [1]
  if (start > 2) res.push('ellipsis')
  for (let i = start; i <= end; i += 1) res.push(i)
  if (end < count - 1) res.push('ellipsis')
  res.push(count)
  return res
})

function goTo(page: number) {
  if (props.disabled) return
  const target = Math.min(Math.max(1, Math.floor(page)), pageCount.value)
  if (target === current.value) return
  emit('update:modelValue', target)
  emit('change', target)
}
</script>

<template>
  <nav class="dmk-pagination" :class="[`s-${size}`, { 'is-disabled': disabled }]" aria-label="分页">
    <span v-if="showTotal" class="dmk-pagination__total">共 {{ total }} 条</span>

    <button
      type="button"
      class="dmk-pagination__item dmk-pagination__prev"
      :disabled="disabled || current <= 1"
      aria-label="上一页"
      @click="goTo(current - 1)"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path
          d="M7.5 2.5L4 6l3.5 3.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <template v-for="(item, i) in items" :key="i">
      <span v-if="item === 'ellipsis'" class="dmk-pagination__item dmk-pagination__ellipsis" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="dmk-pagination__item dmk-pagination__page"
        :class="{ 'is-active': item === current }"
        :aria-current="item === current ? 'page' : undefined"
        :aria-label="`第 ${item} 页`"
        :disabled="disabled"
        @click="goTo(item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      type="button"
      class="dmk-pagination__item dmk-pagination__next"
      :disabled="disabled || current >= pageCount"
      aria-label="下一页"
      @click="goTo(current + 1)"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path
          d="M4.5 2.5L8 6l-3.5 3.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </nav>
</template>

<style scoped>
.dmk-pagination {
  display: inline-flex;
  align-items: center;
  gap: var(--dmk-space-xs);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  color: var(--dmk-color-text);
}

.dmk-pagination__total {
  margin-right: var(--dmk-space-sm);
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-sm);
  white-space: nowrap;
}

.dmk-pagination__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--dmk-control-height-sm);
  height: var(--dmk-control-height-sm);
  padding: 0 var(--dmk-space-xs);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-base);
  font-family: var(--dmk-font-family);
  cursor: pointer;
  transition:
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    color var(--dmk-duration-fast) var(--dmk-ease),
    background-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-pagination__item:hover:not(:disabled) {
  border-color: var(--dmk-color-border-focus);
  color: var(--dmk-color-primary);
}

.dmk-pagination__item:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-pagination__item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dmk-pagination__page.is-active {
  background: var(--dmk-color-primary);
  border-color: transparent;
  color: var(--dmk-color-on-primary);
  font-weight: 600;
}

.dmk-pagination__page.is-active:hover:not(:disabled) {
  background: var(--dmk-color-primary-hover);
  color: var(--dmk-color-on-primary);
}

.dmk-pagination__ellipsis {
  border-color: transparent;
  background: transparent;
  cursor: default;
  color: var(--dmk-color-text-muted);
}

.dmk-pagination.is-disabled .dmk-pagination__total {
  opacity: 0.55;
}

/* 尺寸 */
.dmk-pagination.s-sm .dmk-pagination__item {
  min-width: var(--dmk-control-height-sm);
  height: var(--dmk-control-height-sm);
  font-size: var(--dmk-font-sm);
}

.dmk-pagination.s-md .dmk-pagination__item {
  min-width: var(--dmk-control-height);
  height: var(--dmk-control-height);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-pagination__item {
    transition: none;
  }
}
</style>
