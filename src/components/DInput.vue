<script setup lang="ts">
/**
 * DInput —— 单行输入框。
 * ---------------------------------------------------------------------------
 * 契约参考件（表单控件向）：v-model / size / status / 前后缀插槽 / a11y 以本件为准。
 * Element Plus 对齐（2026-10-26 补齐）：原生属性透传 + 复合型插槽 + exposes + 输入态事件。
 *   · 原生透传：id / form / aria-label / tabindex / inputmode / autofocus / minlength /
 *     max / min / step / validate-event
 *   · 插槽：prefix / suffix / prepend / append / password-icon（作用域 { visible }）
 *   · exposes：focus / blur / clear / select / input（原生元素引用）
 *   · 事件：input / keydown / compositionstart|update|end / mouseenter / mouseleave
 */
import { computed, nextTick, ref, watch } from 'vue'

type Size = 'sm' | 'md' | 'lg'
type Status = 'default' | 'error' | 'success' | 'warning'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    type?: 'text' | 'password' | 'email' | 'tel' | 'number' | 'url'
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    clearable?: boolean
    showPassword?: boolean
    maxlength?: number
    minlength?: number
    showCount?: boolean
    size?: Size
    status?: Status
    name?: string
    id?: string
    autocomplete?: string
    inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
    form?: string
    tabindex?: number | string
    ariaLabel?: string
    autofocus?: boolean
    /** number 类型的上下限 */
    min?: number | string
    max?: number | string
    step?: number | string
    /** 输入时把原始值格式化为显示文本（失焦时套用） */
    formatter?: (value: string) => string
    /** 把显示文本解析回实际值（输入时套用） */
    parser?: (value: string) => string
    /** 是否随输入触发表单校验 */
    validateEvent?: boolean
  }>(),
  {
    modelValue: '',
    type: 'text',
    placeholder: '',
    disabled: false,
    readonly: false,
    clearable: false,
    showPassword: false,
    showCount: false,
    size: 'md',
    status: 'default',
    name: undefined,
    id: undefined,
    autocomplete: undefined,
    inputmode: undefined,
    form: undefined,
    tabindex: undefined,
    ariaLabel: undefined,
    autofocus: false,
    min: undefined,
    max: undefined,
    step: undefined,
    formatter: undefined,
    parser: undefined,
    validateEvent: true
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  input: [value: string]
  clear: []
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
  enter: [e: KeyboardEvent]
  keydown: [e: KeyboardEvent]
  mouseenter: [e: MouseEvent]
  mouseleave: [e: MouseEvent]
  compositionstart: [e: CompositionEvent]
  compositionupdate: [e: CompositionEvent]
  compositionend: [e: CompositionEvent]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
/** 密码明文切换 */
const reveal = ref(false)
/** 输入框实际显示的文本（formatter 生效时与 modelValue 不同） */
const innerText = ref(String(props.modelValue ?? ''))
/** 内部同步标记：用户输入引起的 modelValue 变化不再回写显示文本 */
let internal = false

const textValue = computed(() => String(props.modelValue ?? ''))
const isPwd = computed(() => props.type === 'password')
const actualType = computed(() => (isPwd.value && reveal.value ? 'text' : props.type))
const showClear = computed(
  () => props.clearable && !props.disabled && !props.readonly && textValue.value.length > 0
)

/* 外部赋值 → 同步显示文本（formatter 套用） */
watch(
  () => props.modelValue,
  (v) => {
    if (internal) return
    const raw = String(v ?? '')
    innerText.value = props.formatter ? props.formatter(raw) : raw
  }
)

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  innerText.value = raw
  const actual = props.parser ? props.parser(raw) : raw
  internal = true
  emit('update:modelValue', actual)
  emit('input', actual)
  nextTick(() => {
    internal = false
  })
}

function onChange(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const actual = props.parser ? props.parser(raw) : raw
  emit('change', actual)
}

function onClear() {
  innerText.value = ''
  internal = true
  emit('update:modelValue', '')
  emit('clear')
  nextTick(() => {
    internal = false
  })
  inputRef.value?.focus()
}

function onFocus(e: FocusEvent) {
  emit('focus', e)
}

function onBlur(e: FocusEvent) {
  // 失焦时套用 formatter（EP 同款：千分位这类格式化在失焦后呈现）
  if (props.formatter) innerText.value = props.formatter(innerText.value)
  emit('blur', e)
}

function onEnter(e: KeyboardEvent) {
  emit('enter', e)
}

/* ---------- exposes（Element Plus 同款） ---------- */
function focus() {
  inputRef.value?.focus()
}
function blur() {
  inputRef.value?.blur()
}
function select() {
  inputRef.value?.select()
}
function clear() {
  onClear()
}

