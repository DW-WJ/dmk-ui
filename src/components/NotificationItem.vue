<script setup lang="ts">
/**
 * NotificationItem —— 单条通知的呈现层。
 * 由 notification.ts 用 render() 挂载，样式与 DNotification 的服务层解耦。
 */
defineProps<{
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  closable: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="dmk-notification" :class="`dmk-notification--${type}`" role="alert">
    <span class="dmk-notification__dot" aria-hidden="true" />
    <div class="dmk-notification__body">
      <p class="dmk-notification__title">{{ title }}</p>
      <p v-if="message" class="dmk-notification__message">{{ message }}</p>
    </div>
    <button
      v-if="closable"
      type="button"
      class="dmk-notification__close"
      aria-label="关闭通知"
      @click="emit('close')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.dmk-notification {
  display: flex;
  align-items: flex-start;
  gap: var(--dmk-space-sm);
  width: 320px;
  padding: var(--dmk-space-md);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
  color: var(--dmk-color-text);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  pointer-events: auto;
}

.dmk-notification__dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--dmk-color-info);
}

.dmk-notification--success .dmk-notification__dot {
  background: var(--dmk-color-success);
}
.dmk-notification--warning .dmk-notification__dot {
  background: var(--dmk-color-warning);
}
.dmk-notification--error .dmk-notification__dot {
  background: var(--dmk-color-danger);
}

.dmk-notification__body {
  flex: 1 1 auto;
  min-width: 0;
}

.dmk-notification__title {
  margin: 0 0 2px;
  font-weight: 600;
  font-size: var(--dmk-font-base);
  line-height: 1.4;
}

.dmk-notification__message {
  margin: 0;
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-sm);
  line-height: 1.5;
  word-break: break-word;
}

.dmk-notification__close {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: var(--dmk-color-text-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.dmk-notification__close:hover {
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-text);
}

.dmk-notification__close:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}
</style>
