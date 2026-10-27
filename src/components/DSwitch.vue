<script setup lang="ts">
/**
 * DSwitch —— 开关。
 * 设计要点：轨道 + 滑块两层结构，滑块 transform 过渡；
 * 原生 button 承载 role="switch" + aria-checked（Space/Enter 天然可切换）；
 * loading 时显示旋转指示且禁用交互；activeText / inactiveText 在轨道内侧显示。
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    disabled?: boolean
    loading?: boolean
    size?: 'sm' | 'md'
    activeText?: string
    inactiveText?: string
  }>(),
  {
    modelValue: false,
    disabled: false,
    loading: false,
    size: 'md',
    activeText: '',
    inactiveText: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

const isChecked = computed(() => Boolean(props.modelValue))
const isDisabled = computed(() => props.disabled || props.loading)

function onToggle() {
  if (isDisabled.value) return
  const next = !isChecked.value
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <button
    type="button"
    class="dmk-switch"
    :class="[`s-${size}`, { 'is-checked': isChecked, 'is-disabled': disabled, 'is-loading': loading }]"
    role="switch"
    :aria-checked="isChecked"
    :aria-busy="loading ? 'true' : undefined"
    :disabled="isDisabled"
    @click="onToggle"
  >
    <span class="dmk-switch__track">
      <span v-if="activeText" class="dmk-switch__text is-on" aria-hidden="true">{{ activeText }}</span>
      <span v-if="inactiveText" class="dmk-switch__text is-off" aria-hidden="true">{{ inactiveText }}</span>
      <span class="dmk-switch__knob">
        <span v-if="loading" class="dmk-switch__spinner" aria-hidden="true" />
      </span>
    </span>
  </button>
</template>

<style scoped>
.dmk-switch {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--dmk-font-family);
}

.dmk-switch:focus-visible {
  outline: none;
}

.dmk-switch:focus-visible .dmk-switch__track {
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-switch.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dmk-switch.is-loading {
  cursor: progress;
}

.dmk-switch__track {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 44px;
  height: 22px;
  padding: 0 var(--dmk-space-xs);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-border-strong);
  transition:
    background-color var(--dmk-duration-base) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-switch.is-checked .dmk-switch__track {
  background: var(--dmk-color-primary);
}

.dmk-switch__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-sm);
  transition: transform var(--dmk-duration-base) var(--dmk-ease);
}

.dmk-switch.is-checked .dmk-switch__knob {
  transform: translateX(22px);
}

.dmk-switch__spinner {
  width: 10px;
  height: 10px;
  border: 2px solid var(--dmk-color-border-strong);
  border-top-color: var(--dmk-color-primary);
  border-radius: 50%;
  animation: dmk-switch-spin 0.6s linear infinite;
}

@keyframes dmk-switch-spin {
  to {
    transform: rotate(360deg);
  }
}

.dmk-switch__text {
  position: absolute;
  top: 0;
  bottom: 0;
  display: none;
  align-items: center;
  font-size: var(--dmk-font-sm);
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
}

.dmk-switch__text.is-on {
  left: var(--dmk-space-sm);
  color: var(--dmk-color-on-primary);
}

.dmk-switch__text.is-off {
  right: var(--dmk-space-sm);
  color: var(--dmk-color-text-secondary);
}

.dmk-switch.is-checked .dmk-switch__text.is-on {
  display: inline-flex;
}

.dmk-switch:not(.is-checked) .dmk-switch__text.is-off {
  display: inline-flex;
}

/* 尺寸 */
.dmk-switch.s-sm .dmk-switch__track {
  width: 36px;
  height: 18px;
}

.dmk-switch.s-sm .dmk-switch__knob {
  width: 14px;
  height: 14px;
}

.dmk-switch.s-sm.is-checked .dmk-switch__knob {
  transform: translateX(18px);
}

/* 有文案时加宽轨道，避免与滑块重叠 */
.dmk-switch:has(.dmk-switch__text) .dmk-switch__track {
  width: 64px;
}

.dmk-switch.s-sm:has(.dmk-switch__text) .dmk-switch__track {
  width: 56px;
}

@media (prefers-reduced-motion: reduce) {
  .dmk-switch__track,
  .dmk-switch__knob {
    transition: none;
  }

  .dmk-switch__spinner {
    animation-duration: 1.2s;
  }
}
</style>
