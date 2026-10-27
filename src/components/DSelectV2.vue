<script setup lang="ts">
/**
 * DSelectV2 —— 虚拟化选择器（大数据量场景）。
 * 契约参考 Element Plus el-select-v2：
 *   modelValue / options / props / multiple / disabled / clearable /
 *   filterable / remote / remoteMethod / loading / height / itemHeight /
 *   valueKey / size / placeholder / emptyText / noMatchText / maxCollapseTags /
 *   collapseTags / loadingText / estimateOptionHeight
 *   Events: change / visible-change / remove-tag / clear / focus / blur / end-reached
 *   Slots: default / header / footer / empty / prefix / tag / loading
 *   Exposes: focus / blur / selectedLabel
 *
 * 实现：选项列表用 lib/virtual-list.ts 的定高虚拟滚动 —— 只渲染可视区的选项，
 *      1 万条选项也只挂载几十个 DOM 节点。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { calcVirtualRange } from '../lib/virtual-list'

/** 选项数据结构 */
export interface SelectV2Option {
  value?: unknown
  label?: string
  disabled?: boolean
  [key: string]: unknown
}

/** 字段映射 */
export interface SelectV2Props {
  value: string
  label: string
  disabled: string
  options: string
}

const props = withDefaults(
  defineProps<{
    /** 绑定值 */
    modelValue?: unknown
    /** 选项数据 */
    options?: SelectV2Option[]
    /** 字段映射 */
    props?: Partial<SelectV2Props>
    /** 是否多选 */
    multiple?: boolean
    /** 是否禁用 */
    disabled?: boolean
    /** 是否可清空 */
    clearable?: boolean
    /** 是否可搜索 */
    filterable?: boolean
    /** 远程搜索 */
    remote?: boolean
    /** 远程搜索回调 */
    remoteMethod?: (query: string) => void
    /** 是否加载中 */
    loading?: boolean
    /** 加载中文案 */
    loadingText?: string
    /** 面板高度 */
    height?: number
    /** 单项高度 */
    itemHeight?: number
    /** 预估项高度（变高条目时用） */
    estimateOptionHeight?: number
    /** 值唯一键（值为对象时必填） */
    valueKey?: string
    /** 尺寸 */
    size?: 'lg' | 'md' | 'sm'
    /** 占位符 */
    placeholder?: string
    /** 空数据文案 */
    emptyText?: string
    /** 无匹配文案 */
    noMatchText?: string
    /** 标签折叠 */
    collapseTags?: boolean
    /** 最多显示几个标签 */
    maxCollapseTags?: number
    /** 筛选函数 */
    filterMethod?: (query: string, option: SelectV2Option) => boolean
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    props: () => ({ value: 'value', label: 'label', disabled: 'disabled', options: 'options' }),
    multiple: false,
    disabled: false,
    clearable: true,
    filterable: false,
    remote: false,
    remoteMethod: undefined,
    loading: false,
    loadingText: '加载中',
    height: 274,
    itemHeight: 34,
    estimateOptionHeight: undefined,
    valueKey: '',
    size: 'md',
    placeholder: '请选择',
    emptyText: '无数据',
    noMatchText: '无匹配数据',
    collapseTags: false,
    maxCollapseTags: 1,
    filterMethod: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  change: [value: unknown]
  'visible-change': [visible: boolean]
  'remove-tag': [value: unknown]
  clear: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  /** 面板滚动到底 */
  'end-reached': []
}>()

/** 面板是否展开 */
const visible = ref(false)
/** 搜索关键词 */
const query = ref('')
/** 输入框元素 */
const inputRef = ref<HTMLInputElement | null>(null)
/** 面板滚动容器 */
const listRef = ref<HTMLElement | null>(null)
/** 面板滚动偏移 */
const scrollTop = ref(0)
/** 当前高亮下标 */
const highlightIndex = ref(-1)

/** 字段映射（带默认值） */
const fieldMap = computed<SelectV2Props>(() => ({
  value: props.props?.value ?? 'value',
  label: props.props?.label ?? 'label',
  disabled: props.props?.disabled ?? 'disabled',
  options: props.props?.options ?? 'options'
}))

/** 取选项字段 */
function fieldOf(option: SelectV2Option, field: 'value' | 'label' | 'disabled'): unknown {
  const key = fieldMap.value[field]
  const raw = option[key as string]
  if (raw !== undefined) return raw
  if (field === 'label') return option.label ?? ''
  if (field === 'value') return option.value
  return undefined
}

/** 选项值（对象型时用 valueKey 取唯一标识） */
function optionValue(option: SelectV2Option): unknown {
  const v = fieldOf(option, 'value')
  if (props.valueKey && v && typeof v === 'object') {
    return (v as Record<string, unknown>)[props.valueKey]
  }
  return v
}

/** 过滤后的选项 */
const filteredOptions = computed<SelectV2Option[]>(() => {
  if (props.remote) return props.options
  const kw = query.value.trim()
  if (!kw || !props.filterable) return props.options
  if (props.filterMethod) return props.options.filter((o) => props.filterMethod!(kw, o))
  const lower = kw.toLowerCase()
  return props.options.filter((o) => {
    const label = String(fieldOf(o, 'label') ?? '')
    const value = String(optionValue(o) ?? '')
    return label.toLowerCase().includes(lower) || value.toLowerCase().includes(lower)
  })
})

/** 已选中的值（数组形式） */
const selectedValues = computed<unknown[]>(() => {
  if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : []
  return props.modelValue === undefined || props.modelValue === '' ? [] : [props.modelValue]
})

/** 已选项在 options 里的索引（用于回显 label） */
const selectedOptions = computed<SelectV2Option[]>(() => {
  const out: SelectV2Option[] = []
  for (const v of selectedValues.value) {
    const hit = props.options.find((o) => optionValue(o) === v)
    if (hit) out.push(hit)
  }
  return out
})

/** 回显文本 */
const displayText = computed(() => {
  const labels = selectedOptions.value.map((o) => String(fieldOf(o, 'label') ?? ''))
  if (!labels.length) return ''
  if (props.multiple && props.collapseTags && labels.length > props.maxCollapseTags) {
    return `${labels.slice(0, props.maxCollapseTags).join('、')} +${labels.length - props.maxCollapseTags}`
  }
  return labels.join('、')
})

/** 虚拟区间 */
const range = computed(() =>
  calcVirtualRange({
    count: filteredOptions.value.length,
    itemSize: props.itemHeight,
    viewportSize: props.height,
    scrollTop: scrollTop.value,
    overscan: 3
  })
)

/** 需要渲染的选项切片 */
const visibleOptions = computed(() =>
  filteredOptions.value.slice(range.value.start, range.value.end)
)

/** 切片内每项的偏移 */
function optionTop(index: number): number {
  return (index - range.value.start) * props.itemHeight
}

/** 面板滚动 */
function onScroll(e: Event) {
  const el = e.target as HTMLElement
  scrollTop.value = el.scrollTop
  const remain = el.scrollHeight - el.scrollTop - el.clientHeight
  if (remain <= 1) emit('end-reached')
}

/** 打开面板 */
function open() {
  if (props.disabled || props.multiple) return
  visible.value = true
  emit('visible-change', true)
}

/** 关闭面板 */
function close() {
  if (!visible.value) return
  visible.value = false
  emit('visible-change', false)
}

/** 选择一项 */
function selectOption(option: SelectV2Option) {
  if (fieldOf(option, 'disabled') === true) return
  const v = optionValue(option)
  if (props.multiple) {
    const next = [...selectedValues.value]
    const idx = next.indexOf(v)
    if (idx >= 0) next.splice(idx, 1)
    else next.push(v)
    emit('update:modelValue', next)
    emit('change', next)
    return
  }
  emit('update:modelValue', v)
  emit('change', v)
  close()
}

/** 移除标签（多选） */
function removeTag(v: unknown) {
  const next = selectedValues.value.filter((x) => x !== v)
  emit('update:modelValue', next)
  emit('change', next)
  emit('remove-tag', v)
}

/** 清空 */
function onClear(e: MouseEvent) {
  e.stopPropagation()
  const empty = props.multiple ? [] : ''
  emit('update:modelValue', empty)
  emit('change', empty)
  emit('clear')
}

/** 输入（搜索） */
function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  query.value = el.value
  if (props.remote && props.remoteMethod) props.remoteMethod(el.value)
  highlightIndex.value = -1
}

