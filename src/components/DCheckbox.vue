<script setup lang="ts">
/**
 * DCheckbox —— 复选框（可独立用，也可作为 DCheckboxGroup 子项）。
 * 设计要点：原生 input 视觉隐藏 + 自绘勾选框（保留原生 a11y / 键盘）；
 * indeterminate 显示短横线（原生 indeterminate 属性同步）；
 * 在 Group 内通过 Symbol('dmkCheckboxGroup') 注入联动（跨文件用 Symbol.for 保证同一注册表符号）。
 */
import {
  computed,
  inject,
  onMounted,
  ref,
  watch,
  type ComputedRef,
  type InjectionKey
} from 'vue'

interface CheckboxGroupContext {
  modelValue: ComputedRef<unknown[]>
  disabled: ComputedRef<boolean>
  isChecked: (value: unknown) => boolean
  toggle: (value: unknown) => void
}

const CHECKBOX_GROUP_KEY: InjectionKey<CheckboxGroupContext> = Symbol.for('dmkCheckboxGroup')

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    label?: string
    value?: unknown
    disabled?: boolean
    indeterminate?: boolean
  }>(),
  {
    modelValue: false,
    label: undefined,
    value: undefined,
    disabled: false,
    indeterminate: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

const group = inject(CHECKBOX_GROUP_KEY, null)
const nativeRef = ref<HTMLInputElement | null>(null)

const isDisabled = computed(() => props.disabled || (group?.disabled.value ?? false))
const isChecked = computed(() =>
  group ? group.isChecked(props.value) : Boolean(props.modelValue)
)
const showDash = computed(() => props.indeterminate && !isChecked.value)

watch(
  () => props.indeterminate,
  (v) => {
    if (nativeRef.value) nativeRef.value.indeterminate = Boolean(v)
  },
  { immediate: true }
)

onMounted(() => {
  if (nativeRef.value) nativeRef.value.indeterminate = Boolean(props.indeterminate)
})

function onChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (group) {
    group.toggle(props.value)
    emit('change', checked)
    // 交由 group 受控，回写原生勾选态避免视觉跳变
    if (nativeRef.value) nativeRef.value.checked = isChecked.value
    return
  }
  emit('update:modelValue', checked)
  emit('change', checked)
}
</script>

<template>
  <label
    class="dmk-checkbox"
    :class="{ 'is-checked': isChecked, 'is-disabled': isDisabled, 'is-indeterminate': showDash }"
  >
    <span class="dmk-checkbox__input">
      <input
        ref="nativeRef"
        class="dmk-checkbox__native"
        type="checkbox"
        :checked="isChecked"
        :disabled="isDisabled"
        :aria-checked="showDash ? 'mixed' : isChecked"
        @change="onChange"
      />
      <span class="dmk-checkbox__inner" aria-hidden="true">
        <svg v-if="isChecked" class="dmk-checkbox__mark" width="10" height="10" viewBox="0 0 10 10">
          <path
            d="M1.5 5.5l2.2 2.2L8.5 2.8"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span v-else-if="showDash" class="dmk-checkbox__dash" />
      </span>
    </span>
    <span v-if="label !== undefined || $slots.default" class="dmk-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped>
.dmk-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--dmk-space-sm);
  cursor: pointer;
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  color: var(--dmk-color-text);
  user-select: none;
}

.dmk-checkbox.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dmk-checkbox__input {
  position: relative;
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: none;
}

/* 原生 input：视觉隐藏但保留 a11y / 键盘焦点 */
.dmk-checkbox__native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

.dmk-checkbox__inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--dmk-color-border-strong);
  border-radius: var(--dmk-radius-sm);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-on-primary);
  transition:
    background-color var(--dmk-duration-fast) var(--dmk-ease),
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-checkbox:hover:not(.is-disabled) .dmk-checkbox__inner {
  border-color: var(--dmk-color-primary);
}

.dmk-checkbox.is-checked .dmk-checkbox__inner,
.dmk-checkbox.is-indeterminate .dmk-checkbox__inner {
  background: var(--dmk-color-primary);
  border-color: transparent;
}

.dmk-checkbox__native:focus-visible + .dmk-checkbox__inner {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-checkbox__mark {
  display: block;
}

.dmk-checkbox__dash {
  width: 8px;
  height: 2px;
  background: var(--dmk-color-on-primary);
}

.dmk-checkbox__label {
  line-height: 1.5;
}

@media (prefers-reduced-motion: reduce) {
  .dmk-checkbox__inner {
    transition: none;
  }
}
</style>
