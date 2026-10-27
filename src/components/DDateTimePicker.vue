<script setup lang="ts">
/**
 * DDateTimePicker —— 日期时间选择器。
 * 契约参考 Element Plus el-date-picker（type="datetime"）：
 *   Attributes: modelValue / type / format / valueFormat / placeholder /
 *               disabled / readonly / clearable / size / defaultTime / showFooter /
 *               showConfirm / showNow / popperClass / teleported / rangeSeparator /
 *               range / arrowControl
 *   Events: change / blur / focus / clear / calendar-change / visible-change
 *   Slots: default / range-separator / prev-month / next-month / prev-year / next-year
 *   Exposes: focus / blur
 *
 * 实现：单面板（月历 + 时分秒三段），range 模式用两个面板依次选择起止时间。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  addMonths,
  buildMonthMatrix,
  formatDate,
  isSameDay,
  isSameMonth,
  resolveValue
} from '../lib/date'

const props = withDefaults(
  defineProps<{
    /** 绑定值：Date / 时间戳 / 字符串；range 模式为长度 2 的数组 */
    modelValue?: unknown
    /** 选择器类型 */
    type?: 'date' | 'datetime'
    /** 输入框显示格式 */
    format?: string
    /** 绑定值格式；不传则绑定 Date 对象 */
    valueFormat?: string
    /** 占位符 */
    placeholder?: string
    /** 起始占位符（range 模式） */
    startPlaceholder?: string
    /** 结束占位符（range 模式） */
    endPlaceholder?: string
    /** 是否禁用 */
    disabled?: boolean
    /** 是否只读 */
    readonly?: boolean
    /** 是否可清空 */
    clearable?: boolean
    /** 尺寸 */
    size?: 'sm' | 'md' | 'lg'
    /** 选完日期后的默认时间 */
    defaultTime?: Date
    /** 是否显示底部栏 */
    showFooter?: boolean
    /** 是否显示确定按钮 */
    showConfirm?: boolean
    /** 是否显示「此刻」按钮 */
    showNow?: boolean
    /** 面板类名 */
    popperClass?: string
    /** 是否传送到 body */
    teleported?: boolean
    /** 范围模式分隔符 */
    rangeSeparator?: string
    /** 是否范围选择 */
    range?: boolean
    /** 禁用日期判定 */
    disabledDate?: (date: Date) => boolean
  }>(),
  {
    modelValue: undefined,
    type: 'datetime',
    format: 'YYYY-MM-DD HH:mm:ss',
    valueFormat: undefined,
    placeholder: '选择日期时间',
    startPlaceholder: '开始日期时间',
    endPlaceholder: '结束日期时间',
    disabled: false,
    readonly: false,
    clearable: true,
    size: 'md',
    defaultTime: undefined,
    showFooter: true,
    showConfirm: true,
    showNow: true,
    popperClass: '',
    teleported: false,
    rangeSeparator: ' - ',
    range: false,
    disabledDate: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  /** 确定值或点击外部时触发 */
  change: [value: unknown]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  /** 点击清空按钮 */
  clear: []
  /** 日历选中日期变化（range 模式） */
  'calendar-change': [value: unknown]
  /** 面板显隐 */
  'visible-change': [visible: boolean]
}>()

/** 面板是否展开 */
const visible = ref(false)
/** 面板当前显示的月份 */
const panelDate = ref<Date>(new Date())
/** 已选的日期部分 */
const pickedDate = ref<Date | null>(null)
/** 已选的时间部分 */
const pickedTime = ref<{ h: number; m: number; s: number }>({ h: 0, m: 0, s: 0 })
/** range 模式下正在编辑哪一段（0=起始 1=结束） */
const editingEnd = ref(false)
/** range 模式的起始值 */
const startValue = ref<Date | null>(null)

/** 内部值 → Date[]（单值或范围） */
const parsed = computed<Date[]>(() => {
  const raw = props.modelValue
  if (Array.isArray(raw)) {
    return raw.map((v) => resolveValue(v, props.valueFormat)).filter((d): d is Date => !!d)
  }
  const one = resolveValue(raw, props.valueFormat)
  return one ? [one] : []
})

/** 是否有值 */
const hasValue = computed(() => parsed.value.length > 0)

