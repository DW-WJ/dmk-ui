<script setup lang="ts">
/**
 * DTableV2 —— 虚拟化表格（大数据量场景）。
 * 契约参考 Element Plus el-table-v2：
 *   data / columns / height / width / fixed / rowHeight / headerHeight /
 *   rowKey / sortBy / cellHeight
 *   columns: key / dataKey / title / width / fixed / sortable / align / className
 *   Events: sort-change / row-click / column-click / scroll
 *   Slots: default（单元格，作用域 { cellData, rowData, column, rowIndex }）/ empty / header / append
 *   Exposes: setScrollTop / setScrollLeft / clearSort
 *
 * 实现：**列**虚拟化（横向只渲染可视区的列，左右固定列始终渲染）；
 *      行不虚拟化 —— EP 的 table-v2 也是固定行高渲染全部行，
 *      真正的行虚拟化在 el-table 的普通用法里更常见。
 */
import { computed, ref, watch } from 'vue'

/** 列定义 */
export interface TableV2Column {
  /** 列唯一键 */
  key?: string
  /** 取值字段 */
  dataKey?: string
  /** 表头文本 */
  title?: string
  /** 列宽 */
  width?: number
  /** 固定方式 */
  fixed?: boolean | 'left' | 'right'
  /** 是否可排序 */
  sortable?: boolean
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 自定义类名 */
  className?: string
  /** 单元格渲染函数 */
  cellRenderer?: (data: { cellData: unknown; rowData: Record<string, unknown>; rowIndex: number }) => string
}

/** 归一化后的列（补齐默认值） */
type NormalizedColumn = TableV2Column & {
  key: string
  width: number
  fixed: boolean | 'left' | 'right'
  align: 'left' | 'center' | 'right'
}

const props = withDefaults(
  defineProps<{
    /** 行数据 */
    data?: Record<string, unknown>[]
    /** 列定义 */
    columns?: TableV2Column[]
    /** 表格高度 */
    height?: number
    /** 表格宽度（不传自适应） */
    width?: number
    /** 行高 */
    rowHeight?: number
    /** 表头高 */
    headerHeight?: number
    /** 行唯一键字段 */
    rowKey?: string
    /** 排序列 key */
    sortBy?: { prop: string; order: 'ascending' | 'descending' | null }
    /** 空数据文案 */
    emptyText?: string
  }>(),
  {
    data: () => [],
    columns: () => [],
    height: 400,
    width: undefined,
    rowHeight: 40,
    headerHeight: 44,
    rowKey: 'id',
    sortBy: undefined,
    emptyText: '暂无数据'
  }
)

const emit = defineEmits<{
  /** 排序变化 */
  'sort-change': [sort: { prop: string; order: 'ascending' | 'descending' | null }]
  /** 点击行 */
  'row-click': [row: Record<string, unknown>, index: number]
  /** 点击表头 */
  'column-click': [column: NormalizedColumn, index: number]
  /** 横向滚动 */
  scroll: [payload: { scrollLeft: number; scrollTop: number }]
}>()

/** 横向滚动偏移 */
const scrollLeft = ref(0)
/** 纵向滚动偏移 */
const scrollTop = ref(0)
/** 表格主体滚动容器 */
const bodyRef = ref<HTMLElement | null>(null)

/** 带默认值的列 */
const cols = computed<NormalizedColumn[]>(() =>
  props.columns.map((c, i) => ({
    ...c,
    key: c.key ?? c.dataKey ?? String(i),
    width: c.width ?? 120,
    fixed: c.fixed ?? false,
    align: c.align ?? 'left'
  }))
)

/** 固定在左侧的列 */
const leftCols = computed(() => cols.value.filter((c) => c.fixed === true || c.fixed === 'left'))

/** 固定在右侧的列 */
const rightCols = computed(() => cols.value.filter((c) => c.fixed === 'right'))

/** 中间（可滚动）列 */
const middleCols = computed(() => cols.value.filter((c) => !c.fixed))

/** 中间列总宽 */
const middleTotalWidth = computed(() =>
  middleCols.value.reduce((sum, c) => sum + c.width, 0)
)

/** 可视区宽度（用于列虚拟化计算） */
const viewportWidth = computed(() => props.width ?? 800)

/**
 * 中间列的虚拟区间。
 * 只渲染横向可视区内的列 —— 列数上千时 DOM 节点数保持在几十个量级。
 */
const middleRange = computed(() => {
  const total = middleCols.value.length
  if (!total) return { start: 0, end: 0, totalSize: 0 }
  // 定宽列无法用「单一 itemSize」直接算区间 → 按列宽累加求可见范围
  const widths = middleCols.value.map((c) => c.width)
  const totalSize = widths.reduce((s, w) => s + w, 0)
  const left = Math.max(0, scrollLeft.value)
  const right = Math.min(totalSize, left + viewportWidth.value)

  let acc = 0
  let start = total
  let end = 0
  for (let i = 0; i < total; i++) {
    const next = acc + widths[i]
    if (next > left && start === total) start = i
    if (acc < right) end = i + 1
    acc = next
  }
  if (start === total) start = Math.max(0, total - 1)
  if (end === 0) end = Math.min(total, start + 1)
  // 上下各多渲染 1 列，避免滚动露白
  start = Math.max(0, start - 1)
  end = Math.min(total, end + 1)
  return { start, end, totalSize }
})

