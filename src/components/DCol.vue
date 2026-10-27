<script setup lang="ts">
/**
 * DCol —— 栅格列。
 * 契约参考 Element Plus el-col：
 *   span（占 24 栅格数）/ offset / push / pull /
 *   xs sm md lg xl（响应式断点，可传数字或 {span,offset} 对象）/
 *   tag（自定义标签）。
 *
 * 实现要点：全部宽度/偏移走 CSS 变量，媒体查询只读变量、不写 inline width，
 * 否则 inline 样式会盖掉媒体查询的 max-width（响应式直接失效）。
 * 断点与 Element Plus 一致：xs<768 / sm≥768 / md≥992 / lg≥1200 / xl≥1920。
 * 未指定某断点时该断点沿用基础 span/offset（与 EP 行为一致）。
 */
import { computed } from 'vue'

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type ColObject = { span?: number; offset?: number }

const props = withDefaults(
  defineProps<{
    span?: number
    offset?: number
    push?: number
    pull?: number
    xs?: number | ColObject
    sm?: number | ColObject
    md?: number | ColObject
    lg?: number | ColObject
    xl?: number | ColObject
    tag?: string
  }>(),
  {
    span: 24,
    offset: 0,
    push: 0,
    pull: 0,
    xs: undefined,
    sm: undefined,
    md: undefined,
    lg: undefined,
    xl: undefined,
    tag: 'div'
  }
)

/** 把 number | {span,offset} 归一成 {span, offset} */
function normalize(v: number | ColObject | undefined): { span?: number; offset?: number } | undefined {
  if (v === undefined) return undefined
  if (typeof v === 'number') return { span: v }
  return { span: v.span, offset: v.offset }
}

const styleVars = computed(() => {
  const out: Record<string, string> = {}
  const bpMap: Record<Breakpoint, { span?: number; offset?: number } | undefined> = {
    xs: normalize(props.xs),
    sm: normalize(props.sm),
    md: normalize(props.md),
    lg: normalize(props.lg),
    xl: normalize(props.xl)
  }
  // 基础值
  out['--col-span'] = String(props.span)
  out['--col-offset'] = String(props.offset)
  // 各断点：自身指定优先，未指定沿用基础值
  for (const key of Object.keys(bpMap) as Breakpoint[]) {
    const v = bpMap[key]
    out[`--col-${key}-span`] = String(v?.span ?? props.span)
    out[`--col-${key}-offset`] = String(v?.offset ?? props.offset)
  }
  if (props.push) out['--col-push'] = String(props.push)
  if (props.pull) out['--col-pull'] = String(props.pull)
  return out
})
</script>

<template>
  <component :is="tag" class="dmk-col" :style="styleVars">
    <slot />
  </component>
</template>

<style scoped>
.dmk-col {
  position: relative;
  box-sizing: border-box;
  min-height: 1px;
  flex: 0 0 calc(var(--col-span) / 24 * 100%);
  max-width: calc(var(--col-span) / 24 * 100%);
  margin-left: calc(var(--col-offset) / 24 * 100%);
}

.dmk-col:has(> *) {
  padding-left: 0;
  padding-right: 0;
}

/* push / pull：绝对定位偏移 */
.dmk-col[style*='--col-push'] {
  position: relative;
}

@media (max-width: 767px) {
  .dmk-col {
    flex: 0 0 calc(var(--col-xs-span) / 24 * 100%);
    max-width: calc(var(--col-xs-span) / 24 * 100%);
    margin-left: calc(var(--col-xs-offset) / 24 * 100%);
  }
}

@media (min-width: 768px) {
  .dmk-col {
    flex: 0 0 calc(var(--col-sm-span) / 24 * 100%);
    max-width: calc(var(--col-sm-span) / 24 * 100%);
    margin-left: calc(var(--col-sm-offset) / 24 * 100%);
  }
}

@media (min-width: 992px) {
  .dmk-col {
    flex: 0 0 calc(var(--col-md-span) / 24 * 100%);
    max-width: calc(var(--col-md-span) / 24 * 100%);
    margin-left: calc(var(--col-md-offset) / 24 * 100%);
  }
}

@media (min-width: 1200px) {
  .dmk-col {
    flex: 0 0 calc(var(--col-lg-span) / 24 * 100%);
    max-width: calc(var(--col-lg-span) / 24 * 100%);
    margin-left: calc(var(--col-lg-offset) / 24 * 100%);
  }
}

@media (min-width: 1920px) {
  .dmk-col {
    flex: 0 0 calc(var(--col-xl-span) / 24 * 100%);
    max-width: calc(var(--col-xl-span) / 24 * 100%);
    margin-left: calc(var(--col-xl-offset) / 24 * 100%);
  }
}
</style>
