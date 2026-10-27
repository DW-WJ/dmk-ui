<script setup lang="ts">
/**
 * DTextarea —— 多行文本域。
 * 设计要点：外框样式与 DInput 完全一致（描边/尺寸/状态/焦点环）；
 * autosize 用 scrollHeight 调高度（minRows/maxRows 钳制）；
 * showCount 在底部右侧显示字数；resize 控制原生缩放行为。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type Size = 'sm' | 'md' | 'lg'
type Status = 'default' | 'error' | 'success' | 'warning'
type Resize = 'none' | 'vertical' | 'both'
type Autosize = boolean | { minRows?: number; maxRows?: number }

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    rows?: number
    autosize?: Autosize
    maxlength?: number
    showCount?: boolean
    resize?: Resize
    status?: Status
    size?: Size
    id?: string
    name?: string
    tabindex?: number | string
    ariaLabel?: string
    autocomplete?: string
    inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
    form?: string
    autofocus?: boolean
    minlength?: number
    /** 输入时把原始值格式化为显示文本（失焦时套用） */
    formatter?: (value: string) => string
    /** 把显示文本解析回实际值（输入时套用） */
    parser?: (value: string) => string
  }>(),
  {
    modelValue: '',
    placeholder: '',
    disabled: false,
    readonly: false,
    rows: 3,
    autosize: false,
    maxlength: undefined,
    showCount: false,
    resize: 'vertical',
    status: 'default',
    size: 'md',
    id: undefined,
    name: undefined,
    tabindex: undefined,
    ariaLabel: undefined,
    autocomplete: undefined,
    inputmode: undefined,
    form: undefined,
    autofocus: false,
    minlength: undefined,
    formatter: undefined,
    parser: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  input: [value: string]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
  keydown: [e: KeyboardEvent]
  mouseenter: [e: MouseEvent]
  mouseleave: [e: MouseEvent]
  compositionstart: [e: CompositionEvent]
  compositionupdate: [e: CompositionEvent]
  compositionend: [e: CompositionEvent]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const textValue = computed(() => String(props.modelValue ?? ''))
const autosizeOn = computed(() => props.autosize !== false && props.autosize !== undefined)
const minRows = computed(() => {
  if (props.autosize === true || props.autosize === false || props.autosize === undefined) return props.rows
  return props.autosize.minRows ?? props.rows
})
const maxRows = computed(() => {
  if (props.autosize === true || props.autosize === false || props.autosize === undefined) return undefined
  return props.autosize.maxRows
})

/** 按 scrollHeight 自适应高度，minRows/maxRows 钳制 */
function resizeTextarea() {
  const el = textareaRef.value
  if (!el || !autosizeOn.value) return
  const cs = window.getComputedStyle(el)
  const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5 || 20
  const paddingY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
  const borderY = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0)
  const minH = minRows.value * lineHeight + paddingY + borderY
  const maxH = maxRows.value ? maxRows.value * lineHeight + paddingY + borderY : Number.POSITIVE_INFINITY
  el.style.height = 'auto'
  const next = Math.min(Math.max(el.scrollHeight, minH), maxH)
  el.style.height = `${next}px`
  el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden'
}

function resetHeight() {
  const el = textareaRef.value
  if (!el) return
  if (!autosizeOn.value) {
    el.style.height = ''
    el.style.overflowY = ''
    return
  }
  resizeTextarea()
}

function onInput(e: Event) {
  const raw = (e.target as HTMLTextAreaElement).value
  const actual = props.parser ? props.parser(raw) : raw
  emit('update:modelValue', actual)
  emit('input', actual)
  nextTick(resizeTextarea)
}

function onChange(e: Event) {
  const raw = (e.target as HTMLTextAreaElement).value
  emit('change', props.parser ? props.parser(raw) : raw)
}

function onFocus(e: FocusEvent) {
  emit('focus', e)
}

function onBlur(e: FocusEvent) {
  emit('blur', e)
}

/* ---------- exposes（Element Plus 同款） ---------- */
function focus() {
  textareaRef.value?.focus()
}
function blur() {
  textareaRef.value?.blur()
}
function select() {
  textareaRef.value?.select()
}

defineExpose({ focus, blur, select, textarea: textareaRef })

watch(() => [props.modelValue, props.autosize], () => nextTick(resetHeight))
watch(() => props.rows, () => nextTick(resetHeight))

onMounted(() => {
  resizeTextarea()
  window.addEventListener('resize', resizeTextarea)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeTextarea)
})
</script>

<template>
  <div
    class="dmk-textarea"
    :class="[
      `s-${size}`,
      `st-${status}`,
      { 'is-disabled': disabled, 'is-readonly': readonly, 'is-resize-none': resize === 'none' }
    ]"
  >
    <textarea
      ref="textareaRef"
      class="dmk-textarea__inner"
      :value="textValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      :maxlength="maxlength"
      :minlength="minlength"
      :id="id"
      :name="name"
      :tabindex="tabindex"
      :aria-label="ariaLabel"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :form="form"
      :autofocus="autofocus"
      :aria-invalid="status === 'error' ? 'true' : undefined"
      :style="{ resize }"
      @input="onInput"
      @change="onChange"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="(e) => emit('keydown', e)"
      @mouseenter="(e) => emit('mouseenter', e)"
      @mouseleave="(e) => emit('mouseleave', e)"
      @compositionstart="(e) => emit('compositionstart', e)"
      @compositionupdate="(e) => emit('compositionupdate', e)"
      @compositionend="(e) => emit('compositionend', e)"
    />
    <span v-if="showCount" class="dmk-textarea__count" aria-hidden="true">
      {{ textValue.length }}<template v-if="maxlength">/{{ maxlength }}</template>
    </span>
  </div>
</template>

<style scoped>
.dmk-textarea {
  display: inline-flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  transition:
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-textarea:hover:not(.is-disabled):not(.is-readonly) {
  border-color: var(--dmk-color-border-strong);
}

.dmk-textarea:focus-within {
  border-color: var(--dmk-color-border-focus);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-textarea.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dmk-textarea.st-error {
  border-color: var(--dmk-color-danger);
}

.dmk-textarea.st-error:focus-within {
  box-shadow: var(--dmk-shadow-focus);
  border-color: var(--dmk-color-danger);
}

.dmk-textarea.st-success {
  border-color: var(--dmk-color-success);
}

.dmk-textarea.st-warning {
  border-color: var(--dmk-color-warning);
}

.dmk-textarea__inner {
  flex: 1;
  width: 100%;
  padding: var(--dmk-space-sm) var(--dmk-control-padding-x);
  border: none;
  outline: none;
  background: transparent;
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-base);
  font-family: var(--dmk-font-family);
  line-height: 1.5;
  box-sizing: border-box;
}

.dmk-textarea__inner:focus-visible {
  outline: none;
}

.dmk-textarea__inner::placeholder {
  color: var(--dmk-color-text-muted);
}

.dmk-textarea.is-resize-none .dmk-textarea__inner {
  resize: none;
}

.dmk-textarea__count {
  padding: 0 var(--dmk-control-padding-x) var(--dmk-space-xs);
  text-align: right;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
  user-select: none;
}

.dmk-textarea.s-sm .dmk-textarea__inner {
  padding: var(--dmk-space-xs) calc(var(--dmk-control-padding-x) * 0.75);
  font-size: var(--dmk-font-sm);
}

.dmk-textarea.s-lg .dmk-textarea__inner {
  padding: var(--dmk-space-md) var(--dmk-control-padding-x);
  font-size: var(--dmk-font-md);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-textarea {
    transition: none;
  }
}
</style>
