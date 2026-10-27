<script setup lang="ts">
/**
 * DImage —— 图片容器。
 * 契约参考 Element Plus el-image：
 *   src / fit / alt / lazy / scrollContainer / referrerPolicy / crossorigin /
 *   previewSrcList / initialIndex / zIndex / hideOnClickModal /
 *   closeOnPressEscape / previewTeleported / infinite / zoomRate / scale /
 *   minScale / maxScale / showProgress
 *   Events: load / error / switch / close / show
 *   Slots: placeholder / error / preview / progress
 *   Exposes: showPreview
 *
 * 实现：加载中显示 placeholder 槽/骨架；失败显示 error 槽/占位图标；
 *      点击触发全屏预览（图片列表轮播 + 缩放）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
    fit?: 'none' | 'contain' | 'cover' | 'fill' | 'scale-down'
    alt?: string
    lazy?: boolean
    scrollContainer?: string | HTMLElement
    referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url'
    crossorigin?: 'anonymous' | 'use-credentials' | ''
    previewSrcList?: string[]
    initialIndex?: number
    zIndex?: number
    hideOnClickModal?: boolean
    closeOnPressEscape?: boolean
    previewTeleported?: boolean
    infinite?: boolean
    zoomRate?: number
    scale?: number
    minScale?: number
    maxScale?: number
    showProgress?: boolean
    /** 图片默认宽高（未指定时按容器自适应） */
    width?: string | number
    height?: string | number
  }>(),
  {
    src: '',
    fit: 'fill',
    alt: '',
    lazy: false,
    scrollContainer: undefined,
    referrerPolicy: undefined,
    crossorigin: undefined,
    previewSrcList: () => [],
    initialIndex: 0,
    zIndex: undefined,
    hideOnClickModal: false,
    closeOnPressEscape: true,
    previewTeleported: false,
    infinite: true,
    zoomRate: 1.2,
    scale: 1,
    minScale: 0.2,
    maxScale: 7,
    showProgress: false,
    width: undefined,
    height: undefined
  }
)

const emit = defineEmits<{
  load: [event: Event]
  error: [event: Event]
  switch: [index: number]
  close: []
  show: []
}>()

/** 加载状态 */
const status = ref<'loading' | 'loaded' | 'error'>('loading')
/** 是否在视口内（懒加载） */
const inViewport = ref(!props.lazy)
/** 预览器显隐 */
const previewVisible = ref(false)
/** 预览列表 */
const previewList = computed(() =>
  props.previewSrcList.length ? props.previewSrcList : props.src ? [props.src] : []
)
/** 当前预览下标 */
const previewIndex = ref(props.initialIndex)
/** 当前缩放倍数 */
const zoom = ref(props.scale)

const rootRef = ref<HTMLElement | null>(null)

/** 懒加载：IntersectionObserver 观察容器 */
let io: IntersectionObserver | null = null

onMounted(() => {
  if (!props.lazy) {
    inViewport.value = true
    return
  }
  if (typeof IntersectionObserver !== 'undefined' && rootRef.value) {
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          inViewport.value = true
          io?.disconnect()
          io = null
        }
      },
      { root: resolveScrollContainer() }
    )
    io.observe(rootRef.value)
  } else {
    inViewport.value = true
  }
})

function resolveScrollContainer(): Element | null {
  if (!props.scrollContainer) return null
  if (typeof props.scrollContainer === 'string') {
    return document.querySelector(props.scrollContainer)
  }
  return props.scrollContainer
}

onBeforeUnmount(() => {
  io?.disconnect()
  io = null
  document.removeEventListener('keydown', onKeydown)
})

watch(
  () => props.src,
  () => {
    status.value = 'loading'
  }
)

function onLoad(e: Event) {
  status.value = 'loaded'
  emit('load', e)
}

function onError(e: Event) {
  status.value = 'error'
  emit('error', e)
}

function openPreview() {
  if (!previewList.value.length) return
  previewVisible.value = true
  zoom.value = props.scale
  emit('show')
  document.addEventListener('keydown', onKeydown)
}

function closePreview() {
  previewVisible.value = false
  emit('close')
  document.removeEventListener('keydown', onKeydown)
}

function onKeydown(e: KeyboardEvent) {
  if (!previewVisible.value) return
  if (e.key === 'Escape' && props.closeOnPressEscape) {
    closePreview()
  } else if (e.key === 'ArrowLeft') {
    switchTo(-1)
  } else if (e.key === 'ArrowRight') {
    switchTo(1)
  }
}

function switchTo(delta: number) {
  const n = previewList.value.length
  if (!n) return
  if (props.infinite) {
    previewIndex.value = (previewIndex.value + delta + n) % n
  } else {
    const next = previewIndex.value + delta
    if (next < 0 || next >= n) return
    previewIndex.value = next
  }
  emit('switch', previewIndex.value)
}

function zoomIn() {
  zoom.value = Math.min(props.maxScale, zoom.value * props.zoomRate)
}

function zoomOut() {
  zoom.value = Math.max(props.minScale, zoom.value / props.zoomRate)
}

function resetZoom() {
  zoom.value = props.scale
}

const imgStyle = computed(() => ({
  objectFit: props.fit,
  width: props.width ? (typeof props.width === 'number' ? `${props.width}px` : props.width) : undefined,
  height: props.height ? (typeof props.height === 'number' ? `${props.height}px` : props.height) : undefined
}))

