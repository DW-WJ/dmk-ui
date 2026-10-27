<script setup lang="ts">
/**
 * DButton —— 基础按钮。
 * 契约参考件：后续组件的 props 风格/尺寸/状态/无障碍写法以本件为准。
 */
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'text'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    loading?: boolean
    disabled?: boolean
    block?: boolean
    nativeType?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'secondary',
    size: 'md',
    loading: false,
    disabled: false,
    block: false,
    nativeType: 'button'
  }
)

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <button
    :type="nativeType"
    class="dmk-btn"
    :class="[`v-${variant}`, `s-${size}`, { 'is-loading': loading, 'is-block': block }]"
    :disabled="isDisabled"
    :aria-busy="loading ? 'true' : undefined"
  >
    <span v-if="loading" class="dmk-btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.dmk-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: var(--dmk-control-height);
  padding: 0 var(--dmk-control-padding-x);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-base);
  font-family: var(--dmk-font-family);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--dmk-duration-fast) var(--dmk-ease),
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    color var(--dmk-duration-fast) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease),
    transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-btn:hover:not(:disabled) {
  border-color: var(--dmk-color-border-focus);
  color: var(--dmk-color-primary);
  background: var(--dmk-color-surface-hover);
}

.dmk-btn:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.dmk-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dmk-btn.v-primary {
  background: var(--dmk-color-primary);
  border-color: transparent;
  color: var(--dmk-color-on-primary);
  font-weight: 600;
}

.dmk-btn.v-primary:hover:not(:disabled) {
  background: var(--dmk-color-primary-hover);
  color: var(--dmk-color-on-primary);
  box-shadow: var(--dmk-shadow-primary);
}

.dmk-btn.v-primary:active:not(:disabled) {
  background: var(--dmk-color-primary-active);
}

.dmk-btn.v-danger {
  background: var(--dmk-color-danger-subtle);
  border-color: color-mix(in srgb, var(--dmk-color-danger) 45%, transparent);
  color: var(--dmk-color-danger);
}

.dmk-btn.v-danger:hover:not(:disabled) {
  background: var(--dmk-color-danger);
  border-color: transparent;
  color: var(--dmk-color-text-inverse);
}

.dmk-btn.v-ghost {
  background: transparent;
  border-color: var(--dmk-color-border-focus);
  color: var(--dmk-color-primary);
}

.dmk-btn.v-ghost:hover:not(:disabled) {
  background: var(--dmk-color-primary-subtle);
}

.dmk-btn.v-text {
  background: transparent;
  border-color: transparent;
  color: var(--dmk-color-primary);
  padding: 0 calc(var(--dmk-control-padding-x) * 0.5);
}

.dmk-btn.v-text:hover:not(:disabled) {
  background: var(--dmk-color-primary-subtle);
  border-color: transparent;
  color: var(--dmk-color-primary);
}

.dmk-btn.s-sm {
  min-height: var(--dmk-control-height-sm);
  padding: 0 calc(var(--dmk-control-padding-x) * 0.75);
  font-size: var(--dmk-font-sm);
}

.dmk-btn.s-lg {
  min-height: var(--dmk-control-height-lg);
  padding: 0 calc(var(--dmk-control-padding-x) * 1.5);
  font-size: var(--dmk-font-md);
}

.dmk-btn.is-block {
  display: flex;
  width: 100%;
}

.dmk-btn.is-loading {
  cursor: progress;
}

.dmk-btn__spinner {
  width: 0.85em;
  height: 0.85em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: dmk-btn-spin 0.6s linear infinite;
}

@keyframes dmk-btn-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dmk-btn,
  .dmk-btn__spinner {
    transition: none;
    animation-duration: 1.2s;
  }
}
</style>
