<script setup lang="ts">
/**
 * DTypography —— 排版层级展示。
 * 对应 Element Plus「Typography 字体规范」：把字体层级表做成可视化组件。
 *
 * Attributes:
 *   level（extra-small | small | base | medium | large | extra-large）/
 *   lineHeight（none | compact | regular | loose）/
 *   tag（自定义标签）
 */
type Level = 'extra-small' | 'small' | 'base' | 'medium' | 'large' | 'extra-large'
type LineHeight = 'none' | 'compact' | 'regular' | 'loose'

withDefaults(
  defineProps<{
    level?: Level
    lineHeight?: LineHeight
    tag?: string
  }>(),
  {
    level: 'base',
    lineHeight: 'regular',
    tag: 'span'
  }
)
</script>

<template>
  <component
    :is="tag"
    class="dmk-typography"
    :class="[`dmk-typography--${level}`, `dmk-typography--lh-${lineHeight}`]"
  >
    <slot />
  </component>
</template>

<style scoped>
.dmk-typography {
  font-family: var(--dmk-font-family);
  color: var(--dmk-color-text);
  font-weight: 400;
}

.dmk-typography--extra-small {
  font-size: 12px;
}
.dmk-typography--small {
  font-size: 13px;
}
.dmk-typography--base {
  font-size: 14px;
}
.dmk-typography--medium {
  font-size: 16px;
}
.dmk-typography--large {
  font-size: 18px;
}
.dmk-typography--extra-large {
  font-size: 20px;
}

/* 行高 */
.dmk-typography--lh-none {
  line-height: 1;
}
.dmk-typography--lh-compact {
  line-height: 1.3;
}
.dmk-typography--lh-regular {
  line-height: 1.5;
}
.dmk-typography--lh-loose {
  line-height: 1.7;
}
</style>
