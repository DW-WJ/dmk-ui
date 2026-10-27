<script setup lang="ts">
/**
 * DAffix —— 固钉。
 * 契约参考 Element Plus el-affix：
 *   offset（偏移距离）/ position（top | bottom）/ target（目标容器 CSS 选择器）/
 *   zIndex / teleported / appendTo
 *   Events: change（固定状态变化）/ scroll（滚动时）
 *   Exposes: update（手动更新状态）/ updateRoot（更新 rootRect）
 *
 * 实现：占位元素撑开原布局，固定时把真实内容 position:fixed 挂到目标容器；
 *      滚动超过阈值才切换固定态（避免抖动）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    offset?: number
    position?: 'top' | 'bottom'
    target?: string
    zIndex?: number
    teleported?: boolean
    appendTo?: string
  }>(),
  {
    offset: 0,
    position: 'top',
    target: undefined,
    zIndex: 100,
    teleported: false,
    appendTo: 'body'
  }
)

const emit = defineEmits<{
  change: [state: { fixed: boolean; top: number; bottom: number; width: number; height: number }]
  scroll: [state: { fixed: boolean; top: number; bottom: number; width: number; height: number }]
}>()

/** 是否处于固定态 */
const fixed = ref(false)
/**
 * 固定态下的视口坐标（px）。
 * - fixedTop：距视口顶部的距离（贴容器顶边时 = 容器顶的视口坐标 + offset）
 * - fixedBottom：距视口底部的距离（贴容器底边时 = 视口高 - 容器底的视口坐标 + offset）
 */
const fixedTop = ref(0)
const fixedBottom = ref(0)
/**
 * 元素相对「容器内容顶部」的偏移（px），不随滚动变化。
 * 固定态下元素的 getBoundingClientRect 会变（被钉住了），
 * 所以进入固定态时把偏移缓存下来，解除固定时再重置。
 */
let cachedContentOffset: number | null = null
/** 占位元素（保持原布局高度） */
const placeholderRef = ref<HTMLElement | null>(null)
/** 固钉内容根 */
const rootRef = ref<HTMLElement | null>(null)
/**
 * 目标滚动容器。
 * ⚠️ 用普通变量而不是 ref：它只在事件回调里用，不需要响应式；
 *    而且 ref 存 DOM/Window 在部分环境下会被 unwrap 成非预期值。
 */
let scrollContainer: HTMLElement | Window | null = null

/** 目标容器 */
function resolveTarget(): HTMLElement | Window {
  if (props.target) {
    const el = document.querySelector<HTMLElement>(props.target)
    if (el) return el
  }
  return window
}

/** 更新固定状态 */
function update() {
  const root = rootRef.value
  const ph = placeholderRef.value
  if (!root || !ph) return

  const container = scrollContainer ?? resolveTarget()

  // 目标容器的滚动信息
  let containerRect: DOMRect | null = null
  let scrollTop = 0
  let clientHeight = 0
  if (container === window) {
    scrollTop = window.scrollY
    clientHeight = window.innerHeight
  } else {
    const el = container as HTMLElement
    containerRect = el.getBoundingClientRect()
    scrollTop = el.scrollTop
    clientHeight = el.clientHeight
  }

  const rect = root.getBoundingClientRect()

  let nextFixed = false
  let top = 0
  let bottom = 0

  const containerTop = containerRect ? containerRect.top : 0
  const containerBottom = containerRect ? containerRect.bottom : window.innerHeight

  // ⚠️ 判定必须基于【滚动量】，不能基于「元素到容器边界的距离」——
  //    固定态下元素被钉住，距离恒等于 offset，会和「是否固定」互相矛盾（抖动）。
  //    滚动量是单调的：滚过阈值就固定，往回滚就解除，两个方向天然对称。
  //
  // 元素相对容器内容顶部的偏移（不随滚动变化）——固定后 rect 变了，要用缓存值。
  if (!fixed.value || cachedContentOffset === null) {
    cachedContentOffset = rect.top - containerTop + scrollTop
  }
  const contentOffset = cachedContentOffset
  const elHeight = rect.height

  // 阈值：滚动量达到它就固定
  //   top    → 元素顶边滚到容器顶边（留 offset 间隙）
  //   bottom → 元素底边滚到容器底边（留 offset 间隙）
  //
  // ⚠️ bottom 的符号容易搞反：容器内滚动时内容【向上】移动，元素是从容器下方
  //    逐渐进入容器的。所以阈值是「元素底边触到容器底边」那一刻，
  //    即 s ≥ contentOffset + elHeight - clientHeight + offset。
  const threshold =
    props.position === 'top'
      ? contentOffset - props.offset
      : contentOffset + elHeight - clientHeight + props.offset

  nextFixed = scrollTop >= threshold

  if (nextFixed) {
    top = props.offset
    bottom = props.offset
    // 贴容器顶边 / 底边（fixed 相对视口，要换算成容器的视口坐标）
    fixedTop.value = containerTop + props.offset
    fixedBottom.value = window.innerHeight - containerBottom + props.offset
  } else {
    // 解除固定 → 重新记录元素的内容偏移
    cachedContentOffset = null
  }

  // 容器完全滚出视口 → 取消固定（否则固钉会孤零零留在视口上）
  if (nextFixed && containerRect) {
    if (containerRect.bottom <= 0 || containerRect.top >= window.innerHeight) nextFixed = false
  }

  const width = rect.width
  const height = rect.height

  if (nextFixed !== fixed.value) {
    fixed.value = nextFixed
    emit('change', { fixed: nextFixed, top, bottom, width, height })
  } else {
    emit('change', { fixed: nextFixed, top, bottom, width, height })
  }
}

function onScroll() {
  update()
  const root = rootRef.value
  if (!root) return
  const rect = root.getBoundingClientRect()
  emit('scroll', {
    fixed: fixed.value,
    top: props.position === 'top' ? props.offset : 0,
    bottom: props.position === 'bottom' ? props.offset : 0,
    width: rect.width,
    height: rect.height
  })
}

onMounted(() => {
  scrollContainer = resolveTarget()
  update()
  scrollContainer.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  scrollContainer?.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})

watch(() => [props.offset, props.position, props.target], () => {
  scrollContainer?.removeEventListener('scroll', onScroll)
  scrollContainer = resolveTarget()
  scrollContainer.addEventListener('scroll', onScroll, { passive: true })
  update()
})

/** 固定态的样式 */
const rootStyle = computed(() => {
  if (!fixed.value) return {}
  const base: Record<string, string> = {
    position: 'fixed',
    zIndex: String(props.zIndex)
  }
  // ⚠️ fixed 是相对**视口**定位的，而固钉要贴在【容器】的边界上。
  //    所以不能直接写 top: offset（那是视口顶部，不是容器顶部），
  //    必须换算成容器在视口中的实际位置。
  if (props.position === 'top') base.top = `${fixedTop.value}px`
  else base.bottom = `${fixedBottom.value}px`
  return base
})

/** 占位高度（固定时撑开原位置） */
const placeholderStyle = computed(() => {
  if (!fixed.value) return {}
  const root = rootRef.value
  if (!root) return {}
  const rect = root.getBoundingClientRect()
  return { width: `${rect.width}px`, height: `${rect.height}px` }
})

defineExpose({
  update,
  updateRoot: update
})
</script>

<template>
  <div ref="placeholderRef" class="dmk-affix" :style="placeholderStyle">
    <div ref="rootRef" class="dmk-affix__root" :style="rootStyle">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dmk-affix {
  position: relative;
  font-family: var(--dmk-font-family);
}

.dmk-affix__root {
  box-sizing: border-box;
}
</style>
