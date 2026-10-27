<script setup lang="ts">
/**
 * DTimePicker —— 时间选择器（对齐 Element Plus TimePicker 核心能力）。
 * ---------------------------------------------------------------------------
 * 能力：is-range 时间范围 · arrow-control 箭头调节 · disabled-hours/minutes/seconds
 *       禁用可选时段 · step 步进（分钟）· format/value-format · clearable
 * 设计：三列滚轮（时/分/秒）；arrow-control 模式下每列带上下箭头；
 *       键盘 ↑↓ 在当前列内移动，Enter 确认，Esc 关闭；aria：listbox + option。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { formatDate, timeToDate } from '../lib/date'

/** 时间值：时/分/秒 */
type TimeValue = { h: number; m: number; s: number }

type Size = 'sm' | 'md' | 'lg'
type Status = 'default' | 'error' | 'success' | 'warning'

const props = withDefaults(
  defineProps<{
    modelValue?: string | Date | Array<string | Date | null> | null
    isRange?: boolean
    arrowControl?: boolean
    disabledHours?: () => number[]
    disabledMinutes?: (hour: number) => number[]
    disabledSeconds?: (hour: number, minute: number) => number[]
    step?: number
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
  }>(),
  {
    modelValue: null,
    isRange: false,
    arrowControl: false,
    disabledHours: undefined,
    disabledMinutes: undefined,
    disabledSeconds: undefined,
    step: 1,
    format: 'HH:mm:ss',
    valueFormat: 'HH:mm:ss',
    placeholder: '请选择时间',
    startPlaceholder: '开始时间',
    endPlaceholder: '结束时间',
    rangeSeparator: '~',
    disabled: false,
    clearable: true,
    size: 'md',
    status: 'default'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  change: [value: unknown]
  clear: []
  focus: []
  blur: []
  'visible-change': [visible: boolean]
}>()

const uid = `dmk-timepicker-${Math.random().toString(36).slice(2, 8)}`

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const visible = ref(false)
/** 范围模式下正在编辑的一侧：0=开始 1=结束 */
const activeSide = ref<0 | 1>(0)
/** 当前编辑中的时分秒 */
const draft = ref({ h: 0, m: 0, s: 0 })

const isRange = computed(() => props.isRange)

/* ---------------------------------------------------------------- 值解析 */

function parseTime(v: unknown): { h: number; m: number; s: number } | null {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date) return { h: v.getHours(), m: v.getMinutes(), s: v.getSeconds() }
  if (typeof v === 'number') {
    const d = new Date(v < 1e11 ? v * 1000 : v)
    return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() }
  }
  if (typeof v === 'string') {
    const m = v.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/)
    if (m) return { h: Number(m[1]), m: Number(m[2]), s: Number(m[3] ?? 0) }
  }
  return null
}

/** 单值 */
const single = computed(() => {
  if (isRange.value) return null
  const v = props.modelValue
  if (Array.isArray(v)) return parseTime(v[0])
  return parseTime(v)
})

/** 范围 */
const range = computed<{ start: TimeValue | null; end: TimeValue | null }>(() => {
  if (!isRange.value) return { start: null, end: null }
  const v = props.modelValue
  const arr = Array.isArray(v) ? v : []
  return { start: parseTime(arr[0]), end: parseTime(arr[1]) }
})

const hasValue = computed(() => {
  if (isRange.value) return !!(range.value.start || range.value.end)
  return !!single.value
})

function fmt(t: TimeValue | null): string {
  if (!t) return ''
  return formatDate(timeToDate(`${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}:${String(t.s).padStart(2, '0')}`), props.format)
}

const displayText = computed(() => {
  if (isRange.value) {
    const s = fmt(range.value.start)
    const e = fmt(range.value.end)
    return `${s} ${props.rangeSeparator} ${e}`.trim()
  }
  return fmt(single.value)
})

