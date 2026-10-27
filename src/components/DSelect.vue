<script setup lang="ts">
/**
 * DSelect —— 自绘下拉选择器（不用原生 select）。
 * ---------------------------------------------------------------------------
 * 基础：触发器视觉与 DInput 完全一致（描边/尺寸/状态/焦点环）；弹层绝对定位，z-index 用
 *       --dmk-z-popup；点外部 / Esc 关闭，↑↓ 移动高亮，Enter 选中后关闭；
 *       aria：combobox + listbox + option + aria-expanded / aria-activedescendant。
 * 2026-10-26（Element Plus API 对齐 A+B 批）：
 *   A 批 · 原生属性透传（id/name/tabindex/ariaLabel/autocomplete）+ 七插槽
 *         （option/header/footer/prefix/empty/loading/label）+ exposes
 *         （focus/blur/selectedLabel）+ focus/blur/popup-scroll 事件。
 *   B 批 · 可搜索与多选：filterable / remote + remote-method / multiple /
 *         collapse-tags + max-collapse-tags / allow-create / value-key /
 *         reserve-keyword / default-first-option / no-data-text / no-match-text。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type Size = 'sm' | 'md' | 'lg'
type Status = 'default' | 'error' | 'success' | 'warning'
import type { SelectOption, SelectValue } from '../lib/select'

const props = withDefaults(
  defineProps<{
    modelValue?: SelectValue | SelectValue[] | null
    options?: SelectOption[]
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    loading?: boolean
    size?: Size
    status?: Status
    id?: string
    name?: string
    tabindex?: number | string
    ariaLabel?: string
    autocomplete?: string
    /** 可搜索：下拉内输入过滤 */
    filterable?: boolean
    /** 远程模式：候选由 remoteMethod 提供 */
    remote?: boolean
    remoteMethod?: (query: string) => void
    /** 多选：v-model 为数组，选中不关闭面板 */
    multiple?: boolean
    /** 多选时把已选折叠成文字 */
    collapseTags?: boolean
    /** 折叠后最多显示几个 tag */
    maxCollapseTags?: number
    /** 折叠标签悬浮显示全部 */
    collapseTagsTooltip?: boolean
    /** 允许创建新选项（需 filterable） */
    allowCreate?: boolean
    /** 回车优先选中第一个匹配项 */
    defaultFirstOption?: boolean
    /** 对象型 value 的唯一标识字段 */
    valueKey?: string
    /** 多选 + 可搜索时保留搜索词 */
    reserveKeyword?: boolean
    noDataText?: string
    noMatchText?: string
    /** 聚焦时自动展开 */
    automaticDropdown?: boolean
  }>(),
  {
    modelValue: null,
    options: () => [],
    placeholder: '请选择',
    disabled: false,
    clearable: false,
    loading: false,
    size: 'md',
    status: 'default',
    id: undefined,
    name: undefined,
    tabindex: undefined,
    ariaLabel: undefined,
    autocomplete: undefined,
    filterable: false,
    remote: false,
    remoteMethod: undefined,
    multiple: false,
    collapseTags: false,
    maxCollapseTags: 1,
    collapseTagsTooltip: false,
    allowCreate: false,
    defaultFirstOption: false,
    valueKey: undefined,
    reserveKeyword: false,
    noDataText: '暂无数据',
    noMatchText: '无匹配数据',
    automaticDropdown: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: SelectValue | SelectValue[] | '']
  change: [value: SelectValue | SelectValue[] | '']
  'visible-change': [visible: boolean]
  clear: []
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
  'popup-scroll': [e: Event]
  'remove-tag': [value: SelectValue]
  create: [value: string]
}>()

const uid = `dmk-select-${Math.random().toString(36).slice(2, 8)}`

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const visible = ref(false)
const hoverIndex = ref(-1)
/** 可搜索时的输入词 */
const query = ref('')

const listboxId = `${uid}-listbox`
const optionId = (i: number) => `${uid}-option-${i}`

/* ---------------------------------------------------------------- 值归一 */

/** 多选时 v-model 是数组；单选时是单值 */
const selectedValues = computed<SelectValue[]>(() => {
  if (props.multiple) {
    if (Array.isArray(props.modelValue)) return props.modelValue
    return props.modelValue === null || props.modelValue === '' ? [] : [props.modelValue]
  }
  return []
})

