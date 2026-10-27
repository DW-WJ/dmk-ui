<script setup lang="ts">
/**
 * DCheckboxGroup —— 复选框组。
 * 设计要点：modelValue 为 unknown[]；支持 options 配置式与默认插槽（DCheckbox 子组件）两种用法；
 * 通过 provide(Symbol('dmkCheckboxGroup')) 向子项下发选中态与 toggle（跨文件用 Symbol.for 保证同一注册表符号），
 * 点击子项向 group 发新数组（update:modelValue / change）。
 */
import { computed, provide, type ComputedRef, type InjectionKey } from 'vue'
import DCheckbox from './DCheckbox.vue'

interface CheckboxOption {
  label: string
  value: unknown
  disabled?: boolean
}

interface CheckboxGroupContext {
  modelValue: ComputedRef<unknown[]>
  disabled: ComputedRef<boolean>
  isChecked: (value: unknown) => boolean
  toggle: (value: unknown) => void
}

const CHECKBOX_GROUP_KEY: InjectionKey<CheckboxGroupContext> = Symbol.for('dmkCheckboxGroup')

const props = withDefaults(
  defineProps<{
    modelValue?: unknown[]
    disabled?: boolean
    direction?: 'horizontal' | 'vertical'
    options?: CheckboxOption[]
  }>(),
  {
    modelValue: () => [],
    disabled: false,
    direction: 'horizontal',
    options: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown[]]
  change: [value: unknown[]]
}>()

const currentValue = computed(() => props.modelValue ?? [])

function isChecked(value: unknown) {
  return currentValue.value.includes(value)
}

function toggle(value: unknown) {
  const current = currentValue.value
  const idx = current.findIndex((item) => item === value)
  const next = idx === -1 ? [...current, value] : current.filter((_, i) => i !== idx)
  emit('update:modelValue', next)
  emit('change', next)
}

provide(CHECKBOX_GROUP_KEY, {
  modelValue: currentValue,
  disabled: computed(() => props.disabled),
  isChecked,
  toggle
})
</script>

<template>
  <div
    class="dmk-checkbox-group"
    :class="[`d-${direction}`, { 'is-disabled': disabled }]"
    role="group"
  >
    <DCheckbox
      v-for="(opt, i) in options"
      :key="i"
      :value="opt.value"
      :label="opt.label"
      :disabled="opt.disabled || disabled"
    />
    <slot />
  </div>
</template>

<style scoped>
.dmk-checkbox-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--dmk-space-md) var(--dmk-space-lg);
  font-family: var(--dmk-font-family);
}

.dmk-checkbox-group.d-vertical {
  flex-direction: column;
  align-items: flex-start;
}

.dmk-checkbox-group.d-horizontal {
  flex-direction: row;
  align-items: center;
}
</style>
