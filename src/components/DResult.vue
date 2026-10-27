<script setup lang="ts">
/**
 * DResult —— 结果页。
 * 设计要点：大图标 + 标题 + 副标题 + 额外操作区，四段都可插槽覆盖；
 * 内置 success/warning/info/error 四种图标。
 */
withDefaults(
  defineProps<{
    icon?: 'success' | 'warning' | 'info' | 'error'
    title?: string
    subtitle?: string
    size?: 'small' | 'default' | 'large'
    ariaLabel?: string
  }>(),
  {
    icon: 'success',
    title: '',
    subtitle: '',
    size: 'default',
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()
</script>

<template>
  <div class="dmk-result" :class="[`s-${size}`, `is-${icon}`]" :aria-label="ariaLabel" @click="(e) => emit('click', e)">
    <div class="dmk-result__icon" aria-hidden="true">
      <slot name="icon">
        <svg v-if="icon === 'success'" viewBox="0 0 48 48" focusable="false">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="2.5" />
          <path d="M14 24.5l7 7 13-14" fill="none" stroke="currentColor" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else-if="icon === 'warning'" viewBox="0 0 48 48" focusable="false">
          <path d="M24 6l19 34H5z" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linejoin="round" />
          <path d="M24 18v10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          <circle cx="24" cy="33" r="1.8" fill="currentColor" />
        </svg>
        <svg v-else-if="icon === 'error'" viewBox="0 0 48 48" focusable="false">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="2.5" />
          <path d="M17 17l14 14M31 17L17 31" fill="none" stroke="currentColor" stroke-width="3"
            stroke-linecap="round" />
        </svg>
        <svg v-else viewBox="0 0 48 48" focusable="false">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="2.5" />
          <path d="M24 22v12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          <circle cx="24" cy="15" r="1.8" fill="currentColor" />
        </svg>
      </slot>
    </div>
    <div v-if="$slots.title || title" class="dmk-result__title">
      <slot name="title">{{ title }}</slot>
    </div>
    <div v-if="$slots.subtitle || subtitle" class="dmk-result__subtitle">
      <slot name="subtitle">{{ subtitle }}</slot>
    </div>
    <div v-if="$slots.extra" class="dmk-result__extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<style scoped>
.dmk-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 16px;
  font-family: var(--dmk-font-family);
  text-align: center;
}

.dmk-result__icon svg {
  width: 56px;
  height: 56px;
  display: block;
}

.dmk-result.is-success .dmk-result__icon { color: var(--dmk-color-success); }
.dmk-result.is-warning .dmk-result__icon { color: var(--dmk-color-warning); }
.dmk-result.is-error .dmk-result__icon { color: var(--dmk-color-danger); }
.dmk-result.is-info .dmk-result__icon { color: var(--dmk-color-info); }

.dmk-result__title {
  font-size: var(--dmk-font-lg);
  font-weight: 600;
  color: var(--dmk-color-text);
}

.dmk-result__subtitle {
  max-width: 460px;
  font-size: var(--dmk-font-sm);
  line-height: 1.7;
  color: var(--dmk-color-text-muted);
}

.dmk-result__extra {
  margin-top: 6px;
}

.dmk-result.s-small .dmk-result__icon svg { width: 40px; height: 40px; }
.dmk-result.s-large .dmk-result__icon svg { width: 76px; height: 76px; }
.dmk-result.s-large .dmk-result__title { font-size: var(--dmk-font-lg); }
</style>
