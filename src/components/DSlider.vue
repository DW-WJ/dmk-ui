<script setup lang="ts">
/**
 * DSlider —— 滑块。
 * 设计要点：基于原生 input[type=range]（键盘/读屏语义与浏览器一致）；
 * 区间模式用两条轨道叠加实现；竖向用 writing-mode: vertical-lr；
 * 刻度（marks）与气泡（tooltip）按需渲染。
 */
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[]
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    /** 显示当前值气泡 */
    showTooltip?: boolean
    /** 区间模式（双滑块） */
    range?: boolean
    /** 竖向 */
    vertical?: boolean
    height?: string
    /** 刻度：{ 值: 标签 } */
    marks?: Record<string, string>
    /** 气泡文案格式化 */
    formatTooltip?: (value: number) => string
    id?: string
    name?: string
    ariaLabel?: string
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    showTooltip: true,
    range: false,
    vertical: false,
    height: '',
    marks: undefined,
    formatTooltip: undefined,
    id: undefined,
    name: undefined,
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | number[]]
  change: [value: number | number[]]
  input: [value: number | number[]]
}>()

const trackRef = ref<HTMLElement | null>(null)
const dragging = ref(false)
const activeIndex = ref<0 | 1>(0)

const range = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue as number]
)
const start = computed(() => range.value[0] ?? props.min)
const end = computed(() => (props.range ? (range.value[1] ?? props.max) : props.max))

function pct(v: number) {
  const span = props.max - props.min || 1
  return ((v - props.min) / span) * 100
}

const fillStyle = computed(() => {
  const a = pct(start.value)
  const b = props.range ? pct(end.value) : 100
  const left = props.range ? Math.min(a, b) : 0
  const width = props.range ? Math.abs(b - a) : b
  return props.vertical
    ? { bottom: `${left}%`, height: `${width}%` }
    : { left: `${left}%`, width: `${width}%` }
})

function onInput(e: Event, idx: 0 | 1) {
  const v = Number((e.target as HTMLInputElement).value)
  activeIndex.value = idx
  let next: number | number[]
  if (props.range) {
    const arr = [...range.value]
    arr[idx] = v
    // 保持 start <= end
    next = idx === 0 ? [Math.min(arr[0], arr[1]), Math.max(arr[0], arr[1])] : arr
  } else {
    next = v
  }
  emit('update:modelValue', next)
  emit('input', next)
}

function onChange(e: Event, idx: 0 | 1) {
  const v = Number((e.target as HTMLInputElement).value)
  let next: number | number[]
  if (props.range) {
    const arr = [...range.value]
    arr[idx] = v
    next = idx === 0 ? [Math.min(arr[0], arr[1]), Math.max(arr[0], arr[1])] : arr
  } else {
    next = v
  }
  emit('change', next)
}

const tooltipText = computed(() => {
  const v = props.range ? end.value : start.value
  return props.formatTooltip ? props.formatTooltip(v) : String(v)
})

const markList = computed(() =>
  Object.entries(props.marks ?? {}).map(([value, label]) => ({
    value: Number(value),
    label,
    offset: pct(Number(value))
  }))
)

function focus() {
  trackRef.value?.querySelector<HTMLInputElement>('input')?.focus()
}
function blur() {
  ;(document.activeElement as HTMLElement | null)?.blur()
}

defineExpose({ focus, blur })
</script>

