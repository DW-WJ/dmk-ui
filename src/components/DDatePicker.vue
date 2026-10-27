<script setup lang="ts">
/**
 * DDatePicker —— 日期选择器（对齐 Element Plus DatePicker 的核心能力）。
 * ---------------------------------------------------------------------------
 * 支持 type：date 单日 · dates 多日 · week 周 · month 月 · year 年
 *            daterange 日期范围 · monthrange 月份范围
 * 能力：shortcuts 快捷选项 · disabled-date 禁用日 · format/value-format
 *       default-time 范围默认时刻 · unlink-panels 左右面板不联动 · clearable
 * 设计：触发器与 DInput 同款（描边/尺寸/状态/焦点环），弹层绝对定位，z-index 用 --dmk-z-popup；
 *       点外部 / Esc 关闭；aria：button + dialog + grid，日期格 role="gridcell" + aria-selected。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  addMonths,
  addYears,
  applyValueFormat,
  buildMonthMatrix,
  formatDate,
  inRange,
  isSameDay,
  isSameMonth,
  resolveValue,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  type DatePickerType,
  type DateShortcut
} from '../lib/date'

type Size = 'sm' | 'md' | 'lg'
type Status = 'default' | 'error' | 'success' | 'warning'
type ViewMode = 'day' | 'month' | 'year'

const props = withDefaults(
  defineProps<{
    modelValue?: Date | string | number | Array<Date | string | number | null> | null
    type?: DatePickerType
    format?: string
    valueFormat?: string
    placeholder?: string
    startPlaceholder?: string
    endPlaceholder?: string
    rangeSeparator?: string
    disabled?: boolean
    clearable?: boolean
    size?: Size
    status?: Status
    disabledDate?: (d: Date) => boolean
    shortcuts?: DateShortcut[]
    defaultTime?: Date[]
    unlinkPanels?: boolean
  }>(),
  {
    modelValue: null,
    type: 'date',
    format: 'YYYY-MM-DD',
    valueFormat: undefined,
    placeholder: '请选择日期',
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期',
    rangeSeparator: '~',
    disabled: false,
    clearable: true,
    size: 'md',
    status: 'default',
    disabledDate: undefined,
    shortcuts: () => [],
    defaultTime: () => [],
    unlinkPanels: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  change: [value: unknown]
  clear: []
  focus: []
  blur: []
  'visible-change': [visible: boolean]
  'panel-change': [panel: Date]
}>()

const uid = `dmk-datepicker-${Math.random().toString(36).slice(2, 8)}`
const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const visible = ref(false)
const viewMode = ref<ViewMode>('day')
/** 面板当前显示的月份（day 视图用） */
const panelDate = ref<Date>(startOfMonth(new Date()))
/** 范围选择中间态：第一次点中的日期 */
const pendingStart = ref<Date | null>(null)
const pendingEnd = ref<Date | null>(null)

const isRange = computed(() => props.type === 'daterange' || props.type === 'monthrange')
const isMulti = computed(() => props.type === 'dates')
const isWeek = computed(() => props.type === 'week')
const isMonthType = computed(() => props.type === 'month' || props.type === 'monthrange')
const isYearType = computed(() => props.type === 'year')

/* ---------------------------------------------------------------- 值解析 */

/** 单值（date / week / month / year） */
const singleDate = computed<Date | null>(() => {
  if (isRange.value || isMulti.value) return null
  const v = props.modelValue
  if (Array.isArray(v)) return resolveValue(v[0], props.valueFormat)
  return resolveValue(v, props.valueFormat)
})

/** 多选（dates） */
const multiDates = computed<Date[]>(() => {
  if (!isMulti.value) return []
  const v = props.modelValue
  const arr = Array.isArray(v) ? v : v == null || v === '' ? [] : [v]
  return arr.map((x) => resolveValue(x, props.valueFormat)).filter((d): d is Date => !!d)
})

/** 范围（daterange / monthrange） */
const rangeValue = computed<{ start: Date | null; end: Date | null }>(() => {
  if (!isRange.value) return { start: null, end: null }
  const v = props.modelValue
  const arr = Array.isArray(v) ? v : []
  return {
    start: arr[0] ? resolveValue(arr[0], props.valueFormat) : null,
    end: arr[1] ? resolveValue(arr[1], props.valueFormat) : null
  }
})

