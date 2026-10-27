<script setup lang="ts">
/**
 * DTour —— 新手引导。
 * 契约参考 Element Plus el-tour：
 *   Attributes: appendTo / showArrow / placement / contentStyle / mask / gap /
 *     type（default | primary）/ modelValue（是否打开）/ current（当前步）/
 *     scrollIntoViewOptions / zIndex / showClose / closeIcon /
 *     closeOnPressEscape / targetAreaClickable
 *   Events: close / finish / change
 *   Slots: default（TourStep 列表）/ indicators（自定义指示器）
 *
 * 实现：整屏遮罩 + 目标元素位置计算 → 用 4 个矩形挖出「镂空」区域；
 *      引导卡片绝对定位到目标附近（placement 决定方向）。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue'
import type { TourPlacement, TourStep } from '../lib/tour'

const props = withDefaults(
  defineProps<{
    /** 是否打开 */
    modelValue?: boolean
    /** 当前步下标 */
    current?: number
    /** 步骤数据（也可用默认插槽传 TourStep 子组件） */
    steps?: TourStep[]
    placement?: TourPlacement
    showArrow?: boolean
    type?: 'default' | 'primary'
    zIndex?: number
    showClose?: boolean
    closeOnPressEscape?: boolean
    targetAreaClickable?: boolean
    /** 镂空区域与目标的间距 */
    gap?: number
  }>(),
  {
    modelValue: false,
    current: 0,
    steps: () => [],
    placement: 'bottom',
    showArrow: true,
    type: 'default',
    zIndex: 2001,
    showClose: true,
    closeOnPressEscape: true,
    targetAreaClickable: true,
    gap: 8
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:current': [value: number]
  close: []
  finish: []
  change: [index: number]
}>()

/** 当前步 */
const currentIndex = ref(props.current)
/** 目标元素位置 */
const targetRect = ref<{ top: number; left: number; width: number; height: number } | null>(null)
/** 目标是否存在 */
const hasTarget = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      currentIndex.value = props.current
      void nextTick(measure)
    }
  }
)

watch(
  () => props.current,
  (v) => {
    currentIndex.value = v
    void nextTick(measure)
  }
)

watch(currentIndex, (v) => {
  emit('update:current', v)
  emit('change', v)
  void nextTick(measure)
})

/** 当前步骤 */
const step = computed<TourStep>(() => props.steps[currentIndex.value] ?? {})

/** 解析目标元素 */
function resolveTarget(): HTMLElement | null {
  const t = step.value.target
  if (!t) return null
  if (typeof t === 'string') return document.querySelector<HTMLElement>(t)
  if (typeof t === 'function') return t()
  return t
}

/** 测量目标位置 */
function measure() {
  const el = resolveTarget()
  if (!el) {
    hasTarget.value = false
    targetRect.value = null
    return
  }
  hasTarget.value = true
  el.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  // 等滚动结束再取位置
  window.setTimeout(() => {
    const rect = el.getBoundingClientRect()
    targetRect.value = {
      top: rect.top - props.gap,
      left: rect.left - props.gap,
      width: rect.width + props.gap * 2,
      height: rect.height + props.gap * 2
    }
  }, 260)
}

/** 镂空区的样式（用 box-shadow 挖洞：四周铺黑，中间透明） */
const maskStyle = computed<CSSProperties>(() => {
  const r = targetRect.value
  if (!r) {
    // 无目标时全屏遮罩
    return {
      position: 'fixed',
      inset: '0px',
      background: 'var(--dmk-color-mask)',
      zIndex: String(props.zIndex)
    }
  }
  const { top, left, width, height } = r
  return {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: 'var(--dmk-radius-md)',
    boxShadow: `0 0 0 9999px var(--dmk-color-mask)`,
    zIndex: String(props.zIndex),
    pointerEvents: props.targetAreaClickable ? 'auto' : 'none'
  }
})