const singleValue = computed<SelectValue | ''>(() => {
  if (props.multiple) return ''
  if (Array.isArray(props.modelValue)) return props.modelValue.length ? props.modelValue[0] : ''
  return props.modelValue === null || props.modelValue === undefined ? '' : (props.modelValue as SelectValue)
})

/** 单选时选中项的展示文本（对象型 value 走 label 兜底） */
const singleLabel = computed(() => selectedOptions.value[0]?.label ?? (singleValue.value === '' ? '' : labelOf(singleValue.value)))

/** 取选项的唯一标识：valueKey 存在时从对象型 value 上取 */
function keyOf(opt: SelectOption): unknown {
  if (props.valueKey && opt.value && typeof opt.value === 'object') {
    return (opt.value as Record<string, unknown>)[props.valueKey]
  }
  return opt.value
}

function valueKeyOf(v: unknown): unknown {
  if (props.valueKey && v && typeof v === 'object') {
    return (v as Record<string, unknown>)[props.valueKey]
  }
  return v
}

/** 展示用文本：对象型 value 取 label 字段兜底 */
function labelOf(v: unknown): string {
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return typeof o.label === 'string' ? o.label : String(o[props.valueKey ?? 'id'] ?? '')
  }
  return String(v)
}

function isSelected(opt: SelectOption): boolean {
  if (props.multiple) {
    const k = keyOf(opt)
    return selectedValues.value.some((v) => valueKeyOf(v) === k)
  }
  return valueKeyOf(singleValue.value) === keyOf(opt)
}

const selectedOptions = computed(() => props.options.filter((o) => isSelected(o)))

/* ---------------------------------------------------------------- 过滤 */

const matchedOptions = computed(() => {
  if (!props.filterable || props.remote) return props.options
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.label.toLowerCase().includes(q))
})

/** allow-create：输入词匹配不到任何选项时，可创建 */
const canCreate = computed(
  () => props.allowCreate && props.filterable && query.value.trim() !== '' && matchedOptions.value.length === 0
)

/* ---------------------------------------------------------------- 展示 */

const hasValue = computed(() => (props.multiple ? selectedValues.value.length > 0 : singleValue.value !== ''))

const displayText = computed(() => {
  if (props.multiple) {
    const labels = selectedOptions.value.map((o) => o.label)
    if (!labels.length) return ''
    if (props.collapseTags && labels.length > props.maxCollapseTags) {
      const shown = labels.slice(0, props.maxCollapseTags)
      return `${shown.join('、')} +${labels.length - shown.length}`
    }
    return labels.join('、')
  }
  return singleLabel.value
})

/* ---------------------------------------------------------------- 交互 */

function open() {
  if (props.disabled || visible.value) return
  visible.value = true
  if (!props.multiple) query.value = ''
  const idx = matchedOptions.value.findIndex((o) => isSelected(o))
  hoverIndex.value = idx >= 0 ? idx : nextEnabled(-1, 1)
  emit('visible-change', true)
  if (props.filterable) requestAnimationFrame(() => searchRef.value?.focus())
}

function close() {
  if (!visible.value) return
  visible.value = false
  hoverIndex.value = -1
  if (props.filterable && !props.reserveKeyword) query.value = ''
  emit('visible-change', false)
}

function toggle() {
  visible.value ? close() : open()
}

function nextEnabled(from: number, step: 1 | -1): number {
  const n = matchedOptions.value.length
  if (!n) return -1
  let i = from
  for (let k = 0; k < n; k += 1) {
    i = (i + step + n) % n
    if (!matchedOptions.value[i]?.disabled) return i
  }
  return -1
}

/** 单选：替换；多选：切换 */
function onSelect(opt: SelectOption, index: number) {
  if (opt.disabled) return
  hoverIndex.value = index
  if (props.multiple) {
    const next = [...selectedValues.value]
    const k = keyOf(opt)
    const idx = next.findIndex((v) => valueKeyOf(v) === k)
    if (idx >= 0) next.splice(idx, 1)
    else next.push(opt.value)
    emit('update:modelValue', next)
    emit('change', next)
    return // 多选不关闭面板
  }
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  close()
  triggerRef.value?.focus()
}