const hasValue = computed(() => {
  if (isRange.value) return !!(rangeValue.value.start || rangeValue.value.end)
  if (isMulti.value) return multiDates.value.length > 0
  return !!singleDate.value
})

/* ---------------------------------------------------------------- 展示文本 */

const displayText = computed(() => {
  if (isRange.value) {
    const { start, end } = rangeValue.value
    if (!start && !end) return ''
    const s = start ? formatDate(start, props.format) : ''
    const e = end ? formatDate(end, props.format) : ''
    return `${s} ${props.rangeSeparator} ${e}`.trim()
  }
  if (isMulti.value) {
    if (!multiDates.value.length) return ''
    return multiDates.value.map((d) => formatDate(d, props.format)).join('、')
  }
  return singleDate.value ? formatDate(singleDate.value, props.format) : ''
})

const placeholderText = computed(() =>
  isRange.value ? `${props.startPlaceholder} ${props.rangeSeparator} ${props.endPlaceholder}` : props.placeholder
)

/* ---------------------------------------------------------------- 面板数据 */

/** 当前面板月（day 视图） */
const panelMonths = computed(() => {
  const base = panelDate.value
  const left = new Date(base.getFullYear(), base.getMonth(), 1)
  if (!isRange.value) return [left]
  const right = new Date(base.getFullYear(), base.getMonth() + 1, 1)
  return [left, right]
})

/** day 视图：6×7 日期矩阵 */
const dayMatrix = computed(() => buildMonthMatrix(panelDate.value.getFullYear(), panelDate.value.getMonth()))

/** month 视图：12 个月 */
const monthCells = computed(() => {
  const y = panelDate.value.getFullYear()
  return Array.from({ length: 12 }, (_, i) => new Date(y, i, 1))
})

/** year 视图：以 10 年为一段的 12 个年份 */
const yearCells = computed(() => {
  const y = panelDate.value.getFullYear()
  const startY = Math.floor(y / 10) * 10
  return Array.from({ length: 12 }, (_, i) => new Date(startY + i, 0, 1))
})

/* ---------------------------------------------------------------- 选中态判定 */

function isSelectedDay(d: Date): boolean {
  if (isMulti.value) return multiDates.value.some((x) => isSameDay(x, d))
  if (isRange.value) {
    const { start, end } = rangeValue.value
    return !!(start && isSameDay(start, d)) || !!(end && isSameDay(end, d))
  }
  if (isWeek.value) {
    const sel = singleDate.value
    if (!sel) return false
    return isSameDay(startOfWeek(sel), startOfWeek(d))
  }
  return !!singleDate.value && isSameDay(singleDate.value, d)
}

/** 范围高亮：落在起止之间 */
function isInRangeDay(d: Date): boolean {
  if (!isRange.value || props.type !== 'daterange') return false
  const { start, end } = rangeValue.value
  if (!start || !end) return false
  return inRange(d, start, end) && !isSameDay(d, start) && !isSameDay(d, end)
}

function isSelectedMonth(d: Date): boolean {
  if (props.type === 'monthrange') {
    const { start, end } = rangeValue.value
    return !!(start && isSameMonth(start, d)) || !!(end && isSameMonth(end, d))
  }
  const sel = singleDate.value
  return !!sel && isSameMonth(sel, d)
}

function isInRangeMonth(d: Date): boolean {
  if (props.type !== 'monthrange') return false
  const { start, end } = rangeValue.value
  if (!start || !end) return false
  return d.getTime() > startOfMonth(start).getTime() && d.getTime() < startOfMonth(end).getTime()
}

function isDisabled(d: Date): boolean {
  if (!props.disabledDate) return false
  try {
    return !!props.disabledDate(d)
  } catch {
    return false
  }
}

const today = computed(() => startOfDay(new Date()))

/* ---------------------------------------------------------------- 交互 */

function open() {
  if (props.disabled || visible.value) return
  visible.value = true
  // 打开时把面板定位到当前值所在月份
  const anchor = isRange.value
    ? rangeValue.value.start
    : isMulti.value
      ? multiDates.value[0]
      : singleDate.value
  panelDate.value = startOfMonth(anchor ?? new Date())
  viewMode.value = isYearType.value ? 'year' : isMonthType.value ? 'month' : 'day'
  pendingStart.value = null
  pendingEnd.value = null
  emit('visible-change', true)
}