/** 引导卡片位置 */
const cardStyle = computed<CSSProperties>(() => {
  const r = targetRect.value
  const placement = step.value.placement ?? props.placement
  if (!r) {
    // 无目标：居中
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: String(props.zIndex + 1)
    }
  }
  const cardWidth = 320
  const cardHeight = 160
  const gap = 12
  let top = 0
  let left = 0

  switch (placement) {
    case 'top':
      top = r.top - cardHeight - gap
      left = r.left + r.width / 2 - cardWidth / 2
      break
    case 'bottom':
      top = r.top + r.height + gap
      left = r.left + r.width / 2 - cardWidth / 2
      break
    case 'left':
      top = r.top + r.height / 2 - cardHeight / 2
      left = r.left - cardWidth - gap
      break
    case 'right':
      top = r.top + r.height / 2 - cardHeight / 2
      left = r.left + r.width + gap
      break
  }

  // 贴边时收回来，别跑出屏幕
  left = Math.max(12, Math.min(left, window.innerWidth - cardWidth - 12))
  top = Math.max(12, Math.min(top, window.innerHeight - cardHeight - 12))

  return {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${cardWidth}px`,
    zIndex: String(props.zIndex + 1)
  }
})

/** 箭头方向 */
const arrowClass = computed(() => `is-${step.value.placement ?? props.placement}`)

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function next() {
  if (currentIndex.value >= props.steps.length - 1) {
    emit('update:modelValue', false)
    emit('finish')
    return
  }
  currentIndex.value += 1
}

function prev() {
  if (currentIndex.value <= 0) return
  currentIndex.value -= 1
}

function onKeydown(e: KeyboardEvent) {
  if (!props.modelValue) return
  if (e.key === 'Escape' && props.closeOnPressEscape) {
    e.stopPropagation()
    close()
  } else if (e.key === 'ArrowRight') {
    next()
  } else if (e.key === 'ArrowLeft') {
    prev()
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})

const isFirst = computed(() => currentIndex.value === 0)
const isLast = computed(() => currentIndex.value >= props.steps.length - 1)
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="dmk-tour" role="dialog" aria-modal="true" aria-label="新手引导">
      <!-- 遮罩（挖洞） -->
      <div class="dmk-tour__mask" :style="maskStyle" />

      <!-- 引导卡片 -->
      <div class="dmk-tour__card" :class="`is-${type}`" :style="cardStyle">
        <span v-if="showArrow && step.showArrow !== false" class="dmk-tour__arrow" :class="arrowClass" aria-hidden="true" />

        <button
          v-if="showClose"
          type="button"
          class="dmk-tour__close"
          aria-label="关闭引导"
          @click="close"
        >
          ×
        </button>

        <div v-if="step.title" class="dmk-tour__title">{{ step.title }}</div>
        <div v-if="step.description" class="dmk-tour__desc">{{ step.description }}</div>

        <div class="dmk-tour__footer">
          <slot name="indicators">
            <span class="dmk-tour__counter">{{ currentIndex + 1 }} / {{ steps.length }}</span>
          </slot>
          <div class="dmk-tour__actions">
            <button v-if="!isFirst" type="button" class="dmk-tour__btn" @click="prev">上一步</button>
            <button type="button" class="dmk-tour__btn is-primary" @click="next">
              {{ isLast ? '完成' : '下一步' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dmk-tour__mask {
  transition:
    top var(--dmk-duration-base) var(--dmk-ease),
    left var(--dmk-duration-base) var(--dmk-ease);
}

.dmk-tour__card {
  position: fixed;
  padding: 16px;
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
  font-family: var(--dmk-font-family);
  color: var(--dmk-color-text);
  transition:
    top var(--dmk-duration-base) var(--dmk-ease),
    left var(--dmk-duration-base) var(--dmk-ease);
}

.dmk-tour__card.is-primary {
  background: var(--dmk-color-primary);
  color: var(--dmk-color-on-primary);
}

.dmk-tour__arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background: inherit;
  transform: rotate(45deg);
}

.dmk-tour__arrow.is-bottom {
  top: -5px;
  left: 50%;
  margin-left: -5px;
}

.dmk-tour__arrow.is-top {
  bottom: -5px;
  left: 50%;
  margin-left: -5px;
}

.dmk-tour__arrow.is-left {
  right: -5px;
  top: 50%;
  margin-top: -5px;
}

.dmk-tour__arrow.is-right {
  left: -5px;
  top: 50%;
  margin-top: -5px;
}

.dmk-tour__close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: var(--dmk-radius-sm);
  background: transparent;
  color: inherit;
  opacity: 0.6;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.dmk-tour__close:hover {
  opacity: 1;
  background: var(--dmk-color-surface-hover);
}

.dmk-tour__title {
  padding-right: 24px;
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}

.dmk-tour__desc {
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.86;
}

.dmk-tour__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

.dmk-tour__counter {
  font-size: 12px;
  opacity: 0.7;
}

.dmk-tour__actions {
  display: flex;
  gap: 8px;
}

.dmk-tour__btn {
  min-height: 28px;
  padding: 0 14px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-secondary);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}

.dmk-tour__card.is-primary .dmk-tour__btn {
  background: transparent;
  border-color: currentColor;
  color: inherit;
}

.dmk-tour__btn.is-primary {
  background: var(--dmk-color-primary);
  border-color: var(--dmk-color-primary);
  color: var(--dmk-color-on-primary);
}

.dmk-tour__card.is-primary .dmk-tour__btn.is-primary {
  background: var(--dmk-color-on-primary);
  border-color: var(--dmk-color-on-primary);
  color: var(--dmk-color-primary);
}
</style>