/** allow-create：把输入词作为新选项提交 */
function onCreate() {
  const text = query.value.trim()
  if (!text) return
  emit('create', text)
  emit('update:modelValue', text)
  emit('change', text)
  query.value = ''
  close()
}

function onClear() {
  const empty = props.multiple ? [] : ''
  emit('update:modelValue', empty)
  emit('change', empty)
  emit('clear')
  close()
}

/** 移除单个已选项（多选） */
function onRemoveTag(val: SelectValue, e: MouseEvent) {
  e.stopPropagation()
  const k = valueKeyOf(val)
  const next = selectedValues.value.filter((v) => valueKeyOf(v) !== k)
  emit('update:modelValue', next)
  emit('change', next)
  emit('remove-tag', val)
}

function onSearchInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  query.value = v
  hoverIndex.value =
    props.defaultFirstOption && matchedOptions.value.length ? 0 : nextEnabled(-1, 1)
  if (props.remote && props.remoteMethod) props.remoteMethod(v)
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
      else hoverIndex.value = nextEnabled(hoverIndex.value, 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      if (!visible.value) open()
      else hoverIndex.value = nextEnabled(hoverIndex.value, -1)
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      if (!visible.value) {
        open()
      } else if (canCreate.value) {
        onCreate()
      } else if (hoverIndex.value >= 0) {
        const opt = matchedOptions.value[hoverIndex.value]
        if (opt) onSelect(opt, hoverIndex.value)
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

/** 多选：已选项打勾展示（点击 × 移除单个） */
function onTriggerClick() {
  if (props.filterable && !props.multiple) {
    open()
    requestAnimationFrame(() => searchRef.value?.focus())
    return
  }
  toggle()
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
  if (props.filterable) searchRef.value?.focus()
  else triggerRef.value?.focus()
}
function blur() {
  searchRef.value?.blur()
  triggerRef.value?.blur()
  close()
}
function selectedLabel(): string {
  return displayText.value
}

defineExpose({ focus, blur, selectedLabel })
</script>

<template>
  <div
    ref="rootRef"
    class="dmk-select"
    :class="[`s-${size}`, `st-${status}`, { 'is-disabled': disabled, 'is-open': visible, 'is-multiple': multiple }]"
  >
    <div
      ref="triggerRef"
      class="dmk-select__trigger"
      role="combobox"
      :tabindex="tabindex ?? 0"
      :aria-expanded="visible"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      :aria-disabled="disabled || undefined"
      :aria-activedescendant="visible && hoverIndex >= 0 ? optionId(hoverIndex) : undefined"
      :aria-invalid="status === 'error' ? 'true' : undefined"
      :id="id"
      :name="name"
      :aria-label="ariaLabel"
      :autocomplete="autocomplete"
      @click="onTriggerClick"
      @keydown="onKeydown"
      @focus="(e) => emit('focus', e)"
      @blur="(e) => emit('blur', e)"
    >
      <span v-if="$slots.prefix" class="dmk-select__prefix">
        <slot name="prefix" />
      </span>

      <!-- 可搜索：触发器内嵌输入框 -->
      <input
        v-if="filterable"
        ref="searchRef"
        class="dmk-select__search"
        :value="query"
        :placeholder="hasValue ? displayText : placeholder"
        :disabled="disabled"
        :aria-label="ariaLabel || placeholder"
        @input="onSearchInput"
        @click.stop="open"
        @focus="(e) => { emit('focus', e); if (automaticDropdown) open() }"
      />
      <template v-else>
        <span class="dmk-select__value" :class="{ 'is-placeholder': !hasValue }">
          <slot name="label" :label="displayText" :option="selectedOptions[0]">
            {{ hasValue ? displayText : placeholder }}
          </slot>
        </span>
      </template>

      <!-- 多选：已选项以 tag 展示（可单独删除） -->
      <span v-if="multiple && hasValue && !filterable" class="dmk-select__tags">
        <template v-if="collapseTags && selectedOptions.length > maxCollapseTags">
          <span
            v-for="o in selectedOptions.slice(0, maxCollapseTags)"
            :key="String(keyOf(o))"
            class="dmk-select__tag"
            :title="collapseTagsTooltip ? selectedOptions.map((x) => x.label).join('、') : undefined"
          >
            {{ o.label }}
            <span class="dmk-select__tag-x" role="button" tabindex="-1" aria-label="移除" @click="onRemoveTag(o.value, $event)">×</span>
          </span>
          <span
            class="dmk-select__tag"
            :title="collapseTagsTooltip ? selectedOptions.map((x) => x.label).join('、') : undefined"
          >
            +{{ selectedOptions.length - maxCollapseTags }}
          </span>
        </template>
        <template v-else>
          <span v-for="o in selectedOptions" :key="String(keyOf(o))" class="dmk-select__tag">
            {{ o.label }}
            <span class="dmk-select__tag-x" role="button" tabindex="-1" aria-label="移除" @click="onRemoveTag(o.value, $event)">×</span>
          </span>
        </template>
      </span>

      <span v-if="loading" class="dmk-select__spinner-wrap" aria-hidden="true">
        <slot name="loading"><span class="dmk-select__spinner" /></slot>
      </span>
      <span
        v-if="clearable && hasValue && !disabled"
        class="dmk-select__clear"
        role="button"
        tabindex="-1"
        aria-label="清空"
        @click.stop="onClear"
        >×</span
      >
      <svg
        class="dmk-select__arrow"
        :class="{ 'is-open': visible }"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path
          d="M2 4l4 4 4-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <transition name="dmk-select-zoom">
      <div
        v-if="visible"
        :id="listboxId"
        class="dmk-select__popper"
        role="listbox"
        :aria-multiselectable="multiple || undefined"
        @mousedown.prevent
        @scroll="(e) => emit('popup-scroll', e)"
      >
        <div v-if="$slots.header" class="dmk-select__header">
          <slot name="header" />
        </div>

        <div v-if="loading && !options.length" class="dmk-select__empty" aria-hidden="true">
          <slot name="loading">加载中…</slot>
        </div>
        <div v-else-if="!options.length" class="dmk-select__empty" aria-hidden="true">
          <slot name="empty">{{ noDataText }}</slot>
        </div>
        <div v-else-if="!matchedOptions.length" class="dmk-select__empty" aria-hidden="true">
          <slot name="empty">{{ noMatchText }}</slot>
        </div>

        <div
          v-for="(opt, i) in matchedOptions"
          :id="optionId(i)"
          :key="String(keyOf(opt))"
          class="dmk-select__option"
          :class="{
            'is-hover': i === hoverIndex,
            'is-selected': isSelected(opt),
            'is-disabled': opt.disabled
          }"
          role="option"
          :aria-selected="isSelected(opt)"
          :aria-disabled="opt.disabled || undefined"
          @click="onSelect(opt, i)"
          @mouseenter="hoverIndex = i"
        >
          <slot name="option" :option="opt" :selected="isSelected(opt)">
            <span class="dmk-select__option-label">{{ opt.label }}</span>
          </slot>
          <svg
            v-if="isSelected(opt)"
            class="dmk-select__check"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path
              d="M2 6.5l2.5 2.5L10 3"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <!-- allow-create：新建选项 -->
        <div
          v-if="canCreate"
          class="dmk-select__option is-create"
          role="option"
          :aria-selected="false"
          @click="onCreate"
        >
          创建「{{ query.trim() }}」
        </div>

        <div v-if="$slots.footer" class="dmk-select__footer">
          <slot name="footer" />
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dmk-select {
  position: relative;
  display: inline-block;
  width: 100%;
}

/* 触发器：与 DInput 同款描边/尺寸/焦点环 */
.dmk-select__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: var(--dmk-control-height);
  padding: 0 var(--dmk-control-padding-x);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  box-sizing: border-box;
  cursor: pointer;
  transition:
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-select__trigger:hover {
  border-color: var(--dmk-color-border-strong);
}

.dmk-select__trigger:focus-visible,
.dmk-select.is-open .dmk-select__trigger {
  outline: none;
  border-color: var(--dmk-color-border-focus);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-select.is-disabled .dmk-select__trigger {
  opacity: 0.55;
  cursor: not-allowed;
}

.dmk-select.st-error .dmk-select__trigger {
  border-color: var(--dmk-color-danger);
}

.dmk-select.st-success .dmk-select__trigger {
  border-color: var(--dmk-color-success);
}

.dmk-select.st-warning .dmk-select__trigger {
  border-color: var(--dmk-color-warning);
}

.dmk-select__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-base);
  font-family: var(--dmk-font-family);
  line-height: 1.5;
}