<template>
  <div
    ref="trackRef"
    class="dmk-slider"
    :class="[{ 'is-vertical': vertical, 'is-disabled': disabled, 'is-range': range }]"
    :style="vertical && height ? { height } : undefined"
  >
    <!-- 轨道 -->
    <div class="dmk-slider__rail" />
    <div class="dmk-slider__fill" :style="fillStyle" />

    <!-- 刻度 -->
    <div v-if="markList.length" class="dmk-slider__marks">
      <span
        v-for="m in markList"
        :key="m.value"
        class="dmk-slider__mark"
        :style="vertical ? { bottom: `${m.offset}%` } : { left: `${m.offset}%` }"
      >
        <i class="dmk-slider__mark-dot" />
        <span class="dmk-slider__mark-text">{{ m.label }}</span>
      </span>
    </div>

    <!-- 原生滑块 -->
    <input
      class="dmk-slider__input"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="start"
      :disabled="disabled"
      :id="id"
      :name="name"
      :aria-label="ariaLabel ?? '滑块'"
      @input="onInput($event, 0)"
      @change="onChange($event, 0)"
      @focus="dragging = true"
      @blur="dragging = false"
    />
    <input
      v-if="range"
      class="dmk-slider__input"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="end"
      :disabled="disabled"
      :aria-label="`${ariaLabel ?? '滑块'} 结束值`"
      @input="onInput($event, 1)"
      @change="onChange($event, 1)"
      @focus="dragging = true"
      @blur="dragging = false"
    />

    <!-- 气泡 -->
    <span
      v-if="showTooltip"
      class="dmk-slider__tooltip"
      :class="{ 'is-visible': dragging }"
      :style="vertical ? { bottom: `${pct(start)}%` } : { left: `${pct(start)}%` }"
      role="status"
    >
      {{ tooltipText }}
    </span>
  </div>
</template>

<style scoped>
.dmk-slider {
  position: relative;
  display: block;
  width: 100%;
  height: 32px;
  font-family: var(--dmk-font-family);
}

.dmk-slider.is-vertical {
  display: inline-block;
  width: 32px;
  height: 200px;
}

.dmk-slider__rail {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4px;
  margin-top: -2px;
  background: var(--dmk-color-border);
  border-radius: 999px;
}

.dmk-slider.is-vertical .dmk-slider__rail {
  top: 0;
  bottom: 0;
  left: 50%;
  right: auto;
  width: 4px;
  height: auto;
  margin: 0 0 0 -2px;
}

.dmk-slider__fill {
  position: absolute;
  top: 50%;
  height: 4px;
  margin-top: -2px;
  background: var(--dmk-color-primary);
  border-radius: 999px;
}

.dmk-slider.is-vertical .dmk-slider__fill {
  top: auto;
  left: 50%;
  width: 4px;
  margin: 0 0 0 -2px;
}

.dmk-slider__input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  background: transparent;
  appearance: none;
  pointer-events: none;
}

.dmk-slider__input::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--dmk-color-surface);
  border: 2px solid var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-sm);
  cursor: pointer;
  pointer-events: auto;
  appearance: none;
}

.dmk-slider__input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--dmk-color-surface);
  border: 2px solid var(--dmk-color-primary);
  cursor: pointer;
  pointer-events: auto;
}

.dmk-slider__input:focus-visible::-webkit-slider-thumb {
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-slider.is-vertical .dmk-slider__input {
  writing-mode: vertical-lr;
  direction: rtl;
}

.dmk-slider.is-disabled .dmk-slider__input::-webkit-slider-thumb {
  cursor: not-allowed;
  border-color: var(--dmk-color-border-strong);
}

/* 刻度 */
.dmk-slider__marks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.dmk-slider__mark {
  position: absolute;
  top: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, 0);
  margin-top: 8px;
}

.dmk-slider.is-vertical .dmk-slider__mark {
  top: auto;
  left: 50%;
  flex-direction: row;
  transform: translate(0, 50%);
  margin: 0 0 0 8px;
}

.dmk-slider__mark-dot {
  width: 2px;
  height: 6px;
  background: var(--dmk-color-border-strong);
}

.dmk-slider__mark-text {
  margin-top: 3px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-muted);
  white-space: nowrap;
}

.dmk-slider.is-vertical .dmk-slider__mark-text {
  margin: 0 0 0 3px;
}

/* 气泡 */
.dmk-slider__tooltip {
  position: absolute;
  bottom: calc(100% - 2px);
  transform: translateX(-50%);
  padding: 3px 8px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-on-primary);
  background: var(--dmk-color-primary);
  border-radius: var(--dmk-radius-sm);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-slider__tooltip.is-visible {
  opacity: 1;
}

.dmk-slider.is-vertical .dmk-slider__tooltip {
  bottom: auto;
  left: calc(100% + 6px);
  transform: translateY(50%);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-slider__tooltip {
    transition: none;
  }
}
</style>
