<script setup lang="ts">
/**
 * DBorder —— 边框样式展示。
 * 对应 Element Plus「Border 基础」规范页：把 border 样式 / 圆角 / 阴影三组
 * 规范做成可视化组件，方便文档站直接演示、也方便业务侧取用。
 *
 * Attributes:
 *   variant（solid | dashed | dashed-light）/ radius（none|small|base|large|round）/
 *   shadow（none | base | light | lighter | dark）
 */
withDefaults(
  defineProps<{
    variant?: 'solid' | 'dashed' | 'dashed-light'
    radius?: 'none' | 'small' | 'base' | 'large' | 'round'
    shadow?: 'none' | 'base' | 'light' | 'lighter' | 'dark'
    /** 内容区固定宽度（px），用于演示「宽度自定义」 */
    width?: number
  }>(),
  {
    variant: 'solid',
    radius: 'base',
    shadow: 'none',
    width: 100
  }
)
</script>

<template>
  <div
    class="dmk-border"
    :class="[
      `dmk-border--${variant}`,
      `dmk-border--radius-${radius}`,
      `dmk-border--shadow-${shadow}`
    ]"
    :style="{ width: `${width}px` }"
  >
    <slot />
  </div>
</template>

<style scoped>
.dmk-border {
  box-sizing: border-box;
  padding: var(--dmk-space-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  line-height: 1.5;
}

/* 线型 */
.dmk-border--solid {
  border: 1px solid var(--dmk-color-border);
}
.dmk-border--dashed {
  border: 2px dashed var(--dmk-color-primary);
}
.dmk-border--dashed-light {
  border: 2px dashed var(--dmk-color-text-muted);
}

/* 圆角 */
.dmk-border--radius-none {
  border-radius: 0;
}
.dmk-border--radius-small {
  border-radius: 2px;
}
.dmk-border--radius-base {
  border-radius: var(--dmk-radius-md);
}
.dmk-border--radius-large {
  border-radius: 12px;
}
.dmk-border--radius-round {
  border-radius: 20px;
}

/* 阴影 */
.dmk-border--shadow-none {
  box-shadow: none;
}
.dmk-border--shadow-base {
  box-shadow: var(--dmk-shadow-md);
}
.dmk-border--shadow-light {
  box-shadow: var(--dmk-shadow-sm);
}
.dmk-border--shadow-lighter {
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.dmk-border--shadow-dark {
  box-shadow: var(--dmk-shadow-lg);
}
</style>
