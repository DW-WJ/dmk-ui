<script setup lang="ts">
/**
 * DText —— 文本。
 * 契约参考 Element Plus el-text：
 *   type（语义色）/ size（large|default|small）/ truncated（单行省略）/
 *   lineClamp（多行折叠行数）/ tag（自定义标签）。
 * 扩展：expose isTruncated —— 供外部按「是否真的被截断」决定要不要挂 Tooltip。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type Type = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
type Size = 'large' | 'default' | 'small'

const props = withDefaults(
  defineProps<{
    type?: Type
    size?: Size
    truncated?: boolean
    lineClamp?: string | number
    tag?: string
  }>(),
  {
    type: 'default',
    size: 'default',
    truncated: false,
    lineClamp: undefined,
    tag: 'span'
  }
)

const rootRef = ref<HTMLElement | null>(null)
const isTruncated = ref(false)

/** 有 lineClamp 时按多行判定，否则按单行判定 */
const clampLines = computed(() => {
  const raw = props.lineClamp
  if (raw === undefined || raw === '') return 0
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
})

const isMultiLine = computed(() => clampLines.value > 0)

/**
 * 判定是否真的发生截断：
 * 单行看 scrollWidth > clientWidth；多行看 scrollHeight > clientHeight。
 * ResizeObserver 挂在根节点上，容器尺寸变化时重新判定。
 */
let ro: ResizeObserver | null = null

function measure() {
  const el = rootRef.value
  if (!el) {
    isTruncated.value = false
    return
  }
  if (!props.truncated && !isMultiLine.value) {
    isTruncated.value = false
    return
  }
  isTruncated.value = isMultiLine.value
    ? el.scrollHeight > el.clientHeight + 1
    : el.scrollWidth > el.clientWidth + 1
}

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
    ro = new ResizeObserver(() => measure())
    ro.observe(rootRef.value)
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})

watch(
  () => [props.truncated, props.lineClamp, props.tag],
  () => {
    void Promise.resolve().then(measure)
  }
)

defineExpose({
  /** 文本是否真的被截断（未截断时为 false，可用于「仅截断时显示 Tooltip」） */
  isTruncated
})
</script>

<template>
  <component
    :is="tag"
    ref="rootRef"
    class="dmk-text"
    :class="[
      `dmk-text--${type}`,
      `dmk-text--${size}`,
      { 'is-truncated': truncated, 'is-clamped': isMultiLine }
    ]"
    :style="isMultiLine ? { '-webkit-line-clamp': String(clampLines) } : undefined"
  >
    <slot />
  </component>
</template>

<style scoped>
.dmk-text {
  font-family: var(--dmk-font-family);
  color: var(--dmk-color-text);
  font-size: var(--dmk-font-base);
  line-height: 1.5;
  word-break: break-word;
}

.dmk-text--default {
  color: var(--dmk-color-text);
}
.dmk-text--primary {
  color: var(--dmk-color-primary);
}
.dmk-text--success {
  color: var(--dmk-color-success);
}
.dmk-text--warning {
  color: var(--dmk-color-warning);
}
.dmk-text--danger {
  color: var(--dmk-color-danger);
}
.dmk-text--info {
  color: var(--dmk-color-info);
}

.dmk-text--large {
  font-size: var(--dmk-font-lg);
}
.dmk-text--default.dmk-text--default {
  font-size: var(--dmk-font-base);
}
.dmk-text--small {
  font-size: var(--dmk-font-sm);
}

/* 单行省略 */
.dmk-text.is-truncated {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/*
 * 多行折叠。
 * ⚠️ 旧写法 `display: -webkit-box` 已被 Chrome 废弃（computed display 会变成 flow-root，
 *    -webkit-line-clamp 直接失效）。现代写法：display:block + overflow:hidden +
 *    -webkit-box-orient:vertical + -webkit-line-clamp。
 */
.dmk-text.is-clamped {
  display: block;
  overflow: hidden;
  -webkit-box-orient: vertical;
}
</style>
