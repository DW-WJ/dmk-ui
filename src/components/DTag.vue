<script setup lang="ts">
/**
 * DTag —— 标签。
 * 设计要点：6 种语义色 × 3 种效果（light/solid/outline），效果规则复用
 * 类型层注入的 --tag-color/--tag-subtle 局部变量，全部映射 --dmk-* 令牌；
 * closable 在右侧渲染可键盘触发的 ×按钮并 emit close。
 */
type Type = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
type Effect = 'light' | 'solid' | 'outline'

withDefaults(
  defineProps<{
    type?: Type
    effect?: Effect
    size?: 'sm' | 'md'
    closable?: boolean
    round?: boolean
  }>(),
  {
    type: 'default',
    effect: 'light',
    size: 'md',
    closable: false,
    round: false
  }
)

const emit = defineEmits<{
  close: [e: Event]
}>()

function onClose(e: Event) {
  emit('close', e)
}
</script>

<template>
  <span
    class="dmk-tag"
    :class="[`dmk-tag--${type}`, `dmk-tag--${effect}`, `dmk-tag--${size}`, { 'is-round': round }]"
  >
    <span class="dmk-tag__content">
      <slot />
    </span>
    <span
      v-if="closable"
      class="dmk-tag__close"
      role="button"
      tabindex="0"
      aria-label="关闭标签"
      @click="onClose"
      @keydown.enter.prevent="onClose"
      @keydown.space.prevent="onClose"
      >×</span
    >
  </span>
</template>

<style scoped>
.dmk-tag {
  /* 类型层：效果规则统一消费这两个局部变量 */
  --tag-color: var(--dmk-color-text-secondary);
  --tag-subtle: var(--dmk-color-surface-hover);

  display: inline-flex;
  align-items: center;
  gap: var(--dmk-space-xs);
  padding: var(--dmk-space-xs) var(--dmk-space-sm);
  border: 1px solid transparent;
  border-radius: var(--dmk-radius-sm);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  line-height: 1.5;
  white-space: nowrap;
  vertical-align: middle;
}

.dmk-tag--primary {
  --tag-color: var(--dmk-color-primary);
  --tag-subtle: var(--dmk-color-primary-subtle);
}

.dmk-tag--success {
  --tag-color: var(--dmk-color-success);
  --tag-subtle: var(--dmk-color-success-subtle);
}

.dmk-tag--warning {
  --tag-color: var(--dmk-color-warning);
  --tag-subtle: var(--dmk-color-warning-subtle);
}

.dmk-tag--danger {
  --tag-color: var(--dmk-color-danger);
  --tag-subtle: var(--dmk-color-danger-subtle);
}

.dmk-tag--info {
  --tag-color: var(--dmk-color-info);
  --tag-subtle: var(--dmk-color-info-subtle);
}

/* 效果 */
.dmk-tag--light {
  background: var(--tag-subtle);
  color: var(--tag-color);
}

.dmk-tag--solid {
  background: var(--tag-color);
  color: var(--dmk-color-text-inverse);
}

.dmk-tag--default.dmk-tag--solid {
  --tag-color: var(--dmk-color-text-secondary);
  background: var(--dmk-color-text-secondary);
}

.dmk-tag--outline {
  background: transparent;
  border-color: var(--tag-color);
  color: var(--tag-color);
}

/* 尺寸 */
.dmk-tag--sm {
  padding: 0 var(--dmk-space-xs);
  font-size: var(--dmk-font-sm);
}

.dmk-tag--md {
  padding: var(--dmk-space-xs) var(--dmk-space-sm);
}

.dmk-tag.is-round {
  border-radius: var(--dmk-radius-xl);
}

.dmk-tag__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  border-radius: var(--dmk-radius-sm);
  cursor: pointer;
  user-select: none;
  font-size: var(--dmk-font-sm);
  line-height: 1;
  transition:
    opacity var(--dmk-duration-fast) var(--dmk-ease),
    background-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-tag__close:hover {
  opacity: 0.75;
}

.dmk-tag__close:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-tag__close {
    transition: none;
  }
}
</style>