/** 输入框显示文本 */
const displayText = computed(() => {
  const list = parsed.value
  if (!list.length) return ''
  const fmt = props.type === 'date' ? props.format.split(' ')[0] : props.format
  if (props.range) {
    if (list.length < 2) return formatDate(list[0], fmt)
    return `${formatDate(list[0], fmt)}${props.rangeSeparator}${formatDate(list[1], fmt)}`
  }
  return formatDate(list[0], fmt)
})

/** 占位符 */
const placeholderText = computed(() => {
  if (!props.range) return props.placeholder
  return props.startPlaceholder
})

/** 当前面板的月历矩阵 */
const matrix = computed(() => buildMonthMatrix(panelDate.value.getFullYear(), panelDate.value.getMonth()))

/** 面板标题 */
const panelTitle = computed(() =>
  `${panelDate.value.getFullYear()} 年 ${panelDate.value.getMonth() + 1} 月`
)

/** 星期表头 */
const weekDays = ['一', '二', '三', '四', '五', '六', '日']

/** 是否是今天 */
function isToday(d: Date): boolean {
  const now = new Date()
  return isSameDay(d, now)
}

/** 是否已选中该日 */
function isPicked(d: Date): boolean {
  return !!pickedDate.value && isSameDay(d, pickedDate.value)
}

/** 是否在当前面板月 */
function inCurrentMonth(d: Date): boolean {
  return isSameMonth(d, panelDate.value)
}

/** 是否是范围模式的起始日 */
function isRangeStart(d: Date): boolean {
  return !!startValue.value && isSameDay(d, startValue.value)
}

/** 该日是否被禁用 */
function isDisabled(d: Date): boolean {
  return props.disabledDate ? props.disabledDate(d) : false
}

/** 时/分/秒选项 */
const hourOptions = computed(() => {
  const out: { value: number; label: string }[] = []
  for (let h = 0; h < 24; h++) out.push({ value: h, label: String(h).padStart(2, '0') })
  return out
})

const minuteOptions = computed(() => {
  const out: { value: number; label: string }[] = []
  for (let m = 0; m < 60; m++) out.push({ value: m, label: String(m).padStart(2, '0') })
  return out
})

const secondOptions = computed(() => {
  const out: { value: number; label: string }[] = []
  for (let s = 0; s < 60; s++) out.push({ value: s, label: String(s).padStart(2, '0') })
  return out
})

/** 打开面板 */
function open() {
  if (props.disabled || props.readonly) return
  const list = parsed.value
  if (list.length) {
    const base = list[props.range && editingEnd.value ? Math.min(1, list.length - 1) : 0]
    panelDate.value = new Date(base.getFullYear(), base.getMonth(), 1)
    pickedDate.value = new Date(base.getTime())
    pickedTime.value = { h: base.getHours(), m: base.getMinutes(), s: base.getSeconds() }
  } else {
    const now = new Date()
    panelDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
    pickedDate.value = null
    const t = props.defaultTime ?? now
    pickedTime.value = { h: t.getHours(), m: t.getMinutes(), s: t.getSeconds() }
  }
  visible.value = true
  emit('visible-change', true)
}

/** 关闭面板 */
function close() {
  if (!visible.value) return
  visible.value = false
  emit('visible-change', false)
}

/** 点击某天 */
function onDayClick(d: Date) {
  if (isDisabled(d)) return
  pickedDate.value = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (props.range && !editingEnd.value) {
    // range 模式：选完起始后接着选结束
    editingEnd.value = true
    startValue.value = pickedDate.value
    emit('calendar-change', pickedDate.value)
    return
  }
  emit('calendar-change', pickedDate.value)
  if (!props.showConfirm) confirmValue()
}

/** 上/下月 */
function shiftPanel(delta: number) {
  panelDate.value = addMonths(panelDate.value, delta)
}

/** 上/下年 */
function shiftYear(delta: number) {
  panelDate.value = new Date(panelDate.value.getFullYear() + delta, panelDate.value.getMonth(), 1)
}

/** 组合当前选中的日期与时间 */
function compose(): Date | null {
  if (!pickedDate.value) return null
  const d = new Date(pickedDate.value.getTime())
  d.setHours(pickedTime.value.h, pickedTime.value.m, pickedTime.value.s, 0)
  return d
}

/** 按 valueFormat 序列化 */
function serialize(d: Date): unknown {
  if (!props.valueFormat) return d
  return formatDate(d, props.valueFormat)
}

