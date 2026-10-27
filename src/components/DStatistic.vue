<script setup lang="ts">
/**
 * DStatistic —— 统计数值。
 * 设计要点：数值 + 前缀/后缀 + 标题；precision 控制小数位，
 * formatter 接管整个数字渲染（可做「1.2 万」这类中文计数）。
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value?: number | string
    /** 小数位（负数表示不处理） */
    precision?: number
    prefix?: string
    suffix?: string
    title?: string
    /** 数值样式（内联 style 字符串或对象） */
    valueStyle?: string | Record<string, string>
    /** 完全接管数值渲染 */
    formatter?: (value: number | string) => string
    /** 千分位分隔 */
    separator?: string
    ariaLabel?: string
  }>(),
  {
    value: 0,
    precision: -1,
    prefix: '',
    suffix: '',
    title: '',
    valueStyle: undefined,
    formatter: undefined,
    separator: '',
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()

const display = computed(() => {
  if (props.formatter) return props.formatter(props.value)
  if (typeof props.value !== 'number') return String(props.value)
  const fixed = props.precision >= 0 ? props.value.toFixed(props.precision) : String(props.value)
  if (!props.separator) return fixed
  const [int, dec] = fixed.split('.')
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, props.separator)
  return dec ? `${withSep}.${dec}` : withSep
})

const styleObj = computed<Record<string, string>>(() => {
  if (!props.valueStyle) return {}
  return typeof props.valueStyle === 'string'
    ? Object.fromEntries(
        props.valueStyle
          .split(';')
          .map((s) => s.split(':').map((v) => v.trim()))
          .filter((p) => p.length === 2)
      )
    : props.valueStyle
})
</script>

<template>
  <div class="dmk-statistic" @click="(e) => emit('click', e)">
    <div class="dmk-statistic__content" :aria-label="ariaLabel">
      <span v-if="prefix || $slots.prefix" class="dmk-statistic__prefix">
        <slot name="prefix">{{ prefix }}</slot>
      </span>
      <span class="dmk-statistic__value" :style="styleObj">
        <slot name="value">{{ display }}</slot>
      </span>
      <span v-if="suffix || $slots.suffix" class="dmk-statistic__suffix">
        <slot name="suffix">{{ suffix }}</slot>
      </span>
    </div>
    <div v-if="title || $slots.title" class="dmk-statistic__title">
      <slot name="title">{{ title }}</slot>
    </div>
  </div>
</template>

<style scoped>
.dmk-statistic {
  font-family: var(--dmk-font-family);
}

.dmk-statistic__content {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: var(--dmk-color-text);
}

.dmk-statistic__value {
  font-size: var(--dmk-font-lg);
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.dmk-statistic__prefix,
.dmk-statistic__suffix {
  font-size: var(--dmk-font-base);
  color: var(--dmk-color-text-muted);
}

.dmk-statistic__title {
  margin-top: 4px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-muted);
}
</style>