/** 需要渲染的中间列 */
const visibleMiddleCols = computed(() => middleCols.value.slice(middleRange.value.start, middleRange.value.end))

/** 中间列的偏移（相对中间列区起点） */
const middleOffset = computed(() =>
  middleCols.value
    .slice(0, middleRange.value.start)
    .reduce((sum, c) => sum + c.width, 0)
)

/** 单元格取值 */
function cellValue(row: Record<string, unknown>, col: TableV2Column): unknown {
  if (col.dataKey) return row[col.dataKey]
  if (col.key) return row[col.key]
  return undefined
}

/** 点击表头 → 排序 */
function onHeaderClick(col: NormalizedColumn) {
  if (!col.sortable) return
  const current = props.sortBy
  const order =
    current && current.prop === col.key
      ? current.order === 'ascending'
        ? 'descending'
        : current.order === 'descending'
          ? null
          : 'ascending'
      : 'ascending'
  emit('sort-change', { prop: col.key, order })
}

/** 排序箭头 */
function sortIcon(col: TableV2Column): string {
  if (!props.sortBy || props.sortBy.prop !== col.key) return ''
  if (props.sortBy.order === 'ascending') return '▲'
  if (props.sortBy.order === 'descending') return '▼'
  return ''
}

/** 滚动处理 */
function onScroll(e: Event) {
  const el = e.target as HTMLElement
  scrollLeft.value = el.scrollLeft
  scrollTop.value = el.scrollTop
  emit('scroll', { scrollLeft: el.scrollLeft, scrollTop: el.scrollTop })
}

/** 固定列的阴影（滚动到边缘时显示） */
const leftShadow = computed(() => scrollLeft.value > 0)
const rightShadow = computed(() => {
  if (!bodyRef.value) return false
  const el = bodyRef.value
  return el.scrollLeft + el.clientWidth < el.scrollWidth - 1
})

watch(
  () => props.data.length,
  () => {
    /* 数据变化时滚动位置重置（与 EP 行为一致） */
    scrollLeft.value = 0
    scrollTop.value = 0
  }
)

defineExpose({
  /** 设置纵向滚动 */
  setScrollTop: (v: number) => {
    if (bodyRef.value) bodyRef.value.scrollTop = v
  },
  /** 设置横向滚动 */
  setScrollLeft: (v: number) => {
    if (bodyRef.value) bodyRef.value.scrollLeft = v
  },
  /** 清空排序 */
  clearSort: () => emit('sort-change', { prop: '', order: null })
})
</script>

