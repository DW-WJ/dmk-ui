<script setup lang="ts">
/**
 * DEmpty —— 空状态。
 * 设计要点：内联灰阶 SVG 空盒子插画（currentColor + 令牌色，随主题自适应）；
 * image / description / default（操作按钮）三段插槽，尺寸两档。
 */
withDefaults(
  defineProps<{
    description?: string
    size?: 'sm' | 'md'
  }>(),
  {
    description: '暂无数据',
    size: 'md'
  }
)
</script>

<template>
  <div class="dmk-empty" :class="`dmk-empty--${size}`">
    <div class="dmk-empty__image-wrap">
      <slot name="image">
        <svg class="dmk-empty__image" viewBox="0 0 160 120" fill="none" aria-hidden="true">
          <!-- 打开的盒子：等距三面 -->
          <path
            d="M80 34 L128 56 L80 78 L32 56 Z"
            fill="currentColor"
            fill-opacity="0.18"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path
            d="M32 56 V88 L80 110 V78 Z"
            fill="currentColor"
            fill-opacity="0.1"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path
            d="M128 56 V88 L80 110 V78 Z"
            fill="currentColor"
            fill-opacity="0.06"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <!-- 漂浮点缀 -->
          <circle cx="56" cy="22" r="3" fill="currentColor" fill-opacity="0.35" />
          <circle cx="80" cy="13" r="2.5" fill="currentColor" fill-opacity="0.25" />
          <circle cx="104" cy="22" r="3" fill="currentColor" fill-opacity="0.35" />
        </svg>
      </slot>
    </div>
    <p class="dmk-empty__description">
      <slot name="description">{{ description }}</slot>
    </p>
    <div v-if="$slots.default" class="dmk-empty__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dmk-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--dmk-space-md);
  padding: var(--dmk-space-xl) var(--dmk-space-lg);
  font-family: var(--dmk-font-family);
  text-align: center;
}

.dmk-empty__image {
  width: 160px;
  height: 120px;
  color: var(--dmk-color-border-strong);
}

.dmk-empty__description {
  margin: 0;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-base);
  line-height: 1.6;
}

.dmk-empty__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--dmk-space-sm);
  margin-top: var(--dmk-space-xs);
}

.dmk-empty--sm {
  padding: var(--dmk-space-lg) var(--dmk-space-md);
  gap: var(--dmk-space-sm);
}

.dmk-empty--sm .dmk-empty__image {
  width: 120px;
  height: 90px;
}

.dmk-empty--sm .dmk-empty__description {
  font-size: var(--dmk-font-sm);
}
</style>
