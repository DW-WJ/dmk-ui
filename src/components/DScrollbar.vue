<script setup lang="ts">
/**
 * DScrollbar —— 自定义滚动条容器。
 * 契约参考 Element Plus el-scrollbar：
 *   Attributes: height / maxHeight / native / wrapStyle / wrapClass /
 *     viewStyle / viewClass / noresize / tag / always / minSize /
 *     id / role / ariaLabel / ariaOrientation / tabindex / distance
 *   Events: scroll（滚动距离）/ endReached（触底）
 *   Exposes: handleScroll / scrollTo / setScrollTop / setScrollLeft / update / wrapRef
 *
 * 实现：外层容器 overflow:auto 承担滚动，内层 view 承载内容；
 *      通过 scroll 事件同步滚动位置，渲染自定义滑块（thumb）。
 *      native=true 时退回浏览器原生滚动条（不渲染滑块）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    height?: string | number
    maxHeight?: string | number
    native?: boolean
    wrapStyle?: string | Record<string, string>
    wrapClass?: string
    viewStyle?: string | Record<string, string>
    viewClass?: string
    noresize?: boolean
    tag?: string
    always?: boolean
    minSize?: number
    id?: string
    role?: string
    ariaLabel?: string
    ariaOrientation?: 'horizontal' | 'vertical'
    tabindex?: number | string
    /** 触底判定距离 px */
    distance?: number
  }>(),
  {
    height: undefined,
    maxHeight: undefined,
    native: false,
    wrapStyle: undefined,
    wrapClass: undefined,
    viewStyle: undefined,
    viewClass: undefined,
    noresize: false,
    tag: 'div',
    always: false,
    minSize: 20,
    id: undefined,
    role: undefined,
    ariaLabel: undefined,
    ariaOrientation: undefined,
    tabindex: undefined,
    distance: 0
  }
)

const emit = defineEmits<{
  scroll: [payload: { scrollTop: number; scrollLeft: number }]
  endReached: []
}>()

const wrapRef = ref<HTMLElement | null>(null)
const viewRef = ref<HTMLElement | null>(null)

/** 滚动状态：用于渲染滑块位置 */
const scrollTop = ref(0)
const scrollLeft = ref(0)
const scrollHeight = ref(0)
const clientHeight = ref(0)
const scrollWidth = ref(0)
const clientWidth = ref(0)

/** 滑块尺寸与位置（百分比） */
const thumbHeight = computed(() => {
  if (!scrollHeight.value || !clientHeight.value) return 0
  return Math.max((clientHeight.value / scrollHeight.value) * 100, 0)
})
const thumbTop = computed(() => {
  const max = scrollHeight.value - clientHeight.value
  if (max <= 0) return 0
  return (scrollTop.value / max) * (100 - thumbHeight.value)
})
const thumbWidth = computed(() => {
  if (!scrollWidth.value || !clientWidth.value) return 0
  return Math.max((clientWidth.value / scrollWidth.value) * 100, 0)
})
const thumbLeft = computed(() => {
  const max = scrollWidth.value - clientWidth.value
  if (max <= 0) return 0
  return (scrollLeft.value / max) * (100 - thumbWidth.value)
})

/** 是否显示滑块（always 或确实可滚动） */
const showBar = computed(() => {
  if (props.native) return false
  if (props.always) return true
  return scrollHeight.value > clientHeight.value + 1 || scrollWidth.value > clientWidth.value + 1
})

function toSize(v: string | number | undefined): string | undefined {
  if (v === undefined) return undefined
  return typeof v === 'number' ? `${v}px` : v
}

const wrapStyle = computed(() => {
  const base: Record<string, string> = {
    overflowY: 'auto',
    overflowX: 'auto'
  }
  const h = toSize(props.height)
  const mh = toSize(props.maxHeight)
  if (h) base.height = h
  if (mh) base.maxHeight = mh
  return mergeStyle(base, props.wrapStyle)
})

/** 尺寸单位统一 */
/** 尺寸单位统一：把 string | Record 两种形式合并进基础样式 */
function mergeStyle(
  a: Record<string, string>,
  b: string | Record<string, string> | undefined
): Record<string, string> {
  return typeof b === 'object' && b !== null ? { ...a, ...b } : a
}

