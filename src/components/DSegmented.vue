<script setup lang="ts">
/**
 * DSegmented —— 分段控制器。
 * 设计要点：一组互斥选项共用一条轨道，选中项用高亮块滑过（transform 过渡）；
 * 原生 button + role="radio" 承载键盘与读屏语义；options 支持简写与对象两种写法。
 */
import { computed, ref } from 'vue'

export interface SegmentedOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    /** 选项：字符串/数字简写，或对象数组 */
    options?: Array<string | number | SegmentedOption>
    /** 对象选项里的字段名（EP 同款 props 映射） */
    labelKey?: string
    valueKey?: string
    disabledKey?: string
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
    dir?: 'horizontal' | 'vertical'
    disabled?: boolean
    id?: string
    name?: string
    ariaLabel?: string
    tabindex?: number | string
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    labelKey: 'label',
    valueKey: 'value',
    disabledKey: 'disabled',
    size: 'md',
    block: false,
    dir: 'horizontal',
    disabled: false,
    id: undefined,
    name: undefined,
    ariaLabel: undefined,
    tabindex: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const rootRef = ref<HTMLElement | null>(null)

const normalized = computed<SegmentedOption[]>(() =>
  props.options.map((o) => {
    if (typeof o === 'string' || typeof o === 'number') {
      return { label: String(o), value: o }
    }
    const rec = o as unknown as Record<string, unknown>
    return {
      label: String(rec[props.labelKey] ?? ''),
      value: rec[props.valueKey] as string | number,
      disabled: Boolean(rec[props.disabledKey])
    }
  })
)

function isSelected(opt: SegmentedOption) {
  return Object.is(opt.value, props.modelValue)
}

function select(opt: SegmentedOption) {
  if (props.disabled || opt.disabled) return
  if (isSelected(opt)) return
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
}

/** ↑↓←→ 在选项间移动并选中 */
function onKey(e: KeyboardEvent, idx: number) {
  const n = normalized.value.length
  let target = -1
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') target = (idx + 1) % n
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') target = (idx - 1 + n) % n
  else if (e.key === 'Home') target = 0
  else if (e.key === 'End') target = n - 1
  if (target < 0) return
  e.preventDefault()
  select(normalized.value[target])
  const btns = rootRef.value?.querySelectorAll<HTMLButtonElement>('.dmk-segmented__item')
  btns?.[target]?.focus()
}

/* ---------- exposes ---------- */
function focus() {
  rootRef.value?.querySelector<HTMLButtonElement>('.dmk-segmented__item')?.focus()
}
function blur() {
  ;(document.activeElement as HTMLElement | null)?.blur()
}
const selectedIndex = computed(() =>
  normalized.value.findIndex((o) => isSelected(o))
)

defineExpose({ focus, blur, selectedIndex })
</script>

<template>
  <div
    ref="rootRef"
    class="dmk-segmented"
    :class="[`s-${size}`, `is-${dir}`, { 'is-block': block, 'is-disabled': disabled }]"
    role="radiogroup"
    :aria-label="ariaLabel"
  >
    <button
      v-for="(opt, i) in normalized"
      :key="String(opt.value)"
      type="button"
      class="dmk-segmented__item"
      :class="{ 'is-active': isSelected(opt), 'is-disabled': opt.disabled || disabled }"
      role="radio"
      :aria-checked="isSelected(opt)"
      :tabindex="isSelected(opt) ? 0 : -1"
      :disabled="opt.disabled || disabled"
      @click="select(opt)"
      @keydown="onKey($event, i)"
    >
      <slot name="label" :label="opt.label" :value="opt.value" :selected="isSelected(opt)">
        {{ opt.label }}
      </slot>
    </button>
  </div>
</template>

<style scoped>
.dmk-segmented {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: var(--dmk-color-bg);
  border: 1px solid var(--dmk-color-border-subtle);
  border-radius: var(--dmk-radius-md);
  font-family: var(--dmk-font-family);
}

.dmk-segmented.is-block {
  display: flex;
  width: 100%;
}

.dmk-segmented.is-vertical {
  flex-direction: column;
}

.dmk-segmented__item {
  flex: 1;
  min-height: 28px;
  padding: 4px 12px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--dmk-radius-sm);
  white-space: nowrap;
  cursor: pointer;
  transition:
    color var(--dmk-duration-fast) var(--dmk-ease),
    background-color var(--dmk-duration-fast) var(--dmk-ease),
    border-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-segmented__item:hover:not(.is-disabled) {
  color: var(--dmk-color-text);
}

.dmk-segmented__item.is-active {
  color: var(--dmk-color-primary);
  background: var(--dmk-color-surface);
  border-color: var(--dmk-color-border-focus);
  box-shadow: var(--dmk-shadow-sm);
}

.dmk-segmented__item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dmk-segmented__item:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

/* 尺寸 */
.dmk-segmented.s-sm .dmk-segmented__item {
  min-height: 24px;
  padding: 2px 9px;
  font-size: var(--dmk-font-sm);
}

.dmk-segmented.s-lg .dmk-segmented__item {
  min-height: 34px;
  padding: 6px 16px;
  font-size: var(--dmk-font-md);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-segmented__item {
    transition: none;
  }
}
</style>