function close() {
  if (!visible.value) return
  visible.value = false
  pendingStart.value = null
  pendingEnd.value = null
  emit('visible-change', false)
}

function toggle() {
  visible.value ? close() : open()
}

/** 提交一个单值 */
function commitSingle(d: Date) {
  const out = applyValueFormat(d, props.valueFormat)
  emit('update:modelValue', out)
  emit('change', out)
}

/** 提交范围 */
function commitRange(start: Date | null, end: Date | null) {
  const out = [applyValueFormat(start, props.valueFormat), applyValueFormat(end, props.valueFormat)]
  emit('update:modelValue', out)
  emit('change', out)
}

function onSelectDay(d: Date) {
  if (isDisabled(d)) return
  const day = startOfDay(d)

  if (props.type === 'dates') {
    const next = [...multiDates.value]
    const idx = next.findIndex((x) => isSameDay(x, day))
    if (idx >= 0) next.splice(idx, 1)
    else next.push(day)
    const out = next.map((x) => applyValueFormat(x, props.valueFormat))
    emit('update:modelValue', out)
    emit('change', out)
    return
  }

  if (props.type === 'week') {
    commitSingle(startOfWeek(day))
    close()
    return
  }

  if (props.type === 'daterange') {
    if (!pendingStart.value || (pendingStart.value && pendingEnd.value)) {
      // 第一次点（或重新开始）：记起点
      pendingStart.value = day
      pendingEnd.value = null
      return
    }
    let s = pendingStart.value
    let e = day
    if (e.getTime() < s.getTime()) [s, e] = [e, s]
    // default-time：分别指定起止日期的默认时刻
    const dt = props.defaultTime
    if (dt[0]) s = withTime(s, dt[0])
    if (dt[1]) e = withTime(e, dt[1])
    commitRange(s, e)
    pendingStart.value = null
    pendingEnd.value = null
    close()
    return
  }

  commitSingle(day)
  close()
}

function withTime(d: Date, time: Date): Date {
  const x = new Date(d.getTime())
  x.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0)
  return x
}

function onSelectMonth(d: Date) {
  if (props.type === 'monthrange') {
    const m = startOfMonth(d)
    if (!pendingStart.value || (pendingStart.value && pendingEnd.value)) {
      pendingStart.value = m
      pendingEnd.value = null
      return
    }
    let s = pendingStart.value
    let e = m
    if (e.getTime() < s.getTime()) [s, e] = [e, s]
    commitRange(s, e)
    pendingStart.value = null
    pendingEnd.value = null
    close()
    return
  }
  if (props.type === 'month') {
    commitSingle(startOfMonth(d))
    close()
    return
  }
  // 在 day 视图里点月份 → 下钻到该月
  panelDate.value = startOfMonth(d)
  viewMode.value = 'day'
}

function onSelectYear(d: Date) {
  if (isYearType.value) {
    commitSingle(startOfYear(d))
    close()
    return
  }
  panelDate.value = new Date(d.getFullYear(), panelDate.value.getMonth(), 1)
  viewMode.value = 'month'
}

function onShortcut(sc: DateShortcut) {
  const d = startOfDay(sc.value())
  if (props.type === 'daterange' || props.type === 'monthrange') {
    // 快捷范围：起 = 快捷日，止 = 今天
    const start = props.type === 'monthrange' ? startOfMonth(d) : d
    const end = props.type === 'monthrange' ? startOfMonth(new Date()) : startOfDay(new Date())
    commitRange(start, end.getTime() < start.getTime() ? start : end)
  } else if (props.type === 'dates') {
    const out = [applyValueFormat(d, props.valueFormat)]
    emit('update:modelValue', out)
    emit('change', out)
  } else {
    commitSingle(d)
  }
  close()
}

/** 面板头部标题：按当前视图层级显示 */
const panelTitle = computed(() => {
  const d = panelDate.value
  if (viewMode.value === 'year') {
    const startY = Math.floor(d.getFullYear() / 10) * 10
    return `${startY} - ${startY + 11}`
  }
  if (viewMode.value === 'month') return `${d.getFullYear()}年`
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
})

function onTitleClick() {
  if (viewMode.value === 'day') viewMode.value = 'month'
  else if (viewMode.value === 'month') viewMode.value = 'year'
}

