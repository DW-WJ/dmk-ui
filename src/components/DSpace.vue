<script setup lang="ts">
/**
 * DSpace —— 间距容器。
 * 契约参考 Element Plus el-space：
 *   alignment（交叉轴对齐）/ direction（horizontal|vertical）/
 *   spacer（自定义间隔内容）/ size（small|default|large 或数字）/
 *   wrap（自动换行）/ fill（撑满容器）/ fillRatio（填充比例）/
 *   prefixCls（间隔项类名前缀）。
 * 插槽：default（默认项）、item（单项，覆写默认渲染）。
 */
import { computed, useSlots, type VNode } from 'vue'

type Alignment = 'start' | 'end' | 'center' | 'baseline'
type Direction = 'horizontal' | 'vertical'
type Size = 'small' | 'default' | 'large' | number

const props = withDefaults(
  defineProps<{
    alignment?: Alignment
    direction?: Direction
    spacer?: string | number
    size?: Size
    wrap?: boolean
    fill?: boolean
    fillRatio?: number
    prefixCls?: string
  }>(),
  {
    alignment: 'center',
    direction: 'horizontal',
    spacer: undefined,
    size: 'small',
    wrap: false,
    fill: false,
    fillRatio: 100,
    prefixCls: 'dmk-space__item'
  }
)

const slots = useSlots()

/** 默认插槽的子项（vnode 列表），逐项成为独立间隔单元 */
const items = computed(() => (slots.default?.() ?? []) as VNode[])

/** 间隔尺寸 → CSS 长度 */
const gapValue = computed(() => {
  const s = props.size
  if (typeof s === 'number') return `${s}px`
  if (s === 'small') return 'var(--dmk-space-sm)'
  if (s === 'large') return 'var(--dmk-space-xl)'
  return 'var(--dmk-space-md)'
})

/** spacer 覆写：字符串直接渲染文本，数字当 px 宽的间隔条 */
const hasSpacer = computed(() => props.spacer !== undefined)
const spacerStyle = computed(() => {
  if (typeof props.spacer === 'number') return { width: `${props.spacer}px`, minWidth: `${props.spacer}px` }
  return undefined
})
const spacerText = computed(() => (typeof props.spacer === 'number' ? '' : (props.spacer ?? '')))

/** 交叉轴对齐映射 */
const alignMap: Record<Alignment, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  baseline: 'baseline'
}

const rootStyle = computed(() => ({
  '--dmk-space-gap': gapValue.value,
  '--dmk-space-align': alignMap[props.alignment],
  '--dmk-space-fill-ratio': `${props.fillRatio}%`
}))
</script>

<template>
  <div
    class="dmk-space"
    :class="[
      `dmk-space--${direction}`,
      { 'is-wrap': wrap, 'is-fill': fill }
    ]"
    :style="rootStyle"
  >
    <template v-for="(child, index) in items" :key="index">
      <span
        v-if="hasSpacer && index > 0"
        class="dmk-space__spacer"
        :style="spacerStyle"
        aria-hidden="true"
        >{{ spacerText }}</span
      >
      <span :class="[prefixCls, { 'is-fill': fill }]">
        <slot name="item" v-bind="{ index }">
          <component :is="child" />
        </slot>
      </span>
    </template>
  </div>
</template>

<style scoped>
.dmk-space {
  display: inline-flex;
  gap: var(--dmk-space-gap);
  align-items: var(--dmk-space-align);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  color: var(--dmk-color-text);
}

.dmk-space--horizontal {
  flex-direction: row;
}

.dmk-space--vertical {
  flex-direction: column;
}

.dmk-space.is-wrap {
  flex-wrap: wrap;
}

/* fill：每个子项按比例撑开 */
.dmk-space.is-fill {
  display: flex;
  width: 100%;
}

.dmk-space.is-fill .dmk-space__item {
  flex: 1 1 var(--dmk-space-fill-ratio);
  max-width: var(--dmk-space-fill-ratio);
}

.dmk-space__item {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.dmk-space__spacer {
  display: inline-block;
  align-self: stretch;
  min-height: 1em;
  color: var(--dmk-color-text-muted);
}
</style>
