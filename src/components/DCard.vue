<script setup lang="ts">
/**
 * DCard —— 卡片容器。
 * 设计要点：header（标题/额外操作）+ body + footer 三段式语义结构；
 * shadow 三档（never/hover/always）映射 --dmk-shadow-* 令牌，
 * padding 控制主体内边距，bordered 控制描边。
 */
withDefaults(
  defineProps<{
    title?: string
    shadow?: 'never' | 'hover' | 'always'
    padding?: boolean
    bordered?: boolean
  }>(),
  {
    title: undefined,
    shadow: 'hover',
    padding: true,
    bordered: true
  }
)
</script>

<template>
  <section
    class="dmk-card"
    :class="[`dmk-card--shadow-${shadow}`, { 'is-bordered': bordered }]"
  >
    <header v-if="title || $slots.header || $slots.extra" class="dmk-card__header">
      <div class="dmk-card__title-wrap">
        <slot name="header">
          <h3 v-if="title" class="dmk-card__title">{{ title }}</h3>
        </slot>
      </div>
      <div v-if="$slots.extra" class="dmk-card__extra">
        <slot name="extra" />
      </div>
    </header>
    <div class="dmk-card__body" :class="{ 'is-padded': padding }">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="dmk-card__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.dmk-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text);
  font-family: var(--dmk-font-family);
  overflow: hidden;
  transition: box-shadow var(--dmk-duration-base) var(--dmk-ease);
}

.dmk-card.is-bordered {
  border: 1px solid var(--dmk-color-border);
}

.dmk-card--shadow-hover:hover {
  box-shadow: var(--dmk-shadow-md);
}

.dmk-card--shadow-always {
  box-shadow: var(--dmk-shadow-md);
}

.dmk-card__header {
  display: flex;
  align-items: center;
  gap: var(--dmk-space-md);
  padding: var(--dmk-space-lg);
  border-bottom: 1px solid var(--dmk-color-border-subtle);
}

.dmk-card__title-wrap {
  flex: 1;
  min-width: 0;
}

.dmk-card__title {
  margin: 0;
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-md);
  font-weight: 600;
  line-height: 1.4;
}

.dmk-card__extra {
  display: inline-flex;
  align-items: center;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
}

.dmk-card__body {
  flex: 1;
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-base);
}

.dmk-card__body.is-padded {
  padding: var(--dmk-space-lg);
}

.dmk-card__footer {
  padding: var(--dmk-space-md) var(--dmk-space-lg);
  border-top: 1px solid var(--dmk-color-border-subtle);
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-card {
    transition: none;
  }
}
</style>