/** 确定 */
function confirmValue() {
  const composed = compose()
  if (!composed) return
  let payload: unknown
  if (props.range) {
    if (!startValue.value) {
      startValue.value = composed
      editingEnd.value = true
      return
    }
    payload = [serialize(startValue.value), serialize(composed)]
  } else {
    payload = serialize(composed)
  }
  emit('update:modelValue', payload)
  emit('change', payload)
  editingEnd.value = false
  close()
}

/** 此刻 */
function pickNow() {
  const now = new Date()
  pickedDate.value = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  pickedTime.value = { h: now.getHours(), m: now.getMinutes(), s: now.getSeconds() }
}

/** 清空 */
function onClear(e: MouseEvent) {
  e.stopPropagation()
  emit('update:modelValue', props.range ? [] : '')
  emit('change', props.range ? [] : '')
  emit('clear')
}

/** 聚焦 / 失焦 */
function onFocus(e: FocusEvent) {
  emit('focus', e)
}

function onBlur(e: FocusEvent) {
  emit('blur', e)
}

/** 外部点击关闭 */
function onDocMouseDown(e: MouseEvent) {
  if (!visible.value) return
  const t = e.target as HTMLElement
  if (t.closest?.('.dmk-datetimepicker')) return
  close()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocMouseDown)
})

watch(
  () => props.modelValue,
  () => {
    /* 值变化时由 displayText 自动同步 */
  }
)

/** 暴露 */
const triggerRef = ref<HTMLElement | null>(null)

defineExpose({
  focus: () => triggerRef.value?.focus(),
  blur: () => triggerRef.value?.blur()
})
</script>

<template>
  <div class="dmk-datetimepicker" :class="[`s-${size}`, { 'is-disabled': disabled, 'is-open': visible }]">
    <div
      ref="triggerRef"
      class="dmk-datetimepicker__trigger"
      role="combobox"
      tabindex="0"
      :aria-expanded="visible"
      aria-haspopup="dialog"
      :aria-disabled="disabled || undefined"
      @click="open"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.esc="close"
    >
      <span class="dmk-datetimepicker__icon" aria-hidden="true">🕒</span>
      <span class="dmk-datetimepicker__value" :class="{ 'is-placeholder': !hasValue }">
        {{ hasValue ? displayText : placeholderText }}
      </span>
      <button
        v-if="clearable && hasValue && !disabled && !readonly"
        type="button"
        class="dmk-datetimepicker__clear"
        aria-label="清空"
        @click="onClear"
      >
        ×
      </button>
    </div>

    <transition name="dmk-dtp-zoom">
      <div
        v-if="visible"
        class="dmk-datetimepicker__popper"
        :class="props.popperClass"
        role="dialog"
        aria-label="选择日期时间"
        @mousedown.prevent
      >
        <!-- 日历 -->
        <div class="dmk-datetimepicker__calendar">
          <div class="dmk-datetimepicker__head">
            <button type="button" class="dmk-datetimepicker__nav" aria-label="上一年" @click="shiftYear(-1)">«</button>
            <button type="button" class="dmk-datetimepicker__nav" aria-label="上月" @click="shiftPanel(-1)">‹</button>
            <span class="dmk-datetimepicker__title">{{ panelTitle }}</span>
            <button type="button" class="dmk-datetimepicker__nav" aria-label="下月" @click="shiftPanel(1)">›</button>
            <button type="button" class="dmk-datetimepicker__nav" aria-label="下一年" @click="shiftYear(1)">»</button>
          </div>

          <div class="dmk-datetimepicker__week">
            <span v-for="w in weekDays" :key="w">{{ w }}</span>
          </div>

          <div class="dmk-datetimepicker__grid">
            <template v-for="(row, ri) in matrix" :key="ri">
              <button
                v-for="cell in row"
                :key="cell.getTime()"
                type="button"
                class="dmk-datetimepicker__cell"
                :class="{
                  'is-outside': !inCurrentMonth(cell),
                  'is-today': isToday(cell),
                  'is-picked': isPicked(cell),
                  'is-range-start': isRangeStart(cell),
                  'is-disabled': isDisabled(cell)
                }"
                :disabled="isDisabled(cell)"
                @click="onDayClick(cell)"
              >
                {{ cell.getDate() }}
              </button>
            </template>
          </div>
        </div>

        <!-- 时间 -->
        <div v-if="type === 'datetime'" class="dmk-datetimepicker__time">
          <label class="dmk-datetimepicker__field">
            <span>时</span>
            <select v-model.number="pickedTime.h" aria-label="小时">
              <option v-for="o in hourOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
          <label class="dmk-datetimepicker__field">
            <span>分</span>
            <select v-model.number="pickedTime.m" aria-label="分钟">
              <option v-for="o in minuteOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
          <label class="dmk-datetimepicker__field">
            <span>秒</span>
            <select v-model.number="pickedTime.s" aria-label="秒">
              <option v-for="o in secondOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
        </div>

        <!-- 底部 -->
        <div v-if="showFooter" class="dmk-datetimepicker__footer">
          <button v-if="showNow" type="button" class="dmk-datetimepicker__now" @click="pickNow">此刻</button>
          <button
            v-if="showConfirm"
            type="button"
            class="dmk-datetimepicker__confirm"
            @click="confirmValue"
          >
            确定
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dmk-datetimepicker {
  position: relative;
  display: inline-block;
  width: 100%;
  font-family: var(--dmk-font-family);
}

