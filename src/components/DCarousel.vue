<script setup lang="ts">
/**
 * DCarousel —— 轮播容器。
 * 契约参考 Element Plus el-carousel：
 *   Attributes: height / initialIndex / trigger / autoplay / interval /
 *               indicatorPosition / arrow / type / cardScale / loop / direction /
 *               pauseOnHover / motionBlur
 *   Events: change（新下标, 旧下标）
 *   Slots: default（放 DCarouselItem）
 *   Exposes: activeIndex / setActiveItem / prev / next
 */
import { computed, onBeforeUnmount, provide, ref, watch } from 'vue'
import { CAROUSEL_REGISTRY_KEY, type CarouselRegistry } from '../lib/carousel'

const props = withDefaults(
  defineProps<{
    /** 轮播高度；'auto' 时按子项自适应 */
    height?: string
    /** 初始激活下标 */
    initialIndex?: number
    /** 指示器触发方式 */
    trigger?: 'hover' | 'click'
    /** 是否自动播放 */
    autoplay?: boolean
    /** 自动播放间隔 ms */
    interval?: number
    /** 指示器位置：'' 内置 / outside 外部 / none 隐藏 */
    indicatorPosition?: '' | 'outside' | 'none'
    /** 箭头显示时机 */
    arrow?: 'hover' | 'always' | 'never'
    /** 类型：'' 普通 / card 卡片 */
    type?: '' | 'card'
    /** 卡片模式次要卡片的缩放比 */
    cardScale?: number
    /** 是否循环 */
    loop?: boolean
    /** 排列方向 */
    direction?: 'horizontal' | 'vertical'
    /** 悬停时暂停自动播放 */
    pauseOnHover?: boolean
    /** 运动模糊 */
    motionBlur?: boolean
  }>(),
  {
    height: '',
    initialIndex: 0,
    trigger: 'hover',
    autoplay: true,
    interval: 3000,
    indicatorPosition: '',
    arrow: 'hover',
    type: '',
    cardScale: 0.83,
    loop: true,
    direction: 'horizontal',
    pauseOnHover: true,
    motionBlur: false
  }
)

const emit = defineEmits<{
  /** 切换时触发（新下标, 旧下标） */
  change: [newIndex: number, oldIndex: number]
}>()

/** 当前激活下标 */
const activeIndex = ref(props.initialIndex)
/** 子项总数 */
const count = ref(0)
/** 悬停中（用于箭头显隐与暂停） */
const hovering = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

/** 跳到指定下标 */
function goTo(index: number) {
  const total = count.value
  if (total <= 0) return
  let target = index
  if (props.loop) {
    target = ((index % total) + total) % total
  } else {
    target = Math.min(Math.max(index, 0), total - 1)
  }
  if (target === activeIndex.value) return
  const old = activeIndex.value
  activeIndex.value = target
  emit('change', target, old)
}

/** 上一张 */
function prev() {
  const total = count.value
  if (!total) return
  if (props.loop) goTo(activeIndex.value - 1)
  else if (activeIndex.value > 0) goTo(activeIndex.value - 1)
}

/** 下一张 */
function next() {
  const total = count.value
  if (!total) return
  if (props.loop) goTo(activeIndex.value + 1)
  else if (activeIndex.value < total - 1) goTo(activeIndex.value + 1)
}

/** 按名字跳到（EP 的 setActiveItem 支持传 name） */
function setActiveItem(indexOrName: number | string) {
  if (typeof indexOrName === 'number') {
    goTo(indexOrName)
    return
  }
  // 按 name 找下标：子项通过 DOM 属性暴露
  const els = rootRef.value?.querySelectorAll<HTMLElement>('[data-carousel-item]')
  if (!els) return
  for (let i = 0; i < els.length; i++) {
    if (els[i].dataset.carouselName === indexOrName) {
      goTo(i)
      return
    }
  }
}

/** 提供给子项的注册接口 */
const registry: CarouselRegistry = {
  activeIndex,
  count,
  goTo,
  register: () => {
    count.value += 1
  },
  unregister: () => {
    count.value = Math.max(0, count.value - 1)
  }
}

provide(CAROUSEL_REGISTRY_KEY, registry)

/** 容器元素 */
const rootRef = ref<HTMLElement | null>(null)

/** 自动播放 */
function startTimer() {
  stopTimer()
  if (!props.autoplay || props.interval <= 0) return
  timer = setInterval(() => {
    if (props.pauseOnHover && hovering.value) return
    next()
  }, props.interval)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  () => [props.autoplay, props.interval],
  () => {
    startTimer()
  },
  { immediate: true }
)

onBeforeUnmount(() => stopTimer())