<template>
  <div
    class="dmk-table-v2"
    :class="{ 'has-left-shadow': leftShadow, 'has-right-shadow': rightShadow }"
    :style="{ height: `${height}px`, width: width ? `${width}px` : '100%' }"
  >
    <!-- 表头 -->
    <div class="dmk-table-v2__header" :style="{ height: `${headerHeight}px` }">
      <!-- 左固定列 -->
      <div v-if="leftCols.length" class="dmk-table-v2__header-left">
        <div
          v-for="col in leftCols"
          :key="col.key"
          class="dmk-table-v2__th"
          :class="[col.className, `is-${col.align}`]"
          :style="{ width: `${col.width}px` }"
          @click="onHeaderClick(col); emit('column-click', col, cols.indexOf(col))"
        >
          {{ col.title }}
          <span v-if="sortIcon(col)" class="dmk-table-v2__sort">{{ sortIcon(col) }}</span>
        </div>
      </div>

      <!-- 中间列（虚拟化） -->
      <div class="dmk-table-v2__header-middle" :style="{ width: `${middleTotalWidth}px` }">
        <div
          v-for="col in visibleMiddleCols"
          :key="col.key"
          class="dmk-table-v2__th"
          :class="[col.className, `is-${col.align}`]"
          :style="{ width: `${col.width}px`, transform: `translateX(${middleOffset}px)` }"
          @click="onHeaderClick(col); emit('column-click', col, cols.indexOf(col))"
        >
          {{ col.title }}
          <span v-if="sortIcon(col)" class="dmk-table-v2__sort">{{ sortIcon(col) }}</span>
        </div>
      </div>

      <!-- 右固定列 -->
      <div v-if="rightCols.length" class="dmk-table-v2__header-right">
        <div
          v-for="col in rightCols"
          :key="col.key"
          class="dmk-table-v2__th"
          :class="[col.className, `is-${col.align}`]"
          :style="{ width: `${col.width}px` }"
          @click="onHeaderClick(col); emit('column-click', col, cols.indexOf(col))"
        >
          {{ col.title }}
          <span v-if="sortIcon(col)" class="dmk-table-v2__sort">{{ sortIcon(col) }}</span>
        </div>
      </div>
    </div>

    <!-- 表体 -->
    <div ref="bodyRef" class="dmk-table-v2__body" @scroll="onScroll">
      <div v-if="!data.length" class="dmk-table-v2__empty">{{ emptyText }}</div>

      <template v-else>
        <!-- 左固定列 -->
        <div v-if="leftCols.length" class="dmk-table-v2__col-left">
          <div
            v-for="(row, ri) in data"
            :key="String(row[rowKey] ?? ri)"
            class="dmk-table-v2__row"
            :style="{ height: `${rowHeight}px` }"
            @click="emit('row-click', row, ri)"
          >
            <div
              v-for="col in leftCols"
              :key="col.key"
              class="dmk-table-v2__td"
              :class="[col.className, `is-${col.align}`]"
              :style="{ width: `${col.width}px` }"
            >
              <slot
                name="default"
                :cell-data="cellValue(row, col)"
                :row-data="row"
                :column="col"
                :row-index="ri"
              >
                {{ cellValue(row, col) }}
              </slot>
            </div>
          </div>
        </div>

        <!-- 中间列（虚拟化） -->
        <div class="dmk-table-v2__col-middle" :style="{ width: `${middleTotalWidth}px` }">
          <div
            v-for="(row, ri) in data"
            :key="String(row[rowKey] ?? ri)"
            class="dmk-table-v2__row"
            :style="{ height: `${rowHeight}px` }"
            @click="emit('row-click', row, ri)"
          >
            <div
              v-for="col in visibleMiddleCols"
              :key="col.key"
              class="dmk-table-v2__td"
              :class="[col.className, `is-${col.align}`]"
              :style="{ width: `${col.width}px`, transform: `translateX(${middleOffset}px)` }"
            >
              <slot
                name="default"
                :cell-data="cellValue(row, col)"
                :row-data="row"
                :column="col"
                :row-index="ri"
              >
                {{ cellValue(row, col) }}
              </slot>
            </div>
          </div>
        </div>

        <!-- 右固定列 -->
        <div v-if="rightCols.length" class="dmk-table-v2__col-right">
          <div
            v-for="(row, ri) in data"
            :key="String(row[rowKey] ?? ri)"
            class="dmk-table-v2__row"
            :style="{ height: `${rowHeight}px` }"
            @click="emit('row-click', row, ri)"
          >
            <div
              v-for="col in rightCols"
              :key="col.key"
              class="dmk-table-v2__td"
              :class="[col.className, `is-${col.align}`]"
              :style="{ width: `${col.width}px` }"
            >
              <slot
                name="default"
                :cell-data="cellValue(row, col)"
                :row-data="row"
                :column="col"
                :row-index="ri"
              >
                {{ cellValue(row, col) }}
              </slot>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dmk-table-v2 {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  font-family: var(--dmk-font-family);
  color: var(--dmk-color-text);
}

.dmk-table-v2__header {
  display: flex;
  flex-shrink: 0;
  overflow: hidden;
  border-bottom: 1px solid var(--dmk-color-border);
  background: var(--dmk-color-bg-sunken);
}

.dmk-table-v2__header-left,
.dmk-table-v2__header-right {
  position: relative;
  z-index: 2;
  display: flex;
  flex-shrink: 0;
}

.dmk-table-v2__header-right {
  z-index: 3;
}

.dmk-table-v2__header-middle {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.dmk-table-v2__th {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  flex-shrink: 0;
  height: 100%;
  padding: 0 10px;
  color: var(--dmk-color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.dmk-table-v2__th.is-center {
  justify-content: center;
}

.dmk-table-v2__th.is-right {
  justify-content: flex-end;
}

.dmk-table-v2__sort {
  margin-left: 4px;
  color: var(--dmk-color-primary);
  font-size: 10px;
}

.dmk-table-v2__body {
  position: relative;
  flex: 1;
  overflow: auto;
}

.dmk-table-v2__col-left,
.dmk-table-v2__col-right {
  position: absolute;
  top: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.dmk-table-v2__col-left {
  left: 0;
}

.dmk-table-v2__col-right {
  right: 0;
  z-index: 3;
}

.dmk-table-v2__col-middle {
  position: relative;
}

.dmk-table-v2__row {
  display: flex;
  align-items: stretch;
  box-sizing: border-box;
  border-bottom: 1px solid var(--dmk-color-border-lighter, var(--dmk-color-border-subtle));
}

.dmk-table-v2__td {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 0 10px;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dmk-table-v2__td.is-center {
  justify-content: center;
}

.dmk-table-v2__td.is-right {
  justify-content: flex-end;
}

.dmk-table-v2__empty {
  padding: 40px;
  color: var(--dmk-color-text-muted);
  font-size: 13px;
  text-align: center;
}
</style>