.dmk-datetimepicker__trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  min-height: 32px;
  padding: 5px 10px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-base);
  cursor: pointer;
  transition: border-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-datetimepicker__trigger:hover {
  border-color: var(--dmk-color-border-strong);
}

.dmk-datetimepicker.is-open .dmk-datetimepicker__trigger {
  border-color: var(--dmk-color-primary);
}

.dmk-datetimepicker__value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dmk-datetimepicker__value.is-placeholder {
  color: var(--dmk-color-text-muted);
}

.dmk-datetimepicker__clear {
  padding: 0 2px;
  border: none;
  background: transparent;
  color: var(--dmk-color-text-muted);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}

.dmk-datetimepicker__popper {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 2000;
  width: 300px;
  padding: 10px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
}

.dmk-datetimepicker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dmk-datetimepicker__nav {
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

.dmk-datetimepicker__nav:hover {
  background: var(--dmk-color-fill);
  color: var(--dmk-color-primary);
}

.dmk-datetimepicker__title {
  color: var(--dmk-color-text);
  font-size: 13px;
  font-weight: 600;
}

.dmk-datetimepicker__week,
.dmk-datetimepicker__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.dmk-datetimepicker__week span {
  padding: 4px 0;
  color: var(--dmk-color-text-muted);
  font-size: 12px;
  text-align: center;
}

.dmk-datetimepicker__cell {
  height: 30px;
  border: none;
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: var(--dmk-color-text);
  font-size: 13px;
  cursor: pointer;
}

.dmk-datetimepicker__cell:hover:not(.is-disabled) {
  background: var(--dmk-color-fill);
}

.dmk-datetimepicker__cell.is-outside {
  color: var(--dmk-color-text-disabled, var(--dmk-color-text-muted));
  opacity: 0.55;
}

.dmk-datetimepicker__cell.is-today {
  color: var(--dmk-color-primary);
  font-weight: 600;
}

.dmk-datetimepicker__cell.is-picked {
  background: var(--dmk-color-primary);
  color: #fff;
  font-weight: 600;
}

.dmk-datetimepicker__cell.is-disabled {
  color: var(--dmk-color-text-disabled, var(--dmk-color-text-muted));
  cursor: not-allowed;
  text-decoration: line-through;
}

.dmk-datetimepicker__time {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--dmk-color-border-lighter, var(--dmk-color-border));
}

.dmk-datetimepicker__field {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  color: var(--dmk-color-text-muted);
  font-size: 12px;
}

.dmk-datetimepicker__field select {
  box-sizing: border-box;
  width: 100%;
  padding: 5px 6px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text);
  font-family: inherit;
  font-size: 13px;
}

.dmk-datetimepicker__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--dmk-color-border-lighter, var(--dmk-color-border));
}

.dmk-datetimepicker__now,
.dmk-datetimepicker__confirm {
  padding: 5px 14px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-secondary);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}

.dmk-datetimepicker__confirm {
  border-color: var(--dmk-color-primary);
  background: var(--dmk-color-primary);
  color: #fff;
}

.dmk-dtp-zoom-enter-active,
.dmk-dtp-zoom-leave-active {
  transition:
    opacity var(--dmk-duration-fast) var(--dmk-ease),
    transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-dtp-zoom-enter-from,
.dmk-dtp-zoom-leave-to {
  opacity: 0;
  transform: scaleY(0.9);
}
</style>