/** 滚动处理：更新状态 + 抛事件 + 触底判定 */
function handleScroll() {
  const el = wrapRef.value
  if (!el) return
  scrollTop.value = el.scrollTop
  scrollLeft.value = el.scrollLeft
  scrollHeight.value = el.scrollHeight
  clientHeight.value = el.clientHeight
  scrollWidth.value = el.scrollWidth
  clientWidth.value = el.clientWidth
  emit('scroll', { scrollTop: el.scrollTop, scrollLeft: el.scrollLeft })

  // 触底判定
  if (props.distance > 0) {
    const remain = el.scrollHeight - el.scrollTop - el.clientHeight
    if (remain <= props.distance) emit('endReached')
  } else if (el.scrollHeight - el.scrollTop - el.clientHeight <= 1) {
    emit('endReached')
  }
}

let ro: ResizeObserver | null = null

function update() {
  const el = wrapRef.value
  if (!el) return
  scrollHeight.value = el.scrollHeight
  clientHeight.value = el.clientHeight
  scrollWidth.value = el.scrollWidth
  clientWidth.value = el.clientWidth
}

onMounted(() => {
  update()
  if (typeof ResizeObserver !== 'undefined' && wrapRef.value && !props.noresize) {
    ro = new ResizeObserver(() => update())
    ro.observe(wrapRef.value)
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})

watch(() => [props.height, props.maxHeight, props.native], () => {
  void Promise.resolve().then(update)
})

/* ---------- exposes（对齐 EP） ---------- */
function scrollTo(options: ScrollToOptions) {
  wrapRef.value?.scrollTo(options)
}
function setScrollTop(value: number) {
  if (!wrapRef.value) return
  wrapRef.value.scrollTop = value
  handleScroll()
}
function setScrollLeft(value: number) {
  if (!wrapRef.value) return
  wrapRef.value.scrollLeft = value
  handleScroll()
}

defineExpose({
  handleScroll,
  scrollTo,
  setScrollTop,
  setScrollLeft,
  update,
  wrapRef
})
</script>

<template>
  <div
    ref="wrapRef"
    class="dmk-scrollbar"
    :class="{ 'is-native': native, 'is-always': always }"
    :style="wrapStyle"
    :id="id"
    :role="role"
    :aria-label="ariaLabel"
    :aria-orientation="ariaOrientation"
    :tabindex="tabindex"
    @scroll="handleScroll"
  >
    <component :is="tag" ref="viewRef" class="dmk-scrollbar__view" :class="viewClass" :style="mergeStyle({}, viewStyle)">
      <slot />
    </component>

    <template v-if="showBar">
      <div class="dmk-scrollbar__bar is-vertical" aria-hidden="true">
        <div
          class="dmk-scrollbar__thumb"
          :style="{ height: `${thumbHeight}%`, top: `${thumbTop}%` }"
        />
      </div>
      <div class="dmk-scrollbar__bar is-horizontal" aria-hidden="true">
        <div
          class="dmk-scrollbar__thumb"
          :style="{ width: `${thumbWidth}%`, left: `${thumbLeft}%` }"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.dmk-scrollbar {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.dmk-scrollbar__view {
  box-sizing: border-box;
}

/* 竖向滚动条 */
.dmk-scrollbar__bar {
  position: absolute;
  right: 2px;
  top: 2px;
  bottom: 2px;
  width: 6px;
  border-radius: 3px;
  opacity: 0;
  transition: opacity var(--dmk-duration-fast) var(--dmk-ease);
  pointer-events: none;
}

.dmk-scrollbar.is-always .dmk-scrollbar__bar {
  opacity: 1;
}

.dmk-scrollbar:hover .dmk-scrollbar__bar,
.dmk-scrollbar:focus-within .dmk-scrollbar__bar {
  opacity: 1;
}

.dmk-scrollbar__bar.is-horizontal {
  right: 2px;
  left: 2px;
  top: auto;
  bottom: 2px;
  width: auto;
  height: 6px;
}

.dmk-scrollbar__thumb {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--dmk-color-text-muted);
  opacity: 0.5;
}

.dmk-scrollbar__thumb:hover {
  opacity: 0.8;
}

@media (prefers-reduced-motion: reduce) {
  .dmk-scrollbar__bar {
    transition: none;
  }
}
</style>
