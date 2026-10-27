<script setup lang="ts">
/**
 * DRadioGroup —— 单选框组。
 * 设计要点：支持 options 配置式与默认插槽（DRadio 子组件）两种用法；
 * 通过 provide(Symbol('dmkRadioGroup')) 下发选中态与 select（跨文件用 Symbol.for 保证同一注册表符号）；
 * 向子项下发共享 name，保证原生同组互斥；容器 role="radiogroup"。
 */
import { computed, provide, type ComputedRef, type InjectionKey } from 'vue'
import DRadio from './DRadio.vue'

interface RadioOption {
  label: string
  value: unknown
  disabled?: boolean
}

interface RadioGroupContext {
  modelValue: ComputedRef<unknown>
  disabled: ComputedRef<boolean>
  name: string
  select: (value: unknown) => void
}

const RADIO_GROUP_KEY: InjectionKey<RadioGroupContext> = Symbol.for('dmkRadioGroup')

/* 组内共享 name：实例唯一（script setup 顶层变量按实例隔离，用随机串保证全局唯一） */
const groupName = `dmk-radio-group-${Math.random().toString(36).slice(2, 8)}`

const props = withDefaults(
  defineProps<{
    modelValue?: unknown
    disabled?: boolean
    direction?: 'horizontal' | 'vertical'
    options?: RadioOption[]
  }>(),
  {
    modelValue: undefined,
    disabled: false,
    direction: 'horizontal',
    options: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  change: [value: unknown]
}>()

const currentValue = computed(() => props.modelValue)

function select(value: unknown) {
  if (props.disabled) return
  emit('update:modelValue', value)
  emit('change', value)
}

provide(RADIO_GROUP_KEY, {
  modelValue: currentValue,
  disabled: computed(() => props.disabled),
  name: groupName,
  select
})
</script>

<template>
  <div
    class="dmk-radio-group"
    :class="[`d-${direction}`, { 'is-disabled': disabled }]"
    role="radiogroup"
  >
    <DRadio
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
.dmk-radio-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--dmk-space-md) var(--dmk-space-lg);
  font-family: var(--dmk-font-family);
}

.dmk-radio-group.d-vertical {
  flex-direction: column;
  align-items: flex-start;
}

.dmk-radio-group.d-horizontal {
  flex-direction: row;
  align-items: center;
}
</style>
