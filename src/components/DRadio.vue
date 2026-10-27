<script setup lang="ts">
/**
 * DRadio —— 单选框（可独立用，也可作为 DRadioGroup 子项）。
 * 设计要点：原生 input 视觉隐藏 + 自绘圆点（保留原生 a11y / 键盘方向键）；
 * 在 Group 内通过 Symbol('dmkRadioGroup') 注入联动（跨文件用 Symbol.for 保证同一注册表符号）；
 * name 缺省时回退到 group 的共享 name，保证原生同组互斥。
 */
import { computed, inject, ref, type ComputedRef, type InjectionKey } from 'vue'

interface RadioGroupContext {
  modelValue: ComputedRef<unknown>
  disabled: ComputedRef<boolean>
  name: string
  select: (value: unknown) => void
}

const RADIO_GROUP_KEY: InjectionKey<RadioGroupContext> = Symbol.for('dmkRadioGroup')

const props = withDefaults(
  defineProps<{
    value: unknown
    label?: string
    disabled?: boolean
    name?: string
  }>(),
  {
    label: undefined,
    disabled: false,
    name: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  change: [value: unknown]
}>()

const group = inject(RADIO_GROUP_KEY, null)
const localChecked = ref(false)

const isDisabled = computed(() => props.disabled || (group?.disabled.value ?? false))
const inputName = computed(() => props.name ?? group?.name)
const isChecked = computed(() =>
  group ? Object.is(group.modelValue.value, props.value) : localChecked.value
)

function onChange() {
  if (isDisabled.value) return
  if (group) {
    group.select(props.value)
  } else {
    localChecked.value = true
    emit('update:modelValue', props.value)
  }
  emit('change', props.value)
}
</script>

<template>
  <label class="dmk-radio" :class="{ 'is-checked': isChecked, 'is-disabled': isDisabled }">
    <span class="dmk-radio__input">
      <input
        class="dmk-radio__native"
        type="radio"
        :name="inputName"
        :value="String(value ?? '')"
        :checked="isChecked"
        :disabled="isDisabled"
        :aria-checked="isChecked"
        @change="onChange"
      />
      <span class="dmk-radio__inner" aria-hidden="true">
        <span class="dmk-radio__dot" />
      </span>
    </span>
    <span v-if="label !== undefined || $slots.default" class="dmk-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped>
.dmk-radio {
  display: inline-flex;
  align-items: center;
  gap: var(--dmk-space-sm);
  cursor: pointer;
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  color: var(--dmk-color-text);
  user-select: none;
}

.dmk-radio.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dmk-radio__input {
  position: relative;
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: none;
}

/* 原生 input：视觉隐藏但保留 a11y / 键盘焦点 */
.dmk-radio__native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

.dmk-radio__inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--dmk-color-border-strong);
  border-radius: 50%;
  background: var(--dmk-color-surface);
  transition:
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-radio:hover:not(.is-disabled) .dmk-radio__inner {
  border-color: var(--dmk-color-primary);
}

.dmk-radio.is-checked .dmk-radio__inner {
  border-color: var(--dmk-color-primary);
}

.dmk-radio__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dmk-color-primary);
  transform: scale(0);
  transition: transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-radio.is-checked .dmk-radio__dot {
  transform: scale(1);
}

.dmk-radio__native:focus-visible + .dmk-radio__inner {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-radio__label {
  line-height: 1.5;
}

@media (prefers-reduced-motion: reduce) {
  .dmk-radio__inner,
  .dmk-radio__dot {
    transition: none;
  }
}
</style>
