<script setup lang="ts">
/**
 * DDatePickerPanel —— 日历面板（纯面板，无触发器）。
 * 契约参考 Element Plus el-date-picker 的 panel 变体：
 *   modelValue / type（date | dates | month | year）/ multiple / range /
 *   shortcuts / disabledDate / cellClassName / showFooter / defaultValue
 *   Events: change / calendar-change
 *
 * 与 DDateTimePicker 的关系：两者共用 lib/date.ts 的日期内核。
 */
import { computed, ref, watch } from 'vue'
import {
  addMonths,
  buildMonthMatrix,
  formatDate,
  isSameDay,
  isSameMonth,
  resolveValue
} from '../lib/date'

/** 快捷选项 */
export interface PanelShortcut {
  text: string
  /** 相对今天的偏移天数 */
  value?: number
  /** 直接给日期 */
  date?: Date
}

const props = withDefaults(
  defineProps<{
    /** 绑定值（单值 / 数组） */
    modelValue?: unknown
    /** 面板类型 */
    type?: 'date' | 'dates' | 'month' | 'year'
    /** 是否范围选择（双面板） */
    range?: boolean
    /** 快捷选项 */
    shortcuts?: PanelShortcut[]
    /** 禁用日期判定 */
    disabledDate?: (date: Date) => boolean
    /** 自定义单元格类名 */
    cellClassName?: (date: Date) => string
    /** 是否显示底部栏 */
    showFooter?: boolean
    /** 默认值（未选中时的初始日期） */
    defaultValue?: Date
  }>(),
  {
    modelValue: undefined,
    type: 'date',
    range: false,
    shortcuts: () => [],
    disabledDate: undefined,
    cellClassName: undefined,
    showFooter: true,
    defaultValue: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  change: [value: unknown]
  'calendar-change': [value: unknown]
}>()

/** 左面板当前月份 */
const leftMonth = ref<Date>(new Date())
/** 右面板当前月份（range 模式） */
const rightMonth = ref<Date>(addMonths(new Date(), 1))
/** 已选中的日期集合（多选 / 范围用） */
const selected = ref<Date[]>([])
/** range 模式下正在编辑哪一段 */
const editingEnd = ref(false)

/** 归一化绑定值 */
const parsed = computed<Date[]>(() => {
  const raw = props.modelValue
  if (Array.isArray(raw)) {
    return raw.map((v) => resolveValue(v)).filter((d): d is Date => !!d)
  }
  const one = resolveValue(raw)
  return one ? [one] : []
})

watch(
  () => props.modelValue,
  () => {
    selected.value = [...parsed.value]
  },
  { immediate: true }
)

/** 星期表头 */
const weekDays = ['一', '二', '三', '四', '五', '六', '日']

/** 左面板月历 */
const leftMatrix = computed(() =>
  buildMonthMatrix(leftMonth.value.getFullYear(), leftMonth.value.getMonth())
)

/** 右面板月历 */
const rightMatrix = computed(() =>
  buildMonthMatrix(rightMonth.value.getFullYear(), rightMonth.value.getMonth())
)

/** 面板标题 */
const leftTitle = computed(
  () => `${leftMonth.value.getFullYear()} 年 ${leftMonth.value.getMonth() + 1} 月`
)
const rightTitle = computed(
  () => `${rightMonth.value.getFullYear()} 年 ${rightMonth.value.getMonth() + 1} 月`
)

/** 快捷选项的日期 */
function shortcutDate(s: PanelShortcut): Date {
  if (s.date) return s.date
  const d = new Date()
  d.setDate(d.getDate() + (s.value ?? 0))
  return d
}

/** 是否已选中 */
function isPicked(d: Date): boolean {
  return selected.value.some((s) => isSameDay(s, d))
}

/** 是否是今天 */
function isToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

/** 是否在当前月 */
function inMonth(d: Date, month: Date): boolean {
  return isSameMonth(d, month)
}

/** 是否禁用 */
function isDisabled(d: Date): boolean {
  return props.disabledDate ? props.disabledDate(d) : false
}

/** 点击某天 */
function onDayClick(d: Date, _side: 'left' | 'right') {
  if (isDisabled(d)) return
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (props.type === 'dates') {
    // 多选：点已选的取消
    const idx = selected.value.findIndex((s) => isSameDay(s, day))
    const next = idx >= 0 ? selected.value.filter((_, i) => i !== idx) : [...selected.value, day]
    selected.value = next
    emit('calendar-change', [...next])
    // ⚠️ 多选同样要发 update:modelValue —— 漏发会让父组件拿不到选中结果
    emit('update:modelValue', [...next])
    emit('change', [...next])
    return
  }

  if (props.range) {
    // 范围：先选起，再选止
    if (!editingEnd.value) {
      selected.value = [day]
      editingEnd.value = true
    } else {
      const start = selected.value[0] ?? day
      const end = day
      selected.value = start <= end ? [start, end] : [end, start]
      editingEnd.value = false
    }
    emit('calendar-change', [...selected.value])
    return
  }

  selected.value = [day]
  emit('calendar-change', day)
  emit('update:modelValue', day)
  emit('change', day)
}

/** 应用快捷选项 */
function applyShortcut(s: PanelShortcut) {
  const d = shortcutDate(s)
  selected.value = [d]
  emit('update:modelValue', props.type === 'dates' ? [d] : d)
  emit('change', props.type === 'dates' ? [d] : d)
}

/** 左右切换月份 */
function shiftMonth(delta: number) {
  leftMonth.value = addMonths(leftMonth.value, delta)
  if (props.range) rightMonth.value = addMonths(rightMonth.value, delta)
}

/** 切换年份 */
function shiftYear(delta: number) {
  leftMonth.value = new Date(leftMonth.value.getFullYear() + delta, leftMonth.value.getMonth(), 1)
  if (props.range) {
    rightMonth.value = new Date(rightMonth.value.getFullYear() + delta, rightMonth.value.getMonth(), 1)
  }
}

/** 单元格类名 */
function cellClass(d: Date): string {
  return props.cellClassName ? props.cellClassName(d) : ''
}

/** 类型为 month / year 时只显示年月（简化为仍按日渲染但高亮整月） */
function isMonthPicked(d: Date): boolean {
  if (props.type !== 'month') return false
  return selected.value.some((s) => isSameMonth(s, d))
}

defineExpose({
  /** 跳到指定年月 */
  showMonth: (year: number, month: number) => {
    leftMonth.value = new Date(year, month, 1)
    rightMonth.value = addMonths(leftMonth.value, 1)
  }
})
</script>

<template>
  <div class="dmk-dp-panel" :class="{ 'is-range': range }">
    <div v-if="shortcuts.length" class="dmk-dp-panel__shortcuts">
      <button
        v-for="(s, i) in shortcuts"
        :key="i"
        type="button"
        class="dmk-dp-panel__shortcut"
        @click="applyShortcut(s)"
      >
        {{ s.text }}
      </button>
    </div>

    <div class="dmk-dp-panel__calendars">
      <!-- 左面板 -->
      <div class="dmk-dp-panel__calendar">
        <div class="dmk-dp-panel__head">
          <button type="button" class="dmk-dp-panel__nav" aria-label="上一年" @click="shiftYear(-1)">«</button>
          <button type="button" class="dmk-dp-panel__nav" aria-label="上月" @click="shiftMonth(-1)">‹</button>
          <span class="dmk-dp-panel__title">{{ leftTitle }}</span>
          <button v-if="!range" type="button" class="dmk-dp-panel__nav" aria-label="下月" @click="shiftMonth(1)">›</button>
        </div>

        <div class="dmk-dp-panel__week">
          <span v-for="w in weekDays" :key="w">{{ w }}</span>
        </div>

        <div class="dmk-dp-panel__grid">
          <template v-for="(row, ri) in leftMatrix" :key="ri">
            <button
              v-for="cell in row"
              :key="cell.getTime()"
              type="button"
              class="dmk-dp-panel__cell"
              :class="[
                cellClass(cell),
                {
                  'is-outside': !inMonth(cell, leftMonth),
                  'is-today': isToday(cell),
                  'is-picked': isPicked(cell) || isMonthPicked(cell),
                  'is-disabled': isDisabled(cell)
                }
              ]"
              :disabled="isDisabled(cell)"
              @click="onDayClick(cell, 'left')"
            >
              {{ cell.getDate() }}
            </button>
          </template>
        </div>
      </div>

      <!-- 右面板（range 模式） -->
      <div v-if="range" class="dmk-dp-panel__calendar">
        <div class="dmk-dp-panel__head">
          <button type="button" class="dmk-dp-panel__nav" aria-label="下月" @click="shiftMonth(1)">›</button>
          <span class="dmk-dp-panel__title">{{ rightTitle }}</span>
          <button type="button" class="dmk-dp-panel__nav" aria-label="下一年" @click="shiftYear(1)">»</button>
        </div>

        <div class="dmk-dp-panel__week">
          <span v-for="w in weekDays" :key="w">{{ w }}</span>
        </div>

        <div class="dmk-dp-panel__grid">
          <template v-for="(row, ri) in rightMatrix" :key="ri">
            <button
              v-for="cell in row"
              :key="cell.getTime()"
              type="button"
              class="dmk-dp-panel__cell"
              :class="[
                cellClass(cell),
                {
                  'is-outside': !inMonth(cell, rightMonth),
                  'is-today': isToday(cell),
                  'is-picked': isPicked(cell),
                  'is-disabled': isDisabled(cell)
                }
              ]"
              :disabled="isDisabled(cell)"
              @click="onDayClick(cell, 'right')"
            >
              {{ cell.getDate() }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="showFooter" class="dmk-dp-panel__footer">
      <span class="dmk-dp-panel__summary">
        <template v-if="selected.length">
          {{ selected.map((d) => formatDate(d, 'YYYY-MM-DD')).join(' ~ ') }}
        </template>
        <template v-else>未选择</template>
      </span>
    </div>
  </div>
</template>

<style scoped>
.dmk-dp-panel {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  font-family: var(--dmk-font-family);
}

.dmk-dp-panel.is-range {
  flex-direction: column;
}

.dmk-dp-panel__shortcuts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 72px;
}