/** 键盘操作 */
function onKeydown(e: KeyboardEvent) {
  const list = filteredOptions.value
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!visible.value) open()
    highlightIndex.value = Math.min(highlightIndex.value + 1, list.length - 1)
    scrollHighlightIntoView()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIndex.value = Math.max(highlightIndex.value - 1, 0)
    scrollHighlightIntoView()
  } else if (e.key === 'Enter') {
    const target = list[highlightIndex.value]
    if (target) {
      e.preventDefault()
      selectOption(target)
    }
  } else if (e.key === 'Escape') {
    close()
  }
}

/** 让高亮项滚进可视区 */
function scrollHighlightIntoView() {
  void nextTick(() => {
    const el = listRef.value
    if (!el) return
    const top = highlightIndex.value * props.itemHeight
    const bottom = top + props.itemHeight
    if (top < el.scrollTop) el.scrollTop = top
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight
  })
}

/** 失焦收起 */
function onBlur(e: FocusEvent) {
  emit('blur', e)
  window.setTimeout(() => {
    if (document.activeElement && inputRef.value && !inputRef.value.contains(document.activeElement)) {
      close()
    }
  }, 150)
}

watch(
  () => props.modelValue,
  () => {
    /* 值变化时 displayText 自动同步 */
  }
)

onBeforeUnmount(() => {
  close()
})