function shiftPanel(step: number) {
  if (viewMode.value === 'year') {
    panelDate.value = addYears(panelDate.value, step * 10)
  } else if (viewMode.value === 'month') {
    panelDate.value = addYears(panelDate.value, step)
  } else {
    panelDate.value = addMonths(panelDate.value, step)
  }
  emit('panel-change', panelDate.value)
}

/** 范围模式下的第二个面板（右侧）标题 */
const rightPanelTitle = computed(() => {
  const right = panelMonths.value[1]
  if (!right) return ''
  return `${right.getFullYear()}年${right.getMonth() + 1}月`
})

function onClear() {
  const empty = isRange.value ? [null, null] : isMulti.value ? [] : null
  emit('update:modelValue', empty)
  emit('change', empty)
  emit('clear')
  close()
}

function onDocPointerDown(e: MouseEvent) {
  const root = rootRef.value
  if (root && !root.contains(e.target as Node)) close()
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (e.key === 'Escape' && visible.value) {
    e.preventDefault()
    close()
  }
}

/* ---------------------------------------------------------------- 生命周期 */

watch(visible, (v) => {
  if (v) document.addEventListener('mousedown', onDocPointerDown, true)
  else document.removeEventListener('mousedown', onDocPointerDown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocPointerDown, true)
})

/** 暴露给父组件（Element Plus 同款 exposes） */
defineExpose({
  focus: () => triggerRef.value?.focus(),
  blur: () => triggerRef.value?.blur(),
  handleOpen: open,
  handleClose: close
})
</script>

