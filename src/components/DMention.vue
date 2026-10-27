<script setup lang="ts">
/**
 * DMention —— @提及输入框。
 * 契约参考 Element Plus el-mention：
 *   Attributes: options / props / prefix / split / filterOption / placement /
 *               showArrow / offset / whole / checkIsWhole / loading / modelValue /
 *               popperClass / popperStyle / popperOptions
 *   Events: search / select / whole-remove / input（透传原生输入事件）
 *   Slots: label / loading / header / footer
 *   Exposes: input / tooltip / dropdownVisible
 *
 * 实现：原生 textarea + 光标位置追踪。
 *   输入 prefix（如 @）后弹出候选面板，按 keyword 过滤；
 *   选中后把「prefix + label + split」写回光标处。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { MentionOption, MentionProps } from '../lib/mention'

const props = withDefaults(
  defineProps<{
    /** 绑定值（输入框文本） */
    modelValue?: string
    /** 提及候选列表 */
    options?: MentionOption[]
    /** 字段映射 */
    props?: Partial<MentionProps>
    /** 触发前缀，长度必须为 1；数组表示多个前缀 */
    prefix?: string | string[]
    /** 选中后追加的分隔符 */
    split?: string
    /** 自定义筛选逻辑；false 表示用默认（label/value 包含关键词） */
    filterOption?: false | ((option: MentionOption, keyword: string) => boolean)
    /** 面板位置 */
    placement?: 'top' | 'bottom'
    /** 是否显示箭头 */
    showArrow?: boolean
    /** 面板偏移 */
    offset?: number
    /** 退格时是否整块删除提及 */
    whole?: boolean
    /** 自定义「是否整块」判定：返回要整块删除的文本（null 表示不整块删除） */
    checkIsWhole?: (text: string, selectionStart: number) => string | null
    /** 面板是否加载中 */
    loading?: boolean
    /** 面板类名 */
    popperClass?: string
    /** 面板样式 */
    popperStyle?: string | Record<string, string>
    /** 占位符 */
    placeholder?: string
    /** 是否禁用 */
    disabled?: boolean
    /** 是否只读 */
    readonly?: boolean
    /** 行数 */
    rows?: number
  }>(),
  {
    modelValue: '',
    options: () => [],
    props: () => ({ value: 'value', label: 'label', disabled: 'disabled' }),
    prefix: '@',
    split: ' ',
    filterOption: false,
    placement: 'bottom',
    showArrow: false,
    offset: 0,
    whole: false,
    checkIsWhole: undefined,
    loading: false,
    popperClass: '',
    popperStyle: '',
    placeholder: '请输入…',
    disabled: false,
    readonly: false,
    rows: 3
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** 命中前缀、开始搜索 */
  search: [pattern: string, prefix: string]
  /** 选中候选项 */
  select: [option: MentionOption, prefix: string]
  /** 整块提及被删除 */
  'whole-remove': [whole: string]
  input: [event: Event]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

/** 内部文本 */
const innerValue = ref(props.modelValue)
/** textarea 元素 */
const inputRef = ref<HTMLTextAreaElement | null>(null)
/** 面板是否展开 */
const dropdownVisible = ref(false)
/** 当前触发的前缀 */
const activePrefix = ref('')
/** 当前关键词 */
const keyword = ref('')
/** 触发时的光标位置（用于回填） */
const anchorPos = ref(0)

watch(
  () => props.modelValue,
  (v) => {
    if (v !== innerValue.value) innerValue.value = v
  }
)

/** 字段映射（带默认值） */
const fieldMap = computed<MentionProps>(() => ({
  value: props.props?.value ?? 'value',
  label: props.props?.label ?? 'label',
  disabled: props.props?.disabled ?? 'disabled'
}))

/** 所有触发前缀 */
const prefixes = computed<string[]>(() =>
  Array.isArray(props.prefix) ? props.prefix : [props.prefix]
)

/** 取选项的某个字段值 */
function fieldOf(option: MentionOption, field: string): unknown {
  const key = fieldMap.value[field as keyof MentionProps]
  const raw = option[key as string]
  return raw === undefined ? option.label : raw
}

/** 默认筛选：label / value 包含关键词 */
function defaultFilter(option: MentionOption, kw: string): boolean {
  if (!kw) return true
  const label = String(fieldOf(option, 'label') ?? '')
  const value = String(fieldOf(option, 'value') ?? '')
  return label.toLowerCase().includes(kw.toLowerCase()) || value.toLowerCase().includes(kw.toLowerCase())
}

/** 过滤后的候选 */
const filteredOptions = computed<MentionOption[]>(() => {
  const kw = keyword.value
  const custom = props.filterOption
  if (typeof custom === 'function') {
    return props.options.filter((o) => custom(o, kw))
  }
  return props.options.filter((o) => defaultFilter(o, kw))
})

/**
 * 从光标位置往前找触发前缀。
 * 返回 null 表示当前不在提及状态。
 */
function detectPrefix(text: string, caret: number): { prefix: string; kw: string; start: number } | null {
  const before = text.slice(0, caret)
  for (const p of prefixes.value) {
    const idx = before.lastIndexOf(p)
    if (idx < 0) continue
    const kw = before.slice(idx + p.length)
    // 关键词里不能有空白或换行（除非分隔符本身是空白）
    if (/[\n\r]/.test(kw)) continue
    if (props.split && kw.includes(props.split)) continue
    return { prefix: p, kw, start: idx }
  }
  return null
}

/** 输入处理 */
function onInput(e: Event) {
  const el = e.target as HTMLTextAreaElement
  innerValue.value = el.value
  emit('update:modelValue', el.value)
  emit('input', e)

  const caret = el.selectionStart ?? el.value.length
  const hit = detectPrefix(el.value, caret)
  if (hit) {
    activePrefix.value = hit.prefix
    keyword.value = hit.kw
    anchorPos.value = hit.start
    dropdownVisible.value = true
    emit('search', hit.kw, hit.prefix)
  } else {
    closeDropdown()
  }
}

/** 关闭面板 */
function closeDropdown() {
  if (!dropdownVisible.value) return
  dropdownVisible.value = false
  keyword.value = ''
  activePrefix.value = ''
}

/** 选中候选项 */
function onSelect(option: MentionOption) {
  const el = inputRef.value
  const label = String(fieldOf(option, 'label') ?? '')
  const value = String(fieldOf(option, 'value') ?? label)
  const text = el?.value ?? innerValue.value
  const caret = el?.selectionStart ?? text.length

  // 把已输入的「prefix + 关键词」整段替换成「prefix + label」
  const hit = detectPrefix(text, caret)
  const start = hit ? hit.start : anchorPos.value
  const insert = `${activePrefix.value}${label}${props.split}`

  const next = text.slice(0, start) + insert + text.slice(caret)
  innerValue.value = next
  emit('update:modelValue', next)
  emit('select', { ...option, value }, activePrefix.value)
  closeDropdown()

  void nextTick(() => {
    const pos = start + insert.length
    el?.focus()
    el?.setSelectionRange(pos, pos)
  })
}

/**
 * 退格处理：whole 模式下整块删除提及。
 * 默认判定：光标前一个字符是分隔符，且分隔符往前是一个完整的「prefix + 词」。
 */
function defaultCheckIsWhole(text: string, caret: number): string | null {
  const sep = props.split || ' '
  if (text[caret - 1] !== sep) return null
  const head = text.slice(0, caret - 1)
  for (const p of prefixes.value) {
    const idx = head.lastIndexOf(p)
    if (idx < 0) continue
    const word = head.slice(idx + p.length)
    if (!word || /\s/.test(word)) continue
    return head.slice(idx)
  }
  return null
}

function onKeydown(e: KeyboardEvent) {
  const el = e.target as HTMLTextAreaElement
  const caret = el.selectionStart ?? 0

  // 退格整块删除
  if (e.key === 'Backspace' && (props.whole || props.checkIsWhole)) {
    const whole = props.checkIsWhole
      ? props.checkIsWhole(el.value, caret)
      : defaultCheckIsWhole(el.value, caret)
    if (whole) {
      e.preventDefault()
      const next = el.value.slice(0, caret - (props.split || ' ').length - whole.length) + el.value.slice(caret)
      innerValue.value = next
      emit('update:modelValue', next)
      emit('whole-remove', whole)
      void nextTick(() => {
        el.setSelectionRange(caret - (props.split || ' ').length - whole.length, caret - (props.split || ' ').length - whole.length)
      })
      return
    }
  }

  // 上下键选择候选
  if (dropdownVisible.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault()
    const idx = filteredOptions.value.findIndex((o) => o === highlighted.value)
    const dir = e.key === 'ArrowDown' ? 1 : -1
    const len = filteredOptions.value.length
    if (len) {
      const nextIdx = (idx + dir + len) % len
      highlighted.value = filteredOptions.value[nextIdx]
    }
    return
  }

  // 回车/空格选中
  if (dropdownVisible.value && (e.key === 'Enter' || e.key === 'Tab')) {
    const target = highlighted.value ?? filteredOptions.value[0]
    if (target) {
      e.preventDefault()
      onSelect(target)
    }
  }
}

/** 当前高亮的候选项 */
const highlighted = ref<MentionOption | null>(null)

watch(filteredOptions, (list) => {
  if (!list.includes(highlighted.value as MentionOption)) {
    highlighted.value = list[0] ?? null
  }
})

/** 失焦时收起面板（延迟一点，等点击候选先落地） */
function onBlur(e: FocusEvent) {
  emit('blur', e)
  window.setTimeout(() => {
    if (document.activeElement && inputRef.value && !inputRef.value.contains(document.activeElement)) {
      closeDropdown()
    }
  }, 150)
}

function onFocus(e: FocusEvent) {
  emit('focus', e)
}

/** 外部点击收起 */
function onDocMouseDown(e: MouseEvent) {
  if (!dropdownVisible.value) return
  const t = e.target as HTMLElement
  if (t.closest?.('.dmk-mention')) return
  closeDropdown()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocMouseDown)
})

