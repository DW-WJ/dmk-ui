<script setup lang="ts">
/**
 * DTimeSelect —— 时间选择（Select 风格的固定时间选项）。
 * ---------------------------------------------------------------------------
 * 对齐 Element Plus TimeSelect：按 start/end/min-time/max-time/step 生成候选项，
 * 下拉列表内键盘可达（↑↓ 移动、Enter 选中、Esc 关闭），与 DSelect 交互一致。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { buildTimeOptions, formatDate, timeToDate } from '../lib/date'

type Size = 'sm' | 'md' | 'lg'
type Status = 'default' | 'error' | 'success' | 'warning'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    /** 可选起始时间（HH:mm） */
    start?: string
    /** 可选结束时间（HH:mm） */
    end?: string
    /** 最早可选时间（HH:mm），与 start 取更严的 */
    minTime?: string
    /** 最晚可选时间（HH:mm），与 end 取更严的 */
    maxTime?: string
    /** 步进（分钟） */
    step?: number
    format?: string
    valueFormat?: string
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    size?: Size
    status?: Status
  }>(),
  {
    modelValue: null,
    start: '09:00',
    end: '18:00',
    minTime: undefined,
    maxTime: undefined,
    step: 30,
    format: 'HH:mm',
    valueFormat: 'HH:mm',
    placeholder: '请选择时间',
    disabled: false,
    clearable: true,
    size: 'md',
    status: 'default'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  change: [value: string | null]
  clear: []
  'visible-change': [visible: boolean]
}>()

const uid = `dmk-timeselect-${Math.random().toString(36).slice(2, 8)}`
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const visible = ref(false)
const hoverIndex = ref(-1)

/** 生效的时间窗口：start/end 与 min-time/max-time 取交集 */
const window = computed(() => {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  let begin = toMin(props.start)
  let end = toMin(props.end)
  if (props.minTime) begin = Math.max(begin, toMin(props.minTime))
  if (props.maxTime) end = Math.min(end, toMin(props.maxTime))
  return { begin, end }
})

const options = computed(() => {
  const beginHour = Math.floor(window.value.begin / 60)
  const endHour = Math.ceil(window.value.end / 60)
  const list = buildTimeOptions(beginHour, endHour, Math.max(1, props.step))
  return list.filter((o) => {
    const [h, m] = o.value.split(':').map(Number)
    const total = h * 60 + m
    return total >= window.value.begin && total <= window.value.end
  })
})

const hasValue = computed(() => !!props.modelValue)

const displayText = computed(() => {
  if (!props.modelValue) return ''
  const d = timeToDate(props.modelValue)
  return formatDate(d, props.format)
})

const listboxId = `${uid}-listbox`
const optionId = (i: number) => `${uid}-option-${i}`

function open() {
  if (props.disabled || visible.value) return
  visible.value = true
  const idx = options.value.findIndex((o) => o.value === props.modelValue)
  hoverIndex.value = idx >= 0 ? idx : 0
  emit('visible-change', true)
}

function close() {
  if (!visible.value) return
  visible.value = false
  hoverIndex.value = -1
  emit('visible-change', false)
}

function toggle() {
  visible.value ? close() : open()
}

function onSelect(value: string) {
  emit('update:modelValue', value)
  emit('change', value)
  close()
  triggerRef.value?.focus()
}

function onClear() {
  emit('update:modelValue', null)
  emit('change', null)
  emit('clear')
  close()
}

function onDocPointerDown(e: MouseEvent) {
  const root = rootRef.value
  if (root && !root.contains(e.target as Node)) close()
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (!visible.value) open()
      else hoverIndex.value = Math.min(options.value.length - 1, hoverIndex.value + 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      if (!visible.value) open()
      else hoverIndex.value = Math.max(0, hoverIndex.value - 1)
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      if (!visible.value) open()
      else if (hoverIndex.value >= 0) {
        const opt = options.value[hoverIndex.value]
        if (opt) onSelect(opt.value)
      }
      break
    case 'Escape':
      if (visible.value) {
        e.preventDefault()
        close()
      }
      break
    case 'Tab':
      close()
      break
  }
}

watch(visible, (v) => {
  if (v) document.addEventListener('mousedown', onDocPointerDown, true)
  else document.removeEventListener('mousedown', onDocPointerDown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocPointerDown, true)
})