.dmk-dp-panel__shortcut {
  padding: 5px 8px;
  border: none;
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: var(--dmk-color-text-secondary);
  font-family: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.dmk-dp-panel__shortcut:hover {
  background: var(--dmk-color-primary-subtle);
  color: var(--dmk-color-primary);
}

.dmk-dp-panel__calendars {
  display: flex;
  gap: 16px;
}

.dmk-dp-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.dmk-dp-panel__nav {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: var(--dmk-color-text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.dmk-dp-panel__nav:hover {
  background: var(--dmk-color-fill);
  color: var(--dmk-color-primary);
}

.dmk-dp-panel__title {
  color: var(--dmk-color-text);
  font-size: 13px;
  font-weight: 600;
}

.dmk-dp-panel__week,
.dmk-dp-panel__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.dmk-dp-panel__week span {
  padding: 4px 0;
  color: var(--dmk-color-text-muted);
  font-size: 12px;
  text-align: center;
}

.dmk-dp-panel__cell {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: var(--dmk-color-text);
  font-size: 13px;
  cursor: pointer;
}

.dmk-dp-panel__cell:hover:not(.is-disabled) {
  background: var(--dmk-color-fill);
}

.dmk-dp-panel__cell.is-outside {
  opacity: 0.5;
}

.dmk-dp-panel__cell.is-today {
  color: var(--dmk-color-primary);
  font-weight: 600;
}

.dmk-dp-panel__cell.is-picked {
  background: var(--dmk-color-primary);
  color: #fff;
  font-weight: 600;
}

.dmk-dp-panel__cell.is-disabled {
  color: var(--dmk-color-text-disabled, var(--dmk-color-text-muted));
  cursor: not-allowed;
  text-decoration: line-through;
}

.dmk-dp-panel__footer {
  padding-top: 8px;
  border-top: 1px solid var(--dmk-color-border-lighter, var(--dmk-color-border-subtle));
}

.dmk-dp-panel__summary {
  color: var(--dmk-color-text-muted);
  font-size: 12px;
}
</style>