defineExpose({
  /** 聚焦 */
  focus: () => inputRef.value?.focus(),
  /** 失焦 */
  blur: () => inputRef.value?.blur(),
  /** 当前选中项的文本 */
  selectedLabel: computed(() => displayText.value)
})
</script>

<template>
  <div class="dmk-select-v2" :class="[`s-${size}`, { 'is-disabled': disabled, 'is-open': visible }]">
    <div class="dmk-select-v2__trigger" role="combobox" tabindex="0" :aria-expanded="visible" @click="open">
      <!-- 多选标签 -->
      <div v-if="multiple && selectedOptions.length" class="dmk-select-v2__tags">
        <template v-if="collapseTags && selectedOptions.length > maxCollapseTags">
          <span class="dmk-select-v2__tag">
            {{ String(fieldOf(selectedOptions[0], 'label')) }}
            <button type="button" class="dmk-select-v2__tag-close" aria-label="移除" @click.stop="removeTag(optionValue(selectedOptions[0]))">×</button>
          </span>
          <span class="dmk-select-v2__tag">+{{ selectedOptions.length - maxCollapseTags }}</span>
        </template>
        <template v-else>
          <span v-for="o in selectedOptions" :key="String(optionValue(o))" class="dmk-select-v2__tag">
            {{ String(fieldOf(o, 'label')) }}
            <button type="button" class="dmk-select-v2__tag-close" aria-label="移除" @click.stop="removeTag(optionValue(o))">×</button>
          </span>
        </template>
      </div>

      <!-- 单值文本 / 输入框 -->
      <input
        v-if="filterable"
        ref="inputRef"
        class="dmk-select-v2__input"
        :value="query"
        :placeholder="displayText || placeholder"
        :disabled="disabled"
        @input="onInput"
        @keydown="onKeydown"
        @focus="open"
        @blur="onBlur"
      />
      <span v-else class="dmk-select-v2__value" :class="{ 'is-placeholder': !displayText }">
        {{ displayText || placeholder }}
      </span>

      <button
        v-if="clearable && selectedValues.length && !disabled"
        type="button"
        class="dmk-select-v2__clear"
        aria-label="清空"
        @click="onClear"
      >
        ×
      </button>
      <span class="dmk-select-v2__arrow" aria-hidden="true">▾</span>
    </div>

    <!-- 面板 -->
    <transition name="dmk-select-v2-fade">
      <div v-if="visible" class="dmk-select-v2__panel">
        <div v-if="$slots.header" class="dmk-select-v2__header"><slot name="header" /></div>

        <div
          ref="listRef"
          class="dmk-select-v2__list"
          :style="{ height: `${height}px` }"
          @scroll="onScroll"
        >
          <div v-if="loading" class="dmk-select-v2__loading">
            <slot name="loading">{{ loadingText }}</slot>
          </div>

          <div v-else-if="!filteredOptions.length" class="dmk-select-v2__empty">
            <slot name="empty">{{ query ? noMatchText : emptyText }}</slot>
          </div>

          <!-- 虚拟滚动：外层撑总高，内层只渲染可视区的项 -->
          <div v-else class="dmk-select-v2__phantom" :style="{ height: `${range.totalSize}px` }">
            <div
              v-for="(option, i) in visibleOptions"
              :key="String(optionValue(option) ?? i)"
              class="dmk-select-v2__option"
              :class="{
                'is-disabled': fieldOf(option, 'disabled') === true,
                'is-active': selectedValues.includes(optionValue(option)),
                'is-highlighted': range.start + i === highlightIndex
              }"
              :style="{ height: `${itemHeight}px`, transform: `translateY(${optionTop(range.start + i)}px)` }"
              role="option"
              :aria-selected="selectedValues.includes(optionValue(option))"
              @click="selectOption(option)"
              @mouseenter="highlightIndex = range.start + i"
            >
              <slot name="default" :option="option">{{ fieldOf(option, 'label') }}</slot>
            </div>
          </div>
        </div>

        <div v-if="$slots.footer" class="dmk-select-v2__footer"><slot name="footer" /></div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dmk-select-v2 {
  position: relative;
  display: inline-block;
  width: 100%;
  font-family: var(--dmk-font-family);
}