/* ---------- exposes（Element Plus 同款） ---------- */
function focus() {
  triggerRef.value?.focus()
}
function blur() {
  triggerRef.value?.blur()
  close()
}

defineExpose({ focus, blur })
</script>

<template>
  <div
    ref="rootRef"
    class="dmk-timeselect"
    :class="[`s-${size}`, `st-${status}`, { 'is-disabled': disabled, 'is-open': visible }]"
  >
    <div
      ref="triggerRef"
      class="dmk-timeselect__trigger"
      role="combobox"
      tabindex="0"
      :aria-expanded="visible"
      :aria-controls="listboxId"
      :aria-disabled="disabled || undefined"
      :aria-activedescendant="visible && hoverIndex >= 0 ? optionId(hoverIndex) : undefined"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="dmk-timeselect__value" :class="{ 'is-placeholder': !hasValue }">
        {{ hasValue ? displayText : placeholder }}
      </span>
      <span
        v-if="clearable && hasValue && !disabled"
        class="dmk-timeselect__clear"
        role="button"
        tabindex="-1"
        aria-label="清空"
        @click.stop="onClear"
        >×</span
      >
      <svg class="dmk-timeselect__arrow" :class="{ 'is-open': visible }" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>

    <transition name="dmk-timeselect-zoom">
      <div v-if="visible" :id="listboxId" class="dmk-timeselect__popper" role="listbox" @mousedown.prevent>
        <div v-if="!options.length" class="dmk-timeselect__empty" aria-hidden="true">暂无时间</div>
        <div
          v-for="(opt, i) in options"
          :id="optionId(i)"
          :key="opt.value"
          class="dmk-timeselect__option"
          :class="{ 'is-hover': i === hoverIndex, 'is-selected': opt.value === modelValue }"
          role="option"
          :aria-selected="opt.value === modelValue"
          @click="onSelect(opt.value)"
          @mouseenter="hoverIndex = i"
        >
          {{ opt.label }}
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dmk-timeselect {
  position: relative;
  display: inline-block;
}

.dmk-timeselect__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 130px;
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

.dmk-timeselect__trigger:hover {
  border-color: var(--dmk-color-border-strong);
}

.dmk-timeselect__trigger:focus-visible {
  outline: none;
  border-color: var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-timeselect.is-disabled .dmk-timeselect__trigger {
  cursor: not-allowed;
  opacity: 0.6;
}

.dmk-timeselect__value {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dmk-timeselect__value.is-placeholder {
  color: var(--dmk-color-text-muted);
}

.dmk-timeselect__clear {
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

.dmk-timeselect__clear:hover {
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-text);
}

.dmk-timeselect.s-sm .dmk-timeselect__trigger {
  height: var(--dmk-control-height-sm);
  font-size: var(--dmk-font-sm);
}

.dmk-timeselect.s-lg .dmk-timeselect__trigger {
  height: var(--dmk-control-height-lg);
  font-size: var(--dmk-font-lg);
}

.dmk-timeselect.st-error .dmk-timeselect__trigger {
  border-color: var(--dmk-color-danger);
}

.dmk-timeselect.st-success .dmk-timeselect__trigger {
  border-color: var(--dmk-color-success);
}

.dmk-timeselect.st-warning .dmk-timeselect__trigger {
  border-color: var(--dmk-color-warning);
}

.dmk-timeselect__popper {
  position: absolute;
  z-index: var(--dmk-z-popup);
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
}

.dmk-timeselect__option {
  padding: 7px 10px;
  border-radius: var(--dmk-radius-sm);
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-sm);
  cursor: pointer;
}

.dmk-timeselect__option:hover,
.dmk-timeselect__option.is-hover {
  background: var(--dmk-color-surface-hover);
}

.dmk-timeselect__option.is-selected {
  color: var(--dmk-color-primary);
  font-weight: 600;
}

.dmk-timeselect__empty {
  padding: 10px;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
  text-align: center;
}

.dmk-timeselect-zoom-enter-active,
.dmk-timeselect-zoom-leave-active {
  transition:
    opacity var(--dmk-duration-fast) var(--dmk-ease),
    transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-timeselect-zoom-enter-from,
.dmk-timeselect-zoom-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
