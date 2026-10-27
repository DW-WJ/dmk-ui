<script lang="ts">
import type { InjectionKey, Ref } from 'vue'

export interface DFormContext {
  labelPosition: Readonly<Ref<'left' | 'top' | 'right'>>
  labelWidth: Readonly<Ref<string | undefined>>
  size: Readonly<Ref<'sm' | 'md' | 'lg'>>
  disabled: Readonly<Ref<boolean>>
}

export const DFormKey: InjectionKey<DFormContext> = Symbol('dmkForm')
</script>

<script setup lang="ts">
/**
 * DForm —— 表单布局容器（label 对齐/尺寸/禁用上下文）。
 * v0.1 只做布局与上下文分发，校验引擎（schema）是后续 dmk-form-schema 的钩子位：
 * DFormItem 的 error prop 直接展示服务端/校验错误，实现由外层驱动。
 */
import { computed, provide, toRef } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 表单数据对象（供未来 schema 引擎消费；v0.1 仅透传） */
    model?: Record<string, unknown>
    labelPosition?: 'left' | 'top' | 'right'
    labelWidth?: string | number
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
  }>(),
  {
    model: undefined,
    labelPosition: 'left',
    labelWidth: '96px',
    size: 'md',
    disabled: false
  }
)

const labelWidthStyle = computed(() =>
  typeof props.labelWidth === 'number' ? `${props.labelWidth}px` : props.labelWidth
)

provide(DFormKey, {
  labelPosition: toRef(props, 'labelPosition'),
  labelWidth: labelWidthStyle,
  size: toRef(props, 'size'),
  disabled: toRef(props, 'disabled')
})
</script>

<template>
  <form class="dmk-form" :class="[`lp-${labelPosition}`, `s-${size}`, { 'is-disabled': disabled }]" @submit.prevent>
    <slot />
  </form>
</template>

<style scoped>
.dmk-form {
  display: flex;
  flex-direction: column;
  gap: var(--dmk-space-lg);
  font-family: var(--dmk-font-family);
}

.dmk-form.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