/** 轨道位移 */
const trackStyle = computed(() => {
  const offset = props.direction === 'horizontal' ? activeIndex.value * 100 : activeIndex.value * 100
  return {
    transform: `translate${props.direction === 'horizontal' ? 'X' : 'Y'}(-${offset}%)`,
    transition: 'transform 0.5s var(--dmk-ease)'
  }
})

/** 容器高度 */
const rootStyle = computed(() => {
  if (!props.height) return {}
  if (props.height === 'auto') return {}
  return { height: props.height }
})

/** 箭头是否显示 */
const arrowVisible = computed(() => {
  if (props.arrow === 'always') return true
  if (props.arrow === 'never') return false
  return hovering.value
})

/** 指示器列表（用 DOM 子项数兜底，count 可能还没注册完） */
const indicatorCount = computed(() => count.value)

defineExpose({
  /** 当前激活下标 */
  activeIndex,
  /** 跳到指定项（下标或 name） */
  setActiveItem,
  prev,
  next
})
</script>

<template>
  <div
    ref="rootRef"
    class="dmk-carousel"
    :class="[
      `dmk-carousel--${direction}`,
      `dmk-carousel--${type || 'default'}`,
      { 'is-hovering': hovering, 'has-arrow': arrowVisible }
    ]"
    :style="rootStyle"
    role="region"
    aria-roledescription="carousel"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <div class="dmk-carousel__track" :style="trackStyle">
      <slot />
    </div>

    <!-- 箭头 -->
    <button
      v-if="arrowVisible"
      type="button"
      class="dmk-carousel__arrow dmk-carousel__arrow--prev"
      aria-label="上一张"
      @click="prev"
    >
      ‹
    </button>
    <button
      v-if="arrowVisible"
      type="button"
      class="dmk-carousel__arrow dmk-carousel__arrow--next"
      aria-label="下一张"
      @click="next"
    >
      ›
    </button>

    <!-- 指示器（内置） -->
    <div
      v-if="indicatorPosition !== 'none' && indicatorPosition !== 'outside'"
      class="dmk-carousel__indicators"
      role="tablist"
    >
      <button
        v-for="i in indicatorCount"
        :key="i"
        type="button"
        class="dmk-carousel__indicator"
        :class="{ 'is-active': activeIndex === i - 1 }"
        role="tab"
        :aria-selected="activeIndex === i - 1"
        :aria-label="`第 ${i} 张`"
        @click="trigger === 'click' && goTo(i - 1)"
        @mouseenter="trigger === 'hover' && goTo(i - 1)"
      />
    </div>

    <!-- 指示器（外部） -->
    <div
      v-if="indicatorPosition === 'outside'"
      class="dmk-carousel__indicators dmk-carousel__indicators--outside"
      role="tablist"
    >
      <button
        v-for="i in indicatorCount"
        :key="i"
        type="button"
        class="dmk-carousel__indicator"
        :class="{ 'is-active': activeIndex === i - 1 }"
        role="tab"
        :aria-selected="activeIndex === i - 1"
        :aria-label="`第 ${i} 张`"
        @click="trigger === 'click' && goTo(i - 1)"
        @mouseenter="trigger === 'hover' && goTo(i - 1)"
      />
    </div>
  </div>
</template>

<style scoped>
.dmk-carousel {
  position: relative;
  overflow: hidden;
  width: 100%;
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-bg-muted);
  font-family: var(--dmk-font-family);
}

.dmk-carousel__track {
  display: flex;
  width: 100%;
  height: 100%;
}

.dmk-carousel--vertical .dmk-carousel__track {
  flex-direction: column;
}

.dmk-carousel__arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  transform: translateY(-50%);
  border: none;
  border-radius: 50%;
  background: rgb(0 0 0 / 38%);
  color: #fff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: opacity var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-carousel__arrow:hover {
  background: rgb(0 0 0 / 55%);
}

.dmk-carousel__arrow--prev {
  left: 12px;
}

.dmk-carousel__arrow--next {
  right: 12px;
}

.dmk-carousel__indicators {
  position: absolute;
  bottom: 12px;
  left: 50%;
  z-index: 2;
  display: flex;
  gap: 6px;
  transform: translateX(-50%);
}

.dmk-carousel__indicators--outside {
  position: static;
  justify-content: center;
  padding: 10px 0 0;
  transform: none;
}

.dmk-carousel__indicator {
  width: 18px;
  height: 4px;
  padding: 0;
  border: none;
  border-radius: 2px;
  background: rgb(255 255 255 / 45%);
  cursor: pointer;
  transition:
    background-color var(--dmk-duration-fast) var(--dmk-ease),
    width var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-carousel__indicator.is-active {
  width: 24px;
  background: #fff;
}

.dmk-carousel__indicators--outside .dmk-carousel__indicator {
  background: var(--dmk-color-border-strong);
}

.dmk-carousel__indicators--outside .dmk-carousel__indicator.is-active {
  background: var(--dmk-color-primary);
}
</style>