/** 面板位置样式 */
const panelStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.placement === 'top') style.bottom = '100%'
  else style.top = '100%'
  if (props.offset) {
    if (props.placement === 'top') style.marginBottom = `${props.offset}px`
    else style.marginTop = `${props.offset}px`
  }
  if (typeof props.popperStyle === 'string') return props.popperStyle
  if (props.popperStyle && typeof props.popperStyle === 'object') Object.assign(style, props.popperStyle)
  return style
})

/** 暴露 */
defineExpose({
  /** 输入框实例 */
  input: inputRef,
  /** 面板显示状态 */
  dropdownVisible,
  /** 聚焦 */
  focus: () => inputRef.value?.focus(),
  /** 失焦 */
  blur: () => inputRef.value?.blur()
})
</script>

<template>
  <div class="dmk-mention" :class="{ 'is-disabled': disabled }">
    <textarea
      ref="inputRef"
      class="dmk-mention__input"
      :value="innerValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      spellcheck="false"
      @input="onInput"
      @keydown="onKeydown"
      @focus="onFocus"
      @blur="onBlur"
    />

    <transition name="dmk-mention-fade">
      <div
        v-if="dropdownVisible"
        class="dmk-mention__popper"
        :class="[props.popperClass, { 'has-arrow': showArrow }]"
        :style="panelStyle"
        role="listbox"
        aria-label="提及候选"
      >
        <div v-if="$slots.header" class="dmk-mention__header"><slot name="header" /></div>

        <div v-if="loading" class="dmk-mention__loading">
          <slot name="loading">加载中…</slot>
        </div>

        <ul v-else-if="filteredOptions.length" class="dmk-mention__list">
          <li
            v-for="option in filteredOptions"
            :key="String(fieldOf(option, 'value') ?? fieldOf(option, 'label'))"
            class="dmk-mention__option"
            :class="{
              'is-disabled': fieldOf(option, 'disabled') === true,
              'is-highlighted': option === highlighted
            }"
            role="option"
            :aria-selected="option === highlighted"
            @mousedown.prevent
            @click="onSelect(option)"
          >
            <slot name="label" :option="option">{{ fieldOf(option, 'label') }}</slot>
          </li>
        </ul>

        <div v-else class="dmk-mention__empty">无匹配项</div>

        <div v-if="$slots.footer" class="dmk-mention__footer"><slot name="footer" /></div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dmk-mention {
  position: relative;
  display: inline-block;
  width: 100%;
  font-family: var(--dmk-font-family);
}