<template>
  <div
    ref="rootRef"
    class="dmk-datepicker"
    :class="[`s-${size}`, `st-${status}`, { 'is-disabled': disabled, 'is-open': visible }]"
  >
    <div
      ref="triggerRef"
      class="dmk-datepicker__trigger"
      role="combobox"
      tabindex="0"
      :aria-expanded="visible"
      :aria-haspopup="'dialog'"
      :aria-controls="`${uid}-panel`"
      :aria-disabled="disabled || undefined"
      :aria-invalid="status === 'error' ? 'true' : undefined"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="dmk-datepicker__icon" aria-hidden="true">📅</span>
      <span class="dmk-datepicker__value" :class="{ 'is-placeholder': !hasValue }">
        {{ hasValue ? displayText : placeholderText }}
      </span>
      <span
        v-if="clearable && hasValue && !disabled"
        class="dmk-datepicker__clear"
        role="button"
        tabindex="-1"
        aria-label="清空"
        @click.stop="onClear"
        >×</span
      >
    </div>

    <transition name="dmk-datepicker-zoom">
      <div v-if="visible" :id="`${uid}-panel`" class="dmk-datepicker__popper" role="dialog" aria-label="选择日期" @mousedown.prevent>
        <div class="dmk-datepicker__body" :class="{ 'is-range': isRange }">
          <!-- 左面板 -->
          <div class="dmk-datepicker__panel">
            <div class="dmk-datepicker__head">
              <button type="button" class="dmk-datepicker__nav" aria-label="上一页" @click="shiftPanel(-1)">‹</button>
              <button type="button" class="dmk-datepicker__title" @click="onTitleClick">{{ panelTitle }}</button>
              <button type="button" class="dmk-datepicker__nav" aria-label="下一页" @click="shiftPanel(1)">›</button>
            </div>

            <!-- day 视图 -->
            <template v-if="viewMode === 'day'">
              <div class="dmk-datepicker__week">
                <span v-for="w in WEEK_LABELS" :key="w" class="dmk-datepicker__week-cell">{{ w }}</span>
              </div>
              <div class="dmk-datepicker__grid" role="grid">
                <button
                  v-for="d in dayMatrix.flat()"
                  :key="d.getTime()"
                  type="button"
                  class="dmk-datepicker__cell"
                  :class="{
                    'is-today': isSameDay(d, today),
                    'is-selected': isSelectedDay(d),
                    'is-in-range': isInRangeDay(d),
                    'is-outside': d.getMonth() !== panelDate.getMonth(),
                    'is-disabled': isDisabled(d)
                  }"
                  role="gridcell"
                  :aria-selected="isSelectedDay(d)"
                  :aria-disabled="isDisabled(d) || undefined"
                  :disabled="isDisabled(d)"
                  @click="onSelectDay(d)"
                >
                  {{ d.getDate() }}
                </button>
              </div>
            </template>

            <!-- month 视图 -->
            <template v-else-if="viewMode === 'month'">
              <div class="dmk-datepicker__grid dmk-datepicker__grid--months" role="grid">
                <button
                  v-for="m in monthCells"
                  :key="m.getTime()"
                  type="button"
                  class="dmk-datepicker__cell"
                  :class="{
                    'is-selected': isSelectedMonth(m),
                    'is-in-range': isInRangeMonth(m),
                    'is-outside': m.getFullYear() !== panelDate.getFullYear(),
                    'is-today': isSameMonth(m, today)
                  }"
                  role="gridcell"
                  :aria-selected="isSelectedMonth(m)"
                  @click="onSelectMonth(m)"
                >
                  {{ m.getMonth() + 1 }}月
                </button>
              </div>
            </template>

            <!-- year 视图 -->
            <template v-else>
              <div class="dmk-datepicker__grid dmk-datepicker__grid--years" role="grid">
                <button
                  v-for="y in yearCells"
                  :key="y.getTime()"
                  type="button"
                  class="dmk-datepicker__cell"
                  :class="{
                    'is-selected': !!singleDate && singleDate.getFullYear() === y.getFullYear(),
                    'is-outside': y.getFullYear() !== panelDate.getFullYear(),
                    'is-today': y.getFullYear() === today.getFullYear()
                  }"
                  role="gridcell"
                  :aria-selected="!!singleDate && singleDate.getFullYear() === y.getFullYear()"
                  @click="onSelectYear(y)"
                >
                  {{ y.getFullYear() }}
                </button>
              </div>
            </template>
          </div>

          <!-- 右面板（范围模式） -->
          <div v-if="isRange && panelMonths.length > 1" class="dmk-datepicker__panel">
            <div class="dmk-datepicker__head">
              <button type="button" class="dmk-datepicker__nav" aria-label="下一页" @click="shiftPanel(1)">›</button>
              <span class="dmk-datepicker__title">{{ rightPanelTitle }}</span>
            </div>
            <div v-if="viewMode === 'day'" class="dmk-datepicker__week">
              <span v-for="w in WEEK_LABELS" :key="w" class="dmk-datepicker__week-cell">{{ w }}</span>
            </div>
            <div class="dmk-datepicker__grid" role="grid">
              <template v-if="viewMode === 'day'">
                <button
                  v-for="d in buildMonthMatrix(panelMonths[1].getFullYear(), panelMonths[1].getMonth()).flat()"
                  :key="d.getTime()"
                  type="button"
                  class="dmk-datepicker__cell"
                  :class="{
                    'is-today': isSameDay(d, today),
                    'is-selected': isSelectedDay(d),
                    'is-in-range': isInRangeDay(d),
                    'is-outside': d.getMonth() !== panelMonths[1].getMonth(),
                    'is-disabled': isDisabled(d)
                  }"
                  role="gridcell"
                  :aria-selected="isSelectedDay(d)"
                  :aria-disabled="isDisabled(d) || undefined"
                  :disabled="isDisabled(d)"
                  @click="onSelectDay(d)"
                >
                  {{ d.getDate() }}
                </button>
              </template>
              <template v-else-if="viewMode === 'month'">
                <button
                  v-for="m in monthCells"
                  :key="m.getTime()"
                  type="button"
                  class="dmk-datepicker__cell"
                  :class="{
                    'is-selected': isSelectedMonth(m),
                    'is-in-range': isInRangeMonth(m),
                    'is-outside': m.getFullYear() !== panelDate.getFullYear()
                  }"
                  role="gridcell"
                  :aria-selected="isSelectedMonth(m)"
                  @click="onSelectMonth(m)"
                >
                  {{ m.getMonth() + 1 }}月
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- 底部：快捷选项 -->
        <div v-if="shortcuts.length" class="dmk-datepicker__footer">
          <button
            v-for="(sc, i) in shortcuts"
            :key="i"
            type="button"
            class="dmk-datepicker__shortcut"
            @click="onShortcut(sc)"
          >
            {{ sc.text }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dmk-datepicker {
  position: relative;
  display: inline-block;
}

/* ---------- 触发器：与 DInput 同款 ---------- */
.dmk-datepicker__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 200px;
  height: var(--dmk-control-height);
  padding: 0 var(--dmk-control-padding-x);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-md);
  cursor: pointer;
  transition:
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-datepicker__trigger:hover {
  border-color: var(--dmk-color-border-strong);
}

