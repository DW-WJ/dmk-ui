<script setup lang="ts">
/**
 * DInputNumber —— 数字输入框。
 * 设计要点：原生 input + 增减按钮；内部维护显示文本（允许临时非法输入），
 * 失焦或回车时按 min/max/step/precision 归一化；valueOnClear 决定清空时的回退值。
 */
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number | null
    min?: number
    max?: number
    step?: number
    /** 严格按 step 取整（不允许输入非步长值） */
    stepStrictly?: boolean
    /** 小数位数 */
    precision?: number
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    /** 是否显示增减按钮 */
    controls?: boolean
    placeholder?: string
    /** 清空时的回退值：null / min / max */
    valueOnClear?: null | 'min' | 'max'
    id?: string
    name?: string
    tabindex?: number | string
    ariaLabel?: string
    /** 输入时把值格式化为显示文本 */
    formatter?: (value: number) => string
    /** 把显示文本解析回数字（解析失败返回 null） */
    parser?: (text: string) => number | null
  }>(),
  {
    modelValue: null,
    min: undefined,
    max: undefined,
    step: 1,
    stepStrictly: false,
    precision: undefined,
    disabled: false,
    size: 'md',
    controls: true,
    placeholder: '',
    valueOnClear: null,
    id: undefined,
    name: undefined,
    tabindex: undefined,
    ariaLabel: undefined,
    formatter: undefined,
    parser: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  change: [value: number | null]
  input: [value: number | null]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const innerText = ref('')
const editing = ref(false)

function format(v: number): string {
  if (props.formatter) return props.formatter(v)
  if (props.precision !== undefined) return v.toFixed(props.precision)
  return String(v)
}

/** 按 min/max/step 归一化 */
function normalize(v: number): number | null {
  if (!Number.isFinite(v)) return null
  let out = v
  if (props.stepStrictly && props.step > 0) {
    const base = props.min ?? 0
    out = base + Math.round((out - base) / props.step) * props.step
  }
  if (props.min !== undefined && out < props.min) out = props.min
  if (props.max !== undefined && out > props.max) out = props.max
  if (props.precision !== undefined) {
    const p = 10 ** props.precision
    out = Math.round(out * p) / p
  }
  return out
}

function commit() {
  editing.value = false
  const raw = innerText.value.trim()
  if (raw === '') {
    const fallback =
      props.valueOnClear === 'min'
        ? (props.min ?? null)
        : props.valueOnClear === 'max'
          ? (props.max ?? null)
          : null
    innerText.value = fallback === null ? '' : format(fallback)
    if (fallback !== props.modelValue) {
      emit('update:modelValue', fallback)
      emit('change', fallback)
    }
    return
  }
  const parsed = props.parser ? props.parser(raw) : Number(raw)
  const next = parsed === null || Number.isNaN(parsed) ? props.modelValue : normalize(parsed)
  innerText.value = next === null || next === undefined ? '' : format(next)
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
    emit('change', next)
  }
}

function onInput(e: Event) {
  editing.value = true
  innerText.value = (e.target as HTMLInputElement).value
  const parsed = props.parser ? props.parser(innerText.value) : Number(innerText.value)
  const next = innerText.value.trim() === '' ? null : parsed
  emit('input', next === null || Number.isNaN(next) ? props.modelValue : next)
}

/** 增减按钮 */
function step(delta: number) {
  if (props.disabled) return
  const base = props.modelValue ?? (props.min ?? 0)
  const next = normalize(base + delta * (props.step ?? 1))
  if (next === null) return
  innerText.value = format(next)
  emit('update:modelValue', next)
  emit('change', next)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    commit()
    inputRef.value?.blur()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    step(1)
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    step(-1)
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (editing.value) return
    innerText.value = v === null || v === undefined ? '' : format(v)
  },
  { immediate: true }
)

const canIncrease = computed(
  () => props.max === undefined || (props.modelValue ?? -Infinity) < props.max
)
const canDecrease = computed(
  () => props.min === undefined || (props.modelValue ?? Infinity) > props.min
)

function focus() {
  inputRef.value?.focus()
}
function blur() {
  inputRef.value?.blur()
}
function select() {
  inputRef.value?.select()
}

defineExpose({ focus, blur, select, input: inputRef })
</script>

<template>
  <div
    class="dmk-input-number"
    :class="[`s-${size}`, { 'is-disabled': disabled }]"
    role="spinbutton"
    :aria-valuenow="modelValue ?? undefined"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-disabled="disabled"
  >
    <button
      v-if="controls"
      type="button"
      class="dmk-input-number__btn is-down"
      :disabled="disabled || !canDecrease"
      aria-label="减少"
      tabindex="-1"
      @click="step(-1)"
    >
      <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M2.5 6h7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </svg>
    </button>

    <span class="dmk-input-number__field">
      <slot name="prefix" />
      <input
        ref="inputRef"
        class="dmk-input-number__input"
        type="text"
        inputmode="decimal"
        role="textbox"
        :value="innerText"
        :placeholder="placeholder"
        :disabled="disabled"
        :id="id"
        :name="name"
        :tabindex="tabindex"
        :aria-label="ariaLabel"
        @input="onInput"
        @blur="commit"
        @focus="(e) => emit('focus', e)"
        @keydown="onKeydown"
      />
      <slot name="suffix" />
    </span>

    <button
      v-if="controls"
      type="button"
      class="dmk-input-number__btn is-up"
      :disabled="disabled || !canIncrease"
      aria-label="增加"
      tabindex="-1"
      @click="step(1)"
    >
      <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M6 2.5v7M2.5 6h7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.dmk-input-number {
  display: inline-flex;
  align-items: stretch;
  overflow: hidden;
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  font-family: var(--dmk-font-family);
}

.dmk-input-number:focus-within {
  border-color: var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-input-number.is-disabled {
  opacity: 0.55;
}

.dmk-input-number__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  padding: 0;
  color: var(--dmk-color-text-muted);
  background: var(--dmk-color-bg);
  border: none;
  cursor: pointer;
  transition:
    color var(--dmk-duration-fast) var(--dmk-ease),
    background-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-input-number__btn svg {
  width: 12px;
  height: 12px;
}

.dmk-input-number__btn.is-down {
  border-right: 1px solid var(--dmk-color-border-subtle);
}

.dmk-input-number__btn.is-up {
  border-left: 1px solid var(--dmk-color-border-subtle);
}

.dmk-input-number__btn:hover:not(:disabled) {
  color: var(--dmk-color-primary);
  background: var(--dmk-color-surface-hover);
}

.dmk-input-number__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dmk-input-number__btn:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-input-number__field {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  padding: 0 var(--dmk-space-sm);
}

.dmk-input-number__input {
  width: 100%;
  min-width: 40px;
  height: var(--dmk-control-height);
  padding: 0;
  font-family: inherit;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text);
  background: transparent;
  border: none;
  outline: none;
  text-align: center;
}

.dmk-input-number__input:disabled {
  cursor: not-allowed;
}

.dmk-input-number.s-sm .dmk-input-number__input {
  height: var(--dmk-control-height-sm);
}

.dmk-input-number.s-lg .dmk-input-number__input {
  height: var(--dmk-control-height-lg);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-input-number__btn {
    transition: none;
  }
}
</style>
