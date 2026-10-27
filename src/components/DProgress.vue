<script setup lang="ts">
/**
 * DProgress —— 进度条。
 * 设计要点：line 用轨道+进度条（宽度过渡），circle 用 SVG 圆环
 * （viewBox 0 0 100 100、r=45，stroke-dasharray/offset 计算弧长）；
 * status 默认且 100% 时自动转 success，支持 format 自定义文案。
 */
import { computed } from 'vue'

type Status = 'default' | 'success' | 'warning' | 'danger'

const props = withDefaults(
  defineProps<{
    percentage: number
    type?: 'line' | 'circle'
    status?: Status
    strokeWidth?: number
    showText?: boolean
    format?: (p: number) => string
  }>(),
  {
    type: 'line',
    status: 'default',
    strokeWidth: 8,
    showText: true,
    format: undefined
  }
)

/** 圆环几何：r=45，周长 2πr */
const RADIUS = 45
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const pct = computed(() => Math.min(100, Math.max(0, props.percentage)))

const effectiveStatus = computed<Status>(() =>
  props.status === 'default' && pct.value >= 100 ? 'success' : props.status
)

const text = computed(() =>
  props.format ? props.format(pct.value) : `${Math.round(pct.value)}%`
)

const dashArray = computed(() => `${CIRCUMFERENCE}`)
const dashOffset = computed(() => `${CIRCUMFERENCE * (1 - pct.value / 100)}`)
</script>

<template>
  <div
    class="dmk-progress"
    :class="`dmk-progress--${type}`"
    role="progressbar"
    :aria-valuenow="pct"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuetext="text"
  >
    <!-- 线性 -->
    <template v-if="type === 'line'">
      <div class="dmk-progress__track" :style="{ height: `${strokeWidth}px` }">
        <div
          class="dmk-progress__bar"
          :class="`is-${effectiveStatus}`"
          :style="{ width: `${pct}%` }"
        />
      </div>
      <span v-if="showText" class="dmk-progress__text" :class="`is-${effectiveStatus}`">{{ text }}</span>
    </template>

    <!-- 环形 -->
    <template v-else>
      <div class="dmk-progress__circle-wrap">
        <svg class="dmk-progress__svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            class="dmk-progress__circle-track"
            cx="50"
            cy="50"
            :r="RADIUS"
            :stroke-width="strokeWidth"
          />
          <circle
            class="dmk-progress__circle-bar"
            :class="`is-${effectiveStatus}`"
            cx="50"
            cy="50"
            :r="RADIUS"
            :stroke-width="strokeWidth"
            :stroke-dasharray="dashArray"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <span v-if="showText" class="dmk-progress__text dmk-progress__text--center" :class="`is-${effectiveStatus}`">{{ text }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dmk-progress {
  display: flex;
  align-items: center;
  gap: var(--dmk-space-sm);
  width: 100%;
  font-family: var(--dmk-font-family);
}

.dmk-progress--circle {
  width: auto;
  justify-content: center;
}

.dmk-progress__track {
  flex: 1;
  min-width: 0;
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface-active);
  overflow: hidden;
}

.dmk-progress__bar {
  height: 100%;
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-primary);
  transition: width var(--dmk-duration-slow) var(--dmk-ease);
}

.dmk-progress__bar.is-success,
.dmk-progress__circle-bar.is-success {
  background: var(--dmk-color-success);
}

.dmk-progress__bar.is-warning,
.dmk-progress__circle-bar.is-warning {
  background: var(--dmk-color-warning);
}

.dmk-progress__bar.is-danger,
.dmk-progress__circle-bar.is-danger {
  background: var(--dmk-color-danger);
}

.dmk-progress__text {
  flex-shrink: 0;
  min-width: 40px;
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-sm);
  font-weight: 600;
  text-align: right;
}

.dmk-progress__text.is-success {
  color: var(--dmk-color-success);
}

.dmk-progress__text.is-warning {
  color: var(--dmk-color-warning);
}

.dmk-progress__text.is-danger {
  color: var(--dmk-color-danger);
}

/* 环形 */
.dmk-progress__circle-wrap {
  position: relative;
  width: 120px;
  height: 120px;
}

.dmk-progress__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.dmk-progress__circle-track {
  fill: none;
  stroke: var(--dmk-color-surface-active);
}

.dmk-progress__circle-bar {
  fill: none;
  stroke: var(--dmk-color-primary);
  stroke-linecap: round;
  transition: stroke-dashoffset var(--dmk-duration-slow) var(--dmk-ease);
}

.dmk-progress__text--center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  text-align: center;
  font-size: var(--dmk-font-md);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-progress__bar,
  .dmk-progress__circle-bar {
    transition: none;
  }
}
</style>
