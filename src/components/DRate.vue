<script setup lang="ts">
/**
 * DRate —— 评分。
 * 设计要点：SVG 星形（不用 Unicode ★ —— 字符渲染只有几像素，是站内踩过的坑）；
 * 允许半选时用两层图标叠放 + 裁切宽度表示 0.5；
 * 键盘可达（←↓ 调整，Home/End 到边界）。
 */
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    /** 最大分值 */
    max?: number
    disabled?: boolean
    /** 允许半选 */
    allowHalf?: boolean
    /** 显示当前分值 */
    showScore?: boolean
    /** 显示文字说明（配合 texts） */
    showText?: boolean
    /** 各档位文案，末项为最高分 */
    texts?: string[]
    /** 低于该分值显示 danger 色 */
    lowThreshold?: number
    /** 高于该分值显示 success 色 */
    highThreshold?: number
    ariaLabel?: string
  }>(),
  {
    modelValue: 0,
    max: 5,
    disabled: false,
    allowHalf: false,
    showScore: false,
    showText: false,
    texts: () => ['极差', '失望', '一般', '满意', '惊喜'],
    lowThreshold: 2,
    highThreshold: 4,
    ariaLabel: '评分'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [value: number]
}>()

const rootRef = ref<HTMLElement | null>(null)

/** 每个星形的填充比例（0 / 0.5 / 1） */
const levels = computed(() =>
  Array.from({ length: props.max }, (_, i) => {
    const full = i + 1
    const v = props.modelValue
    const fill = v >= full ? 1 : v >= full - 0.5 ? 0.5 : 0
    return { index: i, fill }
  })
)

const scoreText = computed(() => {
  const t = props.texts
  if (!t.length) return ''
  const idx = Math.min(Math.ceil(props.modelValue), t.length) - 1
  return t[Math.max(idx, 0)]
})

const scoreColor = computed(() => {
  if (props.modelValue <= props.lowThreshold) return 'var(--dmk-color-danger)'
  if (props.modelValue >= props.highThreshold) return 'var(--dmk-color-success)'
  return 'var(--dmk-color-warning)'
})

function pick(v: number) {
  if (props.disabled) return
  if (v === props.modelValue) return
  emit('update:modelValue', v)
  emit('change', v)
}

/** 点击坐标：左半 = 0.5，右半 = 整数 */
function onPointer(e: MouseEvent, idx: number) {
  if (props.disabled) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const half = props.allowHalf && e.clientX - rect.left < rect.width / 2
  pick(idx + (half ? 0.5 : 1))
}

function onKey(e: KeyboardEvent) {
  if (props.disabled) return
  const step = props.allowHalf ? 0.5 : 1
  let next = props.modelValue
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = props.modelValue + step
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = props.modelValue - step
  else if (e.key === 'Home') next = step
  else if (e.key === 'End') next = props.max
  else return
  e.preventDefault()
  next = Math.min(Math.max(next, 0), props.max)
  pick(next)
}

function focus() {
  rootRef.value?.focus()
}
function blur() {
  rootRef.value?.blur()
}

defineExpose({ focus, blur })
</script>

<template>
  <div
    ref="rootRef"
    class="dmk-rate"
    role="slider"
    tabindex="0"
    :aria-label="ariaLabel"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="modelValue"
    :aria-disabled="disabled"
    :class="{ 'is-disabled': disabled }"
    @keydown="onKey"
  >
    <span class="dmk-rate__items">
      <span
        v-for="lv in levels"
        :key="lv.index"
        class="dmk-rate__item"
        :class="{ 'is-half': lv.fill === 0.5, 'is-full': lv.fill === 1 }"
        @click="onPointer($event, lv.index)"
      >
        <span class="dmk-rate__icon dmk-rate__icon--void" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <path
              d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="dmk-rate__icon dmk-rate__icon--fill" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <path
              d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"
              fill="currentColor"
            />
          </svg>
        </span>
      </span>
    </span>

    <span v-if="showScore" class="dmk-rate__score" :style="{ color: scoreColor }">
      {{ modelValue }}
    </span>
    <span v-if="showText" class="dmk-rate__text" :style="{ color: scoreColor }">
      {{ scoreText }}
    </span>
  </div>
</template>

<style scoped>
.dmk-rate {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--dmk-font-family);
  outline: none;
}

.dmk-rate:focus-visible {
  box-shadow: var(--dmk-shadow-focus);
  border-radius: var(--dmk-radius-sm);
}

.dmk-rate.is-disabled {
  opacity: 0.55;
}

.dmk-rate__items {
  display: inline-flex;
  gap: 4px;
}

.dmk-rate__item {
  position: relative;
  width: 20px;
  height: 20px;
  cursor: pointer;
  color: var(--dmk-color-border-strong);
}

.dmk-rate.is-disabled .dmk-rate__item {
  cursor: not-allowed;
}

.dmk-rate__icon {
  position: absolute;
  inset: 0;
  display: block;
}

.dmk-rate__icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* 填充层：整颗 = 1，半颗 = 50% 宽度裁切 */
.dmk-rate__icon--fill {
  width: 0;
  overflow: hidden;
  color: var(--dmk-color-warning);
}

.dmk-rate__item.is-full .dmk-rate__icon--fill {
  width: 100%;
}

.dmk-rate__item.is-half .dmk-rate__icon--fill {
  width: 50%;
}

.dmk-rate__item:hover .dmk-rate__icon--void {
  color: var(--dmk-color-warning);
}

.dmk-rate__score {
  font-size: var(--dmk-font-base);
  font-variant-numeric: tabular-nums;
}

.dmk-rate__text {
  font-size: var(--dmk-font-sm);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-rate__icon--fill {
    transition: none;
  }
}
</style>
