<script setup lang="ts">
/**
 * DAlert —— 警告提示条。
 * 设计要点：light 效果 = 状态浅色底（*-subtle）+ 彩色描边/图标；
 * solid 效果 = 状态实色底 + 反白文字；图标为内联 SVG（不用 emoji 做主视觉）；
 * 插槽：title / default（描述）/ icon；closable 时显示关闭按钮，emit close。
 */
import { computed, ref } from 'vue'

type Type = 'info' | 'success' | 'warning' | 'danger'
type Effect = 'light' | 'solid'

const props = withDefaults(
  defineProps<{
    type?: Type
    title?: string
    description?: string
    closable?: boolean
    showIcon?: boolean
    effect?: Effect
  }>(),
  {
    type: 'info',
    title: undefined,
    description: undefined,
    closable: false,
    showIcon: true,
    effect: 'light'
  }
)

const emit = defineEmits<{
  close: []
}>()

const closed = ref(false)
const role = computed(() => (props.type === 'danger' || props.type === 'warning' ? 'alert' : 'status'))

function onClose() {
  closed.value = true
  emit('close')
}
</script>

<template>
  <div
    v-if="!closed"
    class="dmk-alert"
    :class="[`t-${type}`, `e-${effect}`]"
    :role="role"
  >
    <span v-if="showIcon" class="dmk-alert__icon" aria-hidden="true">
      <slot name="icon">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <!-- info -->
          <g v-if="type === 'info'">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path d="M8 7.2v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            <circle cx="8" cy="4.8" r="0.9" fill="currentColor" />
          </g>
          <!-- success -->
          <g v-else-if="type === 'success'">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path
              d="M5 8.2l2 2 4-4.2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
          <!-- warning -->
          <g v-else-if="type === 'warning'">
            <path
              d="M8 2l6 11H2L8 2z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linejoin="round"
            />
            <path d="M8 6.2v3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            <circle cx="8" cy="11.2" r="0.9" fill="currentColor" />
          </g>
          <!-- danger -->
          <g v-else>
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path
              d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </g>
        </svg>
      </slot>
    </span>

    <div class="dmk-alert__body">
      <div v-if="title !== undefined || $slots.title" class="dmk-alert__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="description !== undefined || $slots.default" class="dmk-alert__description">
        <slot>{{ description }}</slot>
      </div>
    </div>

    <button
      v-if="closable"
      type="button"
      class="dmk-alert__close"
      aria-label="关闭提示"
      @click="onClose"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path
          d="M2.5 2.5l7 7M9.5 2.5l-7 7"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.dmk-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--dmk-space-sm);
  padding: var(--dmk-space-md) var(--dmk-space-lg);
  border: 1px solid transparent;
  border-radius: var(--dmk-radius-md);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  line-height: 1.6;
}

/* ---- light：浅色底 + 彩色描边/图标 ---- */
.dmk-alert.e-light.t-info {
  background: var(--dmk-color-info-subtle);
  border-color: var(--dmk-color-info);
  color: var(--dmk-color-text);
}

.dmk-alert.e-light.t-info .dmk-alert__icon {
  color: var(--dmk-color-info);
}

.dmk-alert.e-light.t-success {
  background: var(--dmk-color-success-subtle);
  border-color: var(--dmk-color-success);
  color: var(--dmk-color-text);
}

.dmk-alert.e-light.t-success .dmk-alert__icon {
  color: var(--dmk-color-success);
}

.dmk-alert.e-light.t-warning {
  background: var(--dmk-color-warning-subtle);
  border-color: var(--dmk-color-warning);
  color: var(--dmk-color-text);
}

.dmk-alert.e-light.t-warning .dmk-alert__icon {
  color: var(--dmk-color-warning);
}

.dmk-alert.e-light.t-danger {
  background: var(--dmk-color-danger-subtle);
  border-color: var(--dmk-color-danger);
  color: var(--dmk-color-text);
}

.dmk-alert.e-light.t-danger .dmk-alert__icon {
  color: var(--dmk-color-danger);
}

/* ---- solid：实色底 + 反白文字 ---- */
.dmk-alert.e-solid {
  color: var(--dmk-color-on-primary);
}

.dmk-alert.e-solid.t-info {
  background: var(--dmk-color-info);
  border-color: transparent;
}

.dmk-alert.e-solid.t-success {
  background: var(--dmk-color-success);
  border-color: transparent;
}

.dmk-alert.e-solid.t-warning {
  background: var(--dmk-color-warning);
  border-color: transparent;
}

.dmk-alert.e-solid.t-danger {
  background: var(--dmk-color-danger);
  border-color: transparent;
}

.dmk-alert.e-solid .dmk-alert__icon,
.dmk-alert.e-solid .dmk-alert__close {
  color: var(--dmk-color-on-primary);
}

.dmk-alert__icon {
  display: inline-flex;
  align-items: center;
  flex: none;
  margin-top: 2px;
}

.dmk-alert__body {
  flex: 1;
  min-width: 0;
}

.dmk-alert__title {
  font-weight: 600;
  font-size: var(--dmk-font-md);
}

.dmk-alert__description {
  color: inherit;
  opacity: 0.85;
}

.dmk-alert__title + .dmk-alert__description {
  margin-top: var(--dmk-space-xs);
}

.dmk-alert__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--dmk-color-text-muted);
  cursor: pointer;
  transition: color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-alert__close:hover {
  color: var(--dmk-color-text);
}

.dmk-alert.e-solid .dmk-alert__close:hover {
  color: var(--dmk-color-on-primary);
  opacity: 0.85;
}

.dmk-alert__close:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
  border-radius: var(--dmk-radius-sm);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-alert__close {
    transition: none;
  }
}
</style>