const currentPreviewSrc = computed(() => previewList.value[previewIndex.value] ?? '')

defineExpose({ showPreview: openPreview })
</script>

<template>
  <div ref="rootRef" class="dmk-image" :class="{ 'is-error': status === 'error' }">
    <div v-if="status === 'loading'" class="dmk-image__placeholder">
      <slot name="placeholder">
        <span class="dmk-image__skeleton" aria-hidden="true" />
      </slot>
    </div>

    <div v-else-if="status === 'error'" class="dmk-image__error">
      <slot name="error">
        <svg class="dmk-image__error-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M21 5v6.59l-3-3.01-4 4.01-4-4-4 4-3-3.01V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2M18 11.42l3 3.01V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6.58l3 2.99 4-4 4 4z"
          />
        </svg>
        <span class="dmk-image__error-text">FAILED</span>
      </slot>
    </div>

    <img
      v-if="inViewport && src"
      class="dmk-image__img"
      :src="src"
      :alt="alt"
      :style="imgStyle"
      :referrerpolicy="referrerPolicy"
      :crossorigin="crossorigin || undefined"
      :loading="lazy ? 'lazy' : undefined"
      @load="onLoad"
      @error="onError"
      @click="previewList.length ? openPreview() : undefined"
    />

    <slot name="preview" />

    <!-- 预览器 -->
    <Teleport v-if="previewVisible" to="body">
      <div class="dmk-image-viewer" :style="{ zIndex: zIndex ?? 3000 }" role="dialog" aria-modal="true" aria-label="图片预览">
        <div class="dmk-image-viewer__mask" @click="hideOnClickModal ? closePreview() : undefined" />

        <button type="button" class="dmk-image-viewer__close" aria-label="关闭预览" @click="closePreview">×</button>

        <button
          v-if="previewList.length > 1"
          type="button"
          class="dmk-image-viewer__nav is-prev"
          aria-label="上一张"
          @click="switchTo(-1)"
        >
          ‹
        </button>

        <figure class="dmk-image-viewer__stage">
          <img
            class="dmk-image-viewer__img"
            :src="currentPreviewSrc"
            :alt="alt"
            :style="{ transform: `scale(${zoom})` }"
          />
          <figcaption v-if="previewList.length > 1" class="dmk-image-viewer__index">
            {{ previewIndex + 1 }} / {{ previewList.length }}
          </figcaption>
        </figure>

        <button
          v-if="previewList.length > 1"
          type="button"
          class="dmk-image-viewer__nav is-next"
          aria-label="下一张"
          @click="switchTo(1)"
        >
          ›
        </button>

        <div class="dmk-image-viewer__toolbar">
          <button type="button" aria-label="缩小" @click="zoomOut">−</button>
          <button type="button" aria-label="重置缩放" @click="resetZoom">1:1</button>
          <button type="button" aria-label="放大" @click="zoomIn">+</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.dmk-image {
  position: relative;
  display: inline-block;
  line-height: 0;
  font-family: var(--dmk-font-family);
}

.dmk-image__img {
  display: block;
  max-width: 100%;
  border-radius: var(--dmk-radius-md);
  cursor: zoom-in;
}

.dmk-image__placeholder,
.dmk-image__error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
  min-height: 80px;
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.dmk-image__skeleton {
  width: 48px;
  height: 48px;
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-border);
  animation: dmk-image-pulse 1.4s ease-in-out infinite;
}

@keyframes dmk-image-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.9;
  }
}

.dmk-image__error-icon {
  width: 32px;
  height: 32px;
  fill: currentColor;
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .dmk-image__skeleton {
    animation: none;
  }
}
</style>

<style>
/* 预览器走 Teleport 到 body，scoped 样式拿不到 —— 用全局块 */
.dmk-image-viewer {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--dmk-font-family);
}

.dmk-image-viewer__mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
}

.dmk-image-viewer__stage {
  position: relative;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.dmk-image-viewer__img {
  max-width: 84vw;
  max-height: 76vh;
  border-radius: var(--dmk-radius-md);
  transition: transform 160ms ease;
  user-select: none;
}

.dmk-image-viewer__index {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.dmk-image-viewer__close,
.dmk-image-viewer__nav {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
  transition: background-color 160ms ease;
}

.dmk-image-viewer__close:hover,
.dmk-image-viewer__nav:hover {
  background: rgba(255, 255, 255, 0.24);
}

.dmk-image-viewer__close {
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  font-size: 22px;
  line-height: 1;
}

.dmk-image-viewer__nav {
  top: 50%;
  width: 42px;
  height: 42px;
  margin-top: -21px;
  font-size: 26px;
  line-height: 1;
}

.dmk-image-viewer__nav.is-prev {
  left: 24px;
}

.dmk-image-viewer__nav.is-next {
  right: 24px;
}

.dmk-image-viewer__toolbar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--dmk-radius-lg);
  background: rgba(255, 255, 255, 0.12);
}

.dmk-image-viewer__toolbar button {
  min-width: 34px;
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: var(--dmk-radius-md);
  background: transparent;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.dmk-image-viewer__toolbar button:hover {
  background: rgba(255, 255, 255, 0.18);
}
</style>