.dmk-datepicker__trigger:focus-visible {
  outline: none;
  border-color: var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-datepicker.is-disabled .dmk-datepicker__trigger {
  cursor: not-allowed;
  opacity: 0.6;
}

.dmk-datepicker__icon {
  font-size: 13px;
  line-height: 1;
}

.dmk-datepicker__value {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dmk-datepicker__value.is-placeholder {
  color: var(--dmk-color-text-muted);
}

.dmk-datepicker__clear {
  flex: none;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--dmk-color-text-muted);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}

.dmk-datepicker__clear:hover {
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-text);
}

/* 尺寸档 */
.dmk-datepicker.s-sm .dmk-datepicker__trigger {
  height: var(--dmk-control-height-sm);
  font-size: var(--dmk-font-sm);
}

.dmk-datepicker.s-lg .dmk-datepicker__trigger {
  height: var(--dmk-control-height-lg);
  font-size: var(--dmk-font-lg);
}

/* 状态色 */
.dmk-datepicker.st-error .dmk-datepicker__trigger {
  border-color: var(--dmk-color-danger);
}

.dmk-datepicker.st-success .dmk-datepicker__trigger {
  border-color: var(--dmk-color-success);
}

.dmk-datepicker.st-warning .dmk-datepicker__trigger {
  border-color: var(--dmk-color-warning);
}

/* ---------- 弹层 ---------- */
.dmk-datepicker__popper {
  position: absolute;
  z-index: var(--dmk-z-popup);
  top: calc(100% + 6px);
  left: 0;
  min-width: 280px;
  padding: 10px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
}

.dmk-datepicker__body {
  display: flex;
  gap: 14px;
}

.dmk-datepicker__panel {
  min-width: 250px;
}

.dmk-datepicker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 8px;
}

.dmk-datepicker__nav {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: var(--dmk-color-text-secondary);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.dmk-datepicker__nav:hover {
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-primary);
}

.dmk-datepicker__title {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-md);
  font-weight: 600;
  cursor: pointer;
}

.dmk-datepicker__title:hover {
  color: var(--dmk-color-primary);
}

.dmk-datepicker__week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}

.dmk-datepicker__week-cell {
  text-align: center;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
}

.dmk-datepicker__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.dmk-datepicker__grid--months,
.dmk-datepicker__grid--years {
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.dmk-datepicker__cell {
  min-width: 30px;
  min-height: 30px;
  padding: 4px;
  border: 1px solid transparent;
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-sm);
  line-height: 1.2;
  cursor: pointer;
  transition:
    background-color var(--dmk-duration-fast) var(--dmk-ease),
    color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-datepicker__cell:hover:not(.is-disabled) {
  background: var(--dmk-color-surface-hover);
}

.dmk-datepicker__cell.is-outside {
  color: var(--dmk-color-text-muted);
  opacity: 0.55;
}

.dmk-datepicker__cell.is-today {
  border-color: var(--dmk-color-primary);
  color: var(--dmk-color-primary);
  font-weight: 600;
}

.dmk-datepicker__cell.is-selected {
  background: var(--dmk-color-primary);
  color: var(--dmk-color-on-primary);
  font-weight: 600;
}

.dmk-datepicker__cell.is-in-range {
  background: var(--dmk-color-primary-subtle);
  color: var(--dmk-color-primary);
  border-radius: 0;
}

.dmk-datepicker__cell.is-disabled {
  color: var(--dmk-color-text-muted);
  cursor: not-allowed;
  text-decoration: line-through;
  opacity: 0.5;
}

.dmk-datepicker__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--dmk-color-border-subtle);
}

.dmk-datepicker__shortcut {
  padding: 4px 9px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-sm);
  cursor: pointer;
}

.dmk-datepicker__shortcut:hover {
  border-color: var(--dmk-color-primary);
  color: var(--dmk-color-primary);
}

/* ---------- 过渡 ---------- */
.dmk-datepicker-zoom-enter-active,
.dmk-datepicker-zoom-leave-active {
  transition:
    opacity var(--dmk-duration-fast) var(--dmk-ease),
    transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-datepicker-zoom-enter-from,
.dmk-datepicker-zoom-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