.dmk-select-v2__trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  min-height: 32px;
  padding: 4px 10px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-base);
  cursor: pointer;
}

.dmk-select-v2.s-lg .dmk-select-v2__trigger {
  min-height: 38px;
}

.dmk-select-v2.s-sm .dmk-select-v2__trigger {
  min-height: 26px;
}

.dmk-select-v2.is-open .dmk-select-v2__trigger {
  border-color: var(--dmk-color-primary);
}

.dmk-select-v2__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
}

.dmk-select-v2__value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dmk-select-v2__value.is-placeholder {
  color: var(--dmk-color-text-muted);
}

.dmk-select-v2__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.dmk-select-v2__tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: var(--dmk-radius-sm);
  background: var(--dmk-color-primary-subtle);
  color: var(--dmk-color-primary);
  font-size: 12px;
}

.dmk-select-v2__tag-close {
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}

.dmk-select-v2__clear {
  padding: 0 2px;
  border: none;
  background: transparent;
  color: var(--dmk-color-text-muted);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}

.dmk-select-v2__arrow {
  color: var(--dmk-color-text-muted);
  font-size: 11px;
}

.dmk-select-v2__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 2000;
  min-width: 100%;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
}

.dmk-select-v2__list {
  position: relative;
  overflow-y: auto;
  box-sizing: border-box;
}

.dmk-select-v2__phantom {
  position: relative;
}

.dmk-select-v2__option {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 12px;
  color: var(--dmk-color-text);
  font-size: 13px;
  cursor: pointer;
}

.dmk-select-v2__option.is-highlighted {
  background: var(--dmk-color-fill);
}

.dmk-select-v2__option.is-active {
  color: var(--dmk-color-primary);
  font-weight: 600;
}

.dmk-select-v2__option.is-disabled {
  color: var(--dmk-color-text-disabled, var(--dmk-color-text-muted));
  cursor: not-allowed;
}

.dmk-select-v2__loading,
.dmk-select-v2__empty {
  padding: 16px;
  color: var(--dmk-color-text-muted);
  font-size: 13px;
  text-align: center;
}

.dmk-select-v2__header,
.dmk-select-v2__footer {
  padding: 6px 12px;
  color: var(--dmk-color-text-muted);
  font-size: 12px;
}

.dmk-select-v2-fade-enter-active,
.dmk-select-v2-fade-leave-active {
  transition: opacity var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-select-v2-fade-enter-from,
.dmk-select-v2-fade-leave-to {
  opacity: 0;
}
</style>
