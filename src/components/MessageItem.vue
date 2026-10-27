<script setup lang="ts">
/**
 * MessageItem —— 全局消息条目（由 message.ts 函数式创建）。
 * 图标为内联 SVG（不用 emoji 做主视觉），入场淡入上移。
 */
withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'error'
    text: string
    closable?: boolean
  }>(),
  {
    type: 'info',
    closable: true
  }
)

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="dmk-message" :class="`t-${type}`" role="status">
    <svg v-if="type === 'success'" class="dmk-message__icon" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1.6" />
      <path d="M6 10.4l2.6 2.6L14 7.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <svg v-else-if="type === 'error'" class="dmk-message__icon" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1.6" />
      <path d="M7 7l6 6M13 7l-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>
    <svg v-else-if="type === 'warning'" class="dmk-message__icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.5l8 14.5H2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M10 8v3.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="10" cy="14" r="1" fill="currentColor" />
    </svg>
    <svg v-else class="dmk-message__icon" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1.6" />
      <path d="M10 9v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="10" cy="6" r="1" fill="currentColor" />
    </svg>
    <span class="dmk-message__text">{{ text }}</span>
    <button
      v-if="closable"
      type="button"
      class="dmk-message__close"
      aria-label="关闭"
      @click="emit('close')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.dmk-message {
  display: flex;
  align-items: center;
  gap: var(--dmk-space-sm);
  padding: var(--dmk-space-sm) var(--dmk-space-lg);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-md);
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-base);
  animation: dmk-message-in var(--dmk-duration-base) var(--dmk-ease);
}

.dmk-message.t-success {
  border-color: color-mix(in srgb, var(--dmk-color-success) 40%, transparent);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-success);
}

.dmk-message.t-error {
  border-color: color-mix(in srgb, var(--dmk-color-danger) 40%, transparent);
  color: var(--dmk-color-danger);
}

.dmk-message.t-warning {
  border-color: color-mix(in srgb, var(--dmk-color-warning) 40%, transparent);
  color: var(--dmk-color-warning);
}

.dmk-message.t-info {
  border-color: color-mix(in srgb, var(--dmk-color-info) 40%, transparent);
  color: var(--dmk-color-info);
}

.dmk-message__icon {
  width: 18px;
  height: 18px;
  flex: none;
}

.dmk-message__text {
  color: var(--dmk-color-text);
}

.dmk-message__close {
  margin-left: var(--dmk-space-sm);
  border: none;
  background: transparent;
  color: var(--dmk-color-text-muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.dmk-message__close:hover {
  color: var(--dmk-color-text);
}

@keyframes dmk-message-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dmk-message {
    animation: none;
  }
}
</style>