const placeholderText = computed(() =>
  isRange.value ? `${props.startPlaceholder} ${props.rangeSeparator} ${props.endPlaceholder}` : props.placeholder
)

/* ---------------------------------------------------------------- 选项列 */

function disabledHoursList(): number[] {
  if (!props.disabledHours) return []
  try {
    return props.disabledHours() ?? []
  } catch {
    return []
  }
}

function disabledMinutesList(hour: number): number[] {
  if (!props.disabledMinutes) return []
  try {
    return props.disabledMinutes(hour) ?? []
  } catch {
    return []
  }
}

function disabledSecondsList(hour: number, minute: number): number[] {
  if (!props.disabledSeconds) return []
  try {
    return props.disabledSeconds(hour, minute) ?? []
  } catch {
    return []
  }
}

const hourOptions = computed(() =>
  Array.from({ length: 24 }, (_, i) => ({ v: i, label: String(i).padStart(2, '0'), disabled: disabledHoursList().includes(i) }))
)

const minuteOptions = computed(() =>
  Array.from({ length: 60 }, (_, i) => ({ v: i, label: String(i).padStart(2, '0'), disabled: disabledMinutesList(draft.value.h).includes(i) }))
    .filter((o) => o.v % Math.max(1, props.step) === 0)
)

const secondOptions = computed(() =>
  Array.from({ length: 60 }, (_, i) => ({ v: i, label: String(i).padStart(2, '0'), disabled: disabledSecondsList(draft.value.h, draft.value.m).includes(i) }))
    .filter((o) => o.v % Math.max(1, props.step) === 0)
)

/* ---------------------------------------------------------------- 交互 */

function open() {
  if (props.disabled || visible.value) return
  visible.value = true
  activeSide.value = 0
  const t = isRange.value ? range.value.start : single.value
  draft.value = t ? { ...t } : { h: 0, m: 0, s: 0 }
  emit('visible-change', true)
}

function close() {
  if (!visible.value) return
  visible.value = false
  emit('visible-change', false)
}

function toggle() {
  visible.value ? close() : open()
}

function toValue(t: TimeValue): string {
  const d = timeToDate(`${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}:${String(t.s).padStart(2, '0')}`)
  return props.valueFormat ? formatDate(d, props.valueFormat) : formatDate(d, 'HH:mm:ss')
}

function commit(t: TimeValue) {
  if (isRange.value) {
    const start = activeSide.value === 0 ? t : range.value.start
    const end = activeSide.value === 1 ? t : range.value.end
    const out = [start ? toValue(start) : null, end ? toValue(end) : null]
    emit('update:modelValue', out)
    emit('change', out)
    // 第一次点完起点 → 自动切到结束侧
    if (activeSide.value === 0) activeSide.value = 1
  } else {
    const out = toValue(t)
    emit('update:modelValue', out)
    emit('change', out)
    close()
  }
}

function setHour(v: number) {
  draft.value = { ...draft.value, h: v }
  commit(draft.value)
}

function setMinute(v: number) {
  draft.value = { ...draft.value, m: v }
  commit(draft.value)
}

function setSecond(v: number) {
  draft.value = { ...draft.value, s: v }
  commit(draft.value)
}

/** 箭头调节：按步进上/下，越界回绕 */
function shift(kind: 'h' | 'm' | 's', dir: 1 | -1) {
  const max = kind === 'h' ? 24 : 60
  const cur = draft.value[kind]
  let next = (cur + dir + max) % max
  if (kind === 'm' || kind === 's') next = Math.floor(next / Math.max(1, props.step)) * Math.max(1, props.step)
  if (kind === 'h') draft.value = { ...draft.value, h: next }
  else if (kind === 'm') draft.value = { ...draft.value, m: next }
  else draft.value = { ...draft.value, s: next }
  commit(draft.value)
}

function onClear() {
  const empty = isRange.value ? [null, null] : null
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
    return
  }
  if (!visible.value) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    shift('m', -1)
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    shift('m', 1)
  }
}