.dmk-select__value.is-placeholder {
  color: var(--dmk-color-text-muted);
}

/* 可搜索：触发器内嵌输入框 */
.dmk-select__search {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-base);
  font-family: var(--dmk-font-family);
  line-height: 1.5;
}

.dmk-select__search::placeholder {
  color: var(--dmk-color-text-muted);
}

/* 多选：tag 展示 */
.dmk-select__tags {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.dmk-select__tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 100%;
  padding: 1px 6px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-sm);
  line-height: 1.5;
}

.dmk-select__tag-x {
  cursor: pointer;
  color: var(--dmk-color-text-muted);
}

.dmk-select__tag-x:hover {
  color: var(--dmk-color-danger);
}

.dmk-select__prefix {
  display: inline-flex;
  align-items: center;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
}

.dmk-select__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
  user-select: none;
}

.dmk-select__clear:hover {
  color: var(--dmk-color-text);
}

.dmk-select__arrow {
  color: var(--dmk-color-text-muted);
  transition: transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-select__arrow.is-open {
  transform: rotate(180deg);
}

.dmk-select__spinner {
  width: 0.85em;
  height: 0.85em;
  border: 2px solid var(--dmk-color-border-strong);
  border-top-color: var(--dmk-color-primary);
  border-radius: 50%;
  animation: dmk-select-spin 0.6s linear infinite;
}

@keyframes dmk-select-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 弹层 */
.dmk-select__popper {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: var(--dmk-z-popup);
  max-height: 260px;
  padding: var(--dmk-space-xs);
  overflow-y: auto;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-md);
}

