<script setup lang="ts">
/**
 * DInfiniteScroll —— 无限滚动容器。
 * 契约参考 Element Plus el-infinite-scroll（指令）：
 *   Attributes: load（加载回调）/ disabled / delay / distance / immediate
 *   Events: load
 *   Slots: default / loading（加载中占位）
 *
 * 与 EP 的差异：EP 只有指令 v-infinite-scroll，
 * 本组件额外提供容器形态（自带滚动区 + 加载态插槽），
 * 指令形态见 vInfiniteScroll（与 EP 用法一致）。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  DEFAULT_INFINITE_SCROLL_OPTIONS,
  isContentUnderfilled,
  isReachBottom,
  throttle
} from '../lib/infinite-scroll'

const props = withDefaults(
  defineProps<{
    /** 加载更多回调 */
    load?: () => void
    /** 是否禁用 */
    disabled?: boolean
    /** 节流延迟 ms */
    delay?: number
    /** 触底判定距离 px */
    distance?: number
    /** 内容不足以填满容器时立即触发 */
    immediate?: boolean
    /** 容器高度 */
    height?: string
  }>(),
  {
    load: undefined,
    disabled: false,
    delay: DEFAULT_INFINITE_SCROLL_OPTIONS.delay,
    distance: DEFAULT_INFINITE_SCROLL_OPTIONS.distance,
    immediate: DEFAULT_INFINITE_SCROLL_OPTIONS.immediate,
    height: '300px'
  }
)

const emit = defineEmits<{
  /** 触底时触发 */
  load: []
}>()

/** 容器元素 */
const containerRef = ref<HTMLElement | null>(null)
/** 节流后的触发 */
const trigger = throttle(() => {
  emit('load')
  props.load?.()
}, props.delay)

/** 滚动处理 */
function onScroll() {
  if (props.disabled) return
  const el = containerRef.value
  if (!el) return
  if (isReachBottom(el, props.distance)) trigger()
}

/** 内容变化后重新判断（immediate 模式下内容不足会再次触发） */
function checkImmediate() {
  if (props.disabled || !props.immediate) return
  const el = containerRef.value
  if (!el) return
  if (isContentUnderfilled(el)) {
    // 立即触发一次（不受节流限制的首触）
    emit('load')
    props.load?.()
  }
}

onMounted(() => {
  containerRef.value?.addEventListener('scroll', onScroll, { passive: true })
  checkImmediate()
})

onBeforeUnmount(() => {
  containerRef.value?.removeEventListener('scroll', onScroll)
  trigger.cancel()
})

watch(
  () => [props.disabled, props.delay, props.distance],
  () => {
    trigger.cancel()
  }
)

/** 容器样式 */
const containerStyle = {
  height: props.height,
  overflowY: 'auto' as const
}
</script>

<template>
  <div ref="containerRef" class="dmk-infinite-scroll" :style="containerStyle">
    <slot />
    <div v-if="$slots.loading" class="dmk-infinite-scroll__loading">
      <slot name="loading" />
    </div>
  </div>
</template>

<style scoped>
.dmk-infinite-scroll {
  position: relative;
  box-sizing: border-box;
  overflow-x: hidden;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  font-family: var(--dmk-font-family);
  color: var(--dmk-color-text);
}

.dmk-infinite-scroll__loading {
  padding: 12px;
  color: var(--dmk-color-text-muted);
  font-size: 13px;
  text-align: center;
}
</style>
