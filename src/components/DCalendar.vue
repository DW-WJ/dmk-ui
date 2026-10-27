<script setup lang="ts">
/**
 * DCalendar —— 日历。
 * 设计要点：复用 lib/date.ts 的日历矩阵内核（周一起始的 6×7 网格）；
 * 支持单选 / 区间选择、禁用日期、自定义日期格插槽、翻月与回到今天。
 */
import { computed, ref, watch } from 'vue'
import {
  buildMonthMatrix,
  formatDate,
  isSameDay,
  isSameMonth,
  parseDate,
  startOfDay
} from '../lib/date'

const props = withDefaults(
  defineProps<{
    /** 选中值：单选为 Date|string，区间为 [起, 止] */
    modelValue?: Date | string | Array<Date | string | null> | null
    /** 区间选择 */
    range?: boolean
    /** 禁用日期 */
    disabledDate?: (date: Date) => boolean
    /** 绑定值格式（默认 YYYY-MM-DD） */
    valueFormat?: string
    /** 头部是否显示星期行 */
    showWeek?: boolean
    ariaLabel?: string
  }>(),
  {
    modelValue: null,
    range: false,
    disabledDate: undefined,
    valueFormat: 'YYYY-MM-DD',
    showWeek: true,
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  select: [date: Date]
  change: [value: unknown]
}>()

/** 当前面板显示的年月 */
const cursor = ref(new Date())

const WEEK_HEAD = ['一', '二', '三', '四', '五', '六', '日']

/** 选中值（解析成 Date） */
const selected = computed<(Date | null)[]>(() => {
  const v = props.modelValue
  if (Array.isArray(v)) return [parseDate(v[0]), parseDate(v[1])]
  const d = parseDate(v)
  return d ? [d, null] : [null, null]
})

const matrix = computed(() => buildMonthMatrix(cursor.value.getFullYear(), cursor.value.getMonth()))

function isDisabled(d: Date) {
  return props.disabledDate ? props.disabledDate(d) : false
}

function isSelected(d: Date) {
  const [s, e] = selected.value
  if (!s) return false
  if (!props.range) return isSameDay(s, d)
  if (!e) return isSameDay(s, d)
  return d.getTime() >= s.getTime() && d.getTime() <= e.getTime()
}

function isInRange(d: Date) {
  const [s, e] = selected.value
  if (!props.range || !s || !e) return false
  return d.getTime() > s.getTime() && d.getTime() < e.getTime()
}

function isStart(d: Date) {
  const s = selected.value[0]
  return !!s && isSameDay(s, d)
}

function isEnd(d: Date) {
  const e = selected.value[1]
  return !!e && isSameDay(e, d)
}

function format(d: Date) {
  return formatDate(d, props.valueFormat)
}

function onPick(d: Date) {
  if (isDisabled(d)) return
  emit('select', d)
  if (!props.range) {
    const v = format(d)
    emit('update:modelValue', v)
    emit('change', v)
    return
  }
  const [s, e] = selected.value
  if (!s || (s && e)) {
    // 新的起点
    const v = [format(d), null]
    emit('update:modelValue', v)
    emit('change', v)
    return
  }
  // 选终点：早于起点则交换
  const [a, b] = d.getTime() < s.getTime() ? [d, s] : [s, d]
  const v = [format(a), format(b)]
  emit('update:modelValue', v)
  emit('change', v)
}

function prevMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1)
}

function nextMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1)
}

function today() {
  cursor.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
}

/** 底部展示的选中值文本（模板表达式不支持 TS 非空断言 !，这里预先算好） */
const selectedText = computed(() => {
  const [s, e] = selected.value
  if (!s) return '未选择'
  const a = format(s)
  return props.range && e ? `${a} ~ ${format(e)}` : a
})

watch(
  () => props.modelValue,
  (v) => {
    const d = parseDate(Array.isArray(v) ? v[0] : v)
    if (d && !isSameMonth(d, cursor.value)) {
      cursor.value = new Date(d.getFullYear(), d.getMonth(), 1)
    }
  }
)
</script>