defineExpose({ focus, blur, select, clear, input: inputRef })
</script>

<template>
  <div
    class="dmk-input"
    :class="[`s-${size}`, `st-${status}`, { 'is-disabled': disabled, 'is-readonly': readonly }]"
  >
    <!-- 复合型：前置内容 -->
    <span v-if="$slots.prepend" class="dmk-input__group">
      <slot name="prepend" />
    </span>
    <span v-if="$slots.prefix" class="dmk-input__affix">
      <slot name="prefix" />
    </span>
    <input
      ref="inputRef"
      class="dmk-input__inner"
      :type="actualType"
      :value="innerText"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :minlength="minlength"
      :name="name"
      :id="id"
      :form="form"
      :tabindex="tabindex"
      :inputmode="inputmode"
      :autocomplete="autocomplete"
      :autofocus="autofocus"
      :min="min"
      :max="max"
      :step="step"
      :aria-label="ariaLabel"
      :aria-invalid="status === 'error' ? 'true' : undefined"
      @input="onInput"
      @change="onChange"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.enter="onEnter"
      @keydown="(e) => emit('keydown', e)"
      @mouseenter="(e) => emit('mouseenter', e)"
      @mouseleave="(e) => emit('mouseleave', e)"
      @compositionstart="(e) => emit('compositionstart', e)"
      @compositionupdate="(e) => emit('compositionupdate', e)"
      @compositionend="(e) => emit('compositionend', e)"
    />
    <span v-if="showClear" class="dmk-input__action dmk-input__clear" role="button" tabindex="0" aria-label="清空" @click="onClear" @keydown.enter.prevent="onClear">×</span>
    <span
      v-if="isPwd && showPassword"
      class="dmk-input__action"
      role="button"
      tabindex="0"
      :aria-label="reveal ? '隐藏密码' : '显示密码'"
      @click="reveal = !reveal"
      @keydown.enter.prevent="reveal = !reveal"
    >
      <slot name="password-icon" :visible="reveal">{{ reveal ? '🙈' : '👁' }}</slot>
    </span>
    <span v-if="showCount" class="dmk-input__count" aria-hidden="true">
      {{ textValue.length }}<template v-if="maxlength">/{{ maxlength }}</template>
    </span>
    <span v-if="$slots.suffix" class="dmk-input__affix">
      <slot name="suffix" />
    </span>
    <!-- 复合型：后置内容 -->
    <span v-if="$slots.append" class="dmk-input__group">
      <slot name="append" />
    </span>
  </div>
</template>

<style scoped>
.dmk-input {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: var(--dmk-control-height);
  padding: 0 var(--dmk-control-padding-x);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  transition:
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-input:hover:not(.is-disabled):not(.is-readonly) {
  border-color: var(--dmk-color-border-strong);
}

.dmk-input:focus-within {
  border-color: var(--dmk-color-border-focus);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-input.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dmk-input.st-error {
  border-color: var(--dmk-color-danger);
}

.dmk-input.st-error:focus-within {
  box-shadow: 0 0 0 3px var(--dmk-color-danger-subtle);
}

.dmk-input.st-success {
  border-color: var(--dmk-color-success);
}

.dmk-input.st-warning {
  border-color: var(--dmk-color-warning);
}

.dmk-input__inner {
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

.dmk-input__inner::placeholder {
  color: var(--dmk-color-text-muted);
}

.dmk-input__affix {
  display: inline-flex;
  align-items: center;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
}

/* 复合型前后内容：带分隔竖线，视觉上与输入区分开 */
.dmk-input__group {
  display: inline-flex;
  align-items: center;
  align-self: stretch;
  padding: 0 8px;
  margin: -1px 0;
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-sm);
}

.dmk-input__group:first-child {
  margin-left: calc(-1 * var(--dmk-control-padding-x));
  padding-left: 10px;
  border-radius: var(--dmk-radius-md) 0 0 var(--dmk-radius-md);
}

.dmk-input__group:last-child {
  margin-right: calc(-1 * var(--dmk-control-padding-x));
  padding-right: 10px;
  border-radius: 0 var(--dmk-radius-md) var(--dmk-radius-md) 0;
}

.dmk-input__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  color: var(--dmk-color-text-muted);
  cursor: pointer;
  user-select: none;
  font-size: var(--dmk-font-sm);
}

.dmk-input__action:hover {
  color: var(--dmk-color-text);
}

.dmk-input__count {
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
  user-select: none;
}

.dmk-input.s-sm {
  min-height: var(--dmk-control-height-sm);
  padding: 0 calc(var(--dmk-control-padding-x) * 0.75);
  font-size: var(--dmk-font-sm);
}

.dmk-input.s-lg {
  min-height: var(--dmk-control-height-lg);
}
</style>