.dmk-mention__input {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text);
  font-family: inherit;
  font-size: var(--dmk-font-base);
  line-height: 1.5;
  resize: vertical;
  transition: border-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-mention__input:focus {
  outline: none;
  border-color: var(--dmk-color-primary);
}

.dmk-mention.is-disabled .dmk-mention__input {
  background: var(--dmk-color-disabled-bg);
  color: var(--dmk-color-text-muted);
  cursor: not-allowed;
}

.dmk-mention__popper {
  position: absolute;
  left: 0;
  z-index: 2000;
  min-width: 180px;
  max-width: 320px;
  max-height: 260px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface-elevated, var(--dmk-color-surface));
  box-shadow: var(--dmk-shadow-lg);
}

.dmk-mention__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.dmk-mention__option {
  padding: 7px 10px;
  border-radius: var(--dmk-radius-sm);
  color: var(--dmk-color-text);
  font-size: 13px;
  cursor: pointer;
}

.dmk-mention__option.is-highlighted {
  background: var(--dmk-color-primary-subtle);
  color: var(--dmk-color-primary);
}

.dmk-mention__option.is-disabled {
  color: var(--dmk-color-text-muted);
  cursor: not-allowed;
  opacity: 0.6;
}

.dmk-mention__empty,
.dmk-mention__loading {
  padding: 10px 12px;
  color: var(--dmk-color-text-muted);
  font-size: 13px;
  text-align: center;
}

.dmk-mention__header,
.dmk-mention__footer {
  padding: 6px 10px;
  color: var(--dmk-color-text-muted);
  font-size: 12px;
}

.dmk-mention-fade-enter-active,
.dmk-mention-fade-leave-active {
  transition:
    opacity var(--dmk-duration-fast) var(--dmk-ease),
    transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-mention-fade-enter-from,
.dmk-mention-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