<template>
  <div class="dmk-calendar" :aria-label="ariaLabel ?? '日历'">
    <!-- 头部 -->
    <div class="dmk-calendar__header">
      <button type="button" class="dmk-calendar__nav" aria-label="上一月" @click="prevMonth">
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M8 2.5 4.5 6 8 9.5" fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <span class="dmk-calendar__title">
        {{ cursor.getFullYear() }} 年 {{ cursor.getMonth() + 1 }} 月
      </span>
      <button type="button" class="dmk-calendar__nav" aria-label="下一月" @click="nextMonth">
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M4 2.5 7.5 6 4 9.5" fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <!-- 星期行 -->
    <div v-if="showWeek" class="dmk-calendar__week" aria-hidden="true">
      <span v-for="w in WEEK_HEAD" :key="w" class="dmk-calendar__week-cell">{{ w }}</span>
    </div>

    <!-- 日期网格 -->
    <div class="dmk-calendar__grid" role="grid">
      <div v-for="(week, wi) in matrix" :key="wi" class="dmk-calendar__row" role="row">
        <button
          v-for="d in week"
          :key="d.getTime()"
          type="button"
          class="dmk-calendar__cell"
          role="gridcell"
          :class="{
            'is-outside': !isSameMonth(d, cursor),
            'is-today': isSameDay(d, startOfDay(new Date())),
            'is-selected': isSelected(d),
            'is-in-range': isInRange(d),
            'is-start': isStart(d),
            'is-end': isEnd(d),
            'is-disabled': isDisabled(d)
          }"
          :disabled="isDisabled(d)"
          :aria-selected="isSelected(d)"
          @click="onPick(d)"
        >
          <slot name="date-cell" :date="d">{{ d.getDate() }}</slot>
        </button>
      </div>
    </div>

    <div class="dmk-calendar__footer">
      <button type="button" class="dmk-calendar__today" @click="today">回到今天</button>
      <span class="dmk-calendar__value">
        <slot name="value">{{ selectedText }}</slot>
      </span>
    </div>
  </div>
</template>

<style scoped>
.dmk-calendar {
  display: inline-block;
  width: 280px;
  padding: 10px;
  font-family: var(--dmk-font-family);
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
}

.dmk-calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.dmk-calendar__title {
  font-size: var(--dmk-font-base);
  font-weight: 600;
  color: var(--dmk-color-text);
}

.dmk-calendar__nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  color: var(--dmk-color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--dmk-radius-sm);
  cursor: pointer;
}

.dmk-calendar__nav svg {
  width: 12px;
  height: 12px;
}

.dmk-calendar__nav:hover {
  color: var(--dmk-color-text);
  background: var(--dmk-color-surface-hover);
}

.dmk-calendar__nav:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-calendar__week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
}

.dmk-calendar__week-cell {
  padding: 4px 0;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-faint);
  text-align: center;
}

.dmk-calendar__grid {
  display: flex;
  flex-direction: column;
}

.dmk-calendar__row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.dmk-calendar__cell {
  height: 32px;
  padding: 0;
  font-family: inherit;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text);
  background: transparent;
  border: none;
  border-radius: var(--dmk-radius-sm);
  cursor: pointer;
  transition:
    background-color var(--dmk-duration-fast) var(--dmk-ease),
    color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-calendar__cell:hover:not(.is-disabled) {
  background: var(--dmk-color-surface-hover);
}

.dmk-calendar__cell.is-outside {
  color: var(--dmk-color-text-faint);
  opacity: 0.6;
}

.dmk-calendar__cell.is-today {
  font-weight: 600;
  color: var(--dmk-color-primary);
}

.dmk-calendar__cell.is-in-range {
  background: var(--dmk-color-primary-subtle);
  border-radius: 0;
}

.dmk-calendar__cell.is-selected {
  color: var(--dmk-color-on-primary);
  background: var(--dmk-color-primary);
  font-weight: 600;
}

.dmk-calendar__cell.is-start {
  border-radius: var(--dmk-radius-sm) 0 0 var(--dmk-radius-sm);
}

.dmk-calendar__cell.is-end {
  border-radius: 0 var(--dmk-radius-sm) var(--dmk-radius-sm) 0;
}

.dmk-calendar__cell.is-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  text-decoration: line-through;
}

.dmk-calendar__cell:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-calendar__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--dmk-color-border-subtle);
}

.dmk-calendar__today {
  padding: 3px 8px;
  font-family: inherit;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-primary);
  background: transparent;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  cursor: pointer;
}

.dmk-calendar__today:hover {
  background: var(--dmk-color-primary-subtle);
}

.dmk-calendar__value {
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-muted);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .dmk-calendar__cell {
    transition: none;
  }
}
</style>