watch(visible, (v) => {
  if (v) document.addEventListener('mousedown', onDocPointerDown, true)
  else document.removeEventListener('mousedown', onDocPointerDown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocPointerDown, true)
})

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
    class="dmk-timepicker"
    :class="[`s-${size}`, `st-${status}`, { 'is-disabled': disabled, 'is-open': visible }]"
  >
    <div
      ref="triggerRef"
      class="dmk-timepicker__trigger"
      role="combobox"
      tabindex="0"
      :aria-expanded="visible"
      aria-haspopup="dialog"
      :aria-controls="`${uid}-panel`"
      :aria-disabled="disabled || undefined"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="dmk-timepicker__icon" aria-hidden="true">🕐</span>
      <span class="dmk-timepicker__value" :class="{ 'is-placeholder': !hasValue }">
        {{ hasValue ? displayText : placeholderText }}
      </span>
      <span
        v-if="clearable && hasValue && !disabled"
        class="dmk-timepicker__clear"
        role="button"
        tabindex="-1"
        aria-label="清空"
        @click.stop="onClear"
        >×</span
      >
    </div>

    <transition name="dmk-timepicker-zoom">
      <div v-if="visible" :id="`${uid}-panel`" class="dmk-timepicker__popper" role="dialog" aria-label="选择时间" @mousedown.prevent>
        <div class="dmk-timepicker__columns">
          <!-- 时 -->
          <div class="dmk-timepicker__col">
            <div v-if="arrowControl" class="dmk-timepicker__arrow">
              <button type="button" aria-label="小时加一" @click="shift('h', 1)">▲</button>
              <button type="button" aria-label="小时减一" @click="shift('h', -1)">▼</button>
            </div>
            <ul class="dmk-timepicker__list" role="listbox" aria-label="小时">
              <li
                v-for="o in hourOptions"
                :key="o.v"
                class="dmk-timepicker__opt"
                :class="{ 'is-active': o.v === draft.h, 'is-disabled': o.disabled }"
                role="option"
                :aria-selected="o.v === draft.h"
                :aria-disabled="o.disabled || undefined"
                @click="!o.disabled && setHour(o.v)"
              >
                {{ o.label }}
              </li>
            </ul>
          </div>

          <span class="dmk-timepicker__sep" aria-hidden="true">:</span>

          <!-- 分 -->
          <div class="dmk-timepicker__col">
            <div v-if="arrowControl" class="dmk-timepicker__arrow">
              <button type="button" aria-label="分钟加一" @click="shift('m', 1)">▲</button>
              <button type="button" aria-label="分钟减一" @click="shift('m', -1)">▼</button>
            </div>
            <ul class="dmk-timepicker__list" role="listbox" aria-label="分钟">
              <li
                v-for="o in minuteOptions"
                :key="o.v"
                class="dmk-timepicker__opt"
                :class="{ 'is-active': o.v === draft.m, 'is-disabled': o.disabled }"
                role="option"
                :aria-selected="o.v === draft.m"
                :aria-disabled="o.disabled || undefined"
                @click="!o.disabled && setMinute(o.v)"
              >
                {{ o.label }}
              </li>
            </ul>
          </div>

          <span class="dmk-timepicker__sep" aria-hidden="true">:</span>

          <!-- 秒 -->
          <div class="dmk-timepicker__col">
            <div v-if="arrowControl" class="dmk-timepicker__arrow">
              <button type="button" aria-label="秒加一" @click="shift('s', 1)">▲</button>
              <button type="button" aria-label="秒减一" @click="shift('s', -1)">▼</button>
            </div>
            <ul class="dmk-timepicker__list" role="listbox" aria-label="秒">
              <li
                v-for="o in secondOptions"
                :key="o.v"
                class="dmk-timepicker__opt"
                :class="{ 'is-active': o.v === draft.s, 'is-disabled': o.disabled }"
                role="option"
                :aria-selected="o.v === draft.s"
                :aria-disabled="o.disabled || undefined"
                @click="!o.disabled && setSecond(o.v)"
              >
                {{ o.label }}
              </li>
            </ul>
          </div>
        </div>

        <p v-if="isRange" class="dmk-timepicker__hint">
          {{ activeSide === 0 ? '选择开始时间' : '选择结束时间' }}
        </p>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dmk-timepicker {
  position: relative;
  display: inline-block;
}

