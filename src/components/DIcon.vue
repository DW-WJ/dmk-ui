<script setup lang="ts">
/**
 * DIcon —— 图标容器。
 * 契约参考 Element Plus el-icon：
 *   color（SVG fill）/ size（number|string，默认继承字号 1em）。
 * 扩展：name prop —— 直接用内置图标集（DmkIcons）里的名字渲染，
 *        省去业务侧自己写 SVG；也可用默认插槽塞任意 SVG。
 * 加载态：loading prop 让图标旋转（对应 EP 的 .is-loading 类）。
 */
import { computed } from 'vue'
import { DmkIcons } from '../lib/icons'

const props = withDefaults(
  defineProps<{
    /** 内置图标名（见 DmkIcons）；与插槽二选一 */
    name?: string
    color?: string
    size?: number | string
    /** 旋转加载态 */
    loading?: boolean
  }>(),
  {
    name: undefined,
    color: undefined,
    size: undefined,
    loading: false
  }
)

const def = computed(() => (props.name ? DmkIcons[props.name] : undefined))

const sizeStyle = computed(() => {
  if (props.size === undefined) return undefined
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})
</script>

<template>
  <span
    class="dmk-icon"
    :class="{ 'is-loading': loading, 'is-empty': !def && !$slots.default }"
    :style="sizeStyle ? { fontSize: sizeStyle, width: sizeStyle, height: sizeStyle } : undefined"
    aria-hidden="true"
  >
    <svg
      v-if="def"
      class="dmk-icon__svg"
      viewBox="0 0 1024 1024"
      :fill="color ?? 'currentColor'"
      focusable="false"
    >
      <path :d="def.d" />
    </svg>
    <slot v-else />
  </span>
</template>

<style scoped>
.dmk-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  line-height: 1;
  vertical-align: -0.125em;
  color: inherit;
}

.dmk-icon__svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.dmk-icon.is-empty {
  display: inline-block;
  border-radius: 50%;
  background: var(--dmk-color-border);
}

.dmk-icon.is-loading {
  animation: dmk-icon-spin 1.4s linear infinite;
}

@keyframes dmk-icon-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dmk-icon.is-loading {
    animation: none;
  }
}
</style>
