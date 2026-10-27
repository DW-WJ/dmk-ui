<script setup lang="ts">
/**
 * DBadge —— 角标。
 * 设计要点：有默认插槽时包裹内容并绝对定位到右上角，无插槽时独立渲染；
 * dot 渲染小圆点，数值超过 max 时折叠为 "max+"，hidden 直接不渲染。
 */
import { computed } from 'vue'

type Type = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'

const props = withDefaults(
  defineProps<{
    value?: number | string
    max?: number
    dot?: boolean
    hidden?: boolean
    type?: Type
  }>(),
  {
    value: 0,
    max: 99,
    dot: false,
    hidden: false,
    type: 'primary'
  }
)

const displayText = computed(() => {
  if (props.dot) return ''
  if (typeof props.value === 'number') {
    return props.max > 0 && props.value > props.max ? `${props.max}+` : String(props.value)
  }
  return String(props.value ?? '')
})
</script>

<template>
  <span v-if="!hidden && $slots.default" class="dmk-badge">
    <slot />
    <span
      class="dmk-badge__content"
      :class="[`dmk-badge__content--${type}`, { 'is-dot': dot }]"
      :aria-hidden="dot ? 'true' : undefined"
    >{{ displayText }}</span>
  </span>
  <span
    v-else-if="!hidden"
    class="dmk-badge__content dmk-badge__content--static"
    :class="[`dmk-badge__content--${type}`, { 'is-dot': dot }]"
    :aria-hidden="dot ? 'true' : undefined"
  >{{ displayText }}</span>
</template>

<style scoped>
.dmk-badge {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
  font-family: var(--dmk-font-family);
}

.dmk-badge__content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--dmk-space-xs);
  border-radius: var(--dmk-radius-lg);
  color: var(--dmk-color-text-inverse);
  font-size: var(--dmk-font-sm);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.dmk-badge > .dmk-badge__content {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  z-index: 1;
}

.dmk-badge__content--static {
  position: static;
  transform: none;
}

.dmk-badge__content--primary {
  background: var(--dmk-color-primary);
}

.dmk-badge__content--success {
  background: var(--dmk-color-success);
}

.dmk-badge__content--warning {
  background: var(--dmk-color-warning);
}

.dmk-badge__content--danger {
  background: var(--dmk-color-danger);
}

.dmk-badge__content--info {
  background: var(--dmk-color-info);
}

.dmk-badge__content--default {
  background: var(--dmk-color-text-secondary);
}

.dmk-badge__content.is-dot {
  min-width: 8px;
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: 50%;
}
</style>