.dmk-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--dmk-space-sm);
  padding: var(--dmk-space-xs) var(--dmk-space-sm);
  border-radius: var(--dmk-radius-sm);
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-base);
  cursor: pointer;
  transition: background-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-select__option.is-hover {
  background: var(--dmk-color-surface-hover);
}

.dmk-select__option.is-selected {
  color: var(--dmk-color-primary);
  font-weight: 600;
}

.dmk-select__option.is-disabled {
  color: var(--dmk-color-text-muted);
  opacity: 0.55;
  cursor: not-allowed;
}

.dmk-select__option.is-create {
  color: var(--dmk-color-primary);
  border-top: 1px dashed var(--dmk-color-border-subtle);
  border-radius: 0;
}

.dmk-select__option-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dmk-select__check {
  color: var(--dmk-color-primary);
  flex: none;
}

.dmk-select__header,
.dmk-select__footer {
  padding: var(--dmk-space-xs) var(--dmk-space-sm);
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-sm);
}

.dmk-select__header {
  margin: calc(-1 * var(--dmk-space-xs)) calc(-1 * var(--dmk-space-xs)) var(--dmk-space-xs);
  border-bottom: 1px solid var(--dmk-color-border-subtle);
}

.dmk-select__footer {
  margin: var(--dmk-space-xs) calc(-1 * var(--dmk-space-xs)) calc(-1 * var(--dmk-space-xs));
  border-top: 1px solid var(--dmk-color-border-subtle);
}

.dmk-select__spinner-wrap {
  display: inline-flex;
  align-items: center;
}

.dmk-select__empty {
  padding: var(--dmk-space-sm);
  text-align: center;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
}

.dmk-select-zoom-enter-active,
.dmk-select-zoom-leave-active {
  transition:
    opacity var(--dmk-duration-fast) var(--dmk-ease),
    transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-select-zoom-enter-from,
.dmk-select-zoom-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.dmk-select.s-sm .dmk-select__trigger {
  min-height: var(--dmk-control-height-sm);
  padding: 0 calc(var(--dmk-control-padding-x) * 0.75);
  font-size: var(--dmk-font-sm);
}

.dmk-select.s-lg .dmk-select__trigger {
  min-height: var(--dmk-control-height-lg);
}

/* 多选时触发器可换行，撑高容纳 tag */
.dmk-select.is-multiple .dmk-select__trigger {
  padding-top: 3px;
  padding-bottom: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .dmk-select__trigger,
  .dmk-select__arrow,
  .dmk-select-zoom-enter-active,
  .dmk-select-zoom-leave-active {
    transition: none;
  }

  .dmk-select__spinner {
    animation-duration: 1.2s;
  }
}
</style>