.dmk-timepicker__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 170px;
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

.dmk-timepicker__trigger:hover {
  border-color: var(--dmk-color-border-strong);
}

.dmk-timepicker__trigger:focus-visible {
  outline: none;
  border-color: var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-timepicker.is-disabled .dmk-timepicker__trigger {
  cursor: not-allowed;
  opacity: 0.6;
}

.dmk-timepicker__icon {
  font-size: 13px;
  line-height: 1;
}

.dmk-timepicker__value {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dmk-timepicker__value.is-placeholder {
  color: var(--dmk-color-text-muted);
}

.dmk-timepicker__clear {
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

.dmk-timepicker__clear:hover {
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-text);
}

.dmk-timepicker.s-sm .dmk-timepicker__trigger {
  height: var(--dmk-control-height-sm);
  font-size: var(--dmk-font-sm);
}

.dmk-timepicker.s-lg .dmk-timepicker__trigger {
  height: var(--dmk-control-height-lg);
  font-size: var(--dmk-font-lg);
}

.dmk-timepicker.st-error .dmk-timepicker__trigger {
  border-color: var(--dmk-color-danger);
}

.dmk-timepicker.st-success .dmk-timepicker__trigger {
  border-color: var(--dmk-color-success);
}

.dmk-timepicker.st-warning .dmk-timepicker__trigger {
  border-color: var(--dmk-color-warning);
}

/* ---------- 弹层 ---------- */
.dmk-timepicker__popper {
  position: absolute;
  z-index: var(--dmk-z-popup);
  top: calc(100% + 6px);
  left: 0;
  padding: 10px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
}

.dmk-timepicker__columns {
  display: flex;
  align-items: stretch;
  gap: 4px;
}

.dmk-timepicker__col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dmk-timepicker__list {
  width: 56px;
  max-height: 180px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  border: 1px solid var(--dmk-color-border-subtle);
  border-radius: var(--dmk-radius-sm);
}

.dmk-timepicker__opt {
  padding: 6px 0;
  text-align: center;
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-sm);
  cursor: pointer;
}

.dmk-timepicker__opt:hover:not(.is-disabled) {
  background: var(--dmk-color-surface-hover);
}

.dmk-timepicker__opt.is-active {
  background: var(--dmk-color-primary);
  color: var(--dmk-color-on-primary);
  font-weight: 600;
}

.dmk-timepicker__opt.is-disabled {
  color: var(--dmk-color-text-muted);
  cursor: not-allowed;
  opacity: 0.45;
}

.dmk-timepicker__sep {
  align-self: center;
  color: var(--dmk-color-text-secondary);
  font-weight: 600;
}

.dmk-timepicker__arrow {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.dmk-timepicker__arrow button {
  width: 22px;
  height: 18px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-secondary);
  font-size: 9px;
  line-height: 1;
  cursor: pointer;
}

.dmk-timepicker__arrow button:hover {
  border-color: var(--dmk-color-primary);
  color: var(--dmk-color-primary);
}

.dmk-timepicker__hint {
  margin: 8px 0 0;
  text-align: center;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
}

.dmk-timepicker-zoom-enter-active,
.dmk-timepicker-zoom-leave-active {
  transition:
    opacity var(--dmk-duration-fast) var(--dmk-ease),
    transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-timepicker-zoom-enter-from,
.dmk-timepicker-zoom-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
