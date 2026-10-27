<script setup lang="ts">
/**
 * DContainer —— 容器。
 * 契约参考 Element Plus el-container：
 *   direction（子元素排列方向；嵌套 Header/Footer 时默认 vertical，否则 horizontal）。
 * 子件：DHeader / DAside / DMain / DFooter。
 *
 * 实现：容器 display:flex；direction 决定 flex-direction；
 *      子件用 flex 撑开（Aside 有固定宽度时不参与伸缩）。
 *      子组件通过 provide/inject 登记纵向块，容器据此自动切 column。
 */
import { computed, provide, ref, type CSSProperties } from 'vue'
import { CONTAINER_REGISTRY_KEY } from '../lib/container'

const props = withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical'
  }>(),
  {
    direction: undefined
  }
)

const hasVerticalBlock = ref(false)

provide(CONTAINER_REGISTRY_KEY, { hasVerticalBlock })

/**
 * 实际 flex-direction 值。
 * prop 对外是 horizontal / vertical（语义直观），CSS 里必须用 row / column
 * —— 'horizontal' / 'vertical' 不是合法的 flex-direction 值。
 */
const resolvedDirection = computed<'row' | 'column'>(() =>
  props.direction === 'vertical' || (props.direction === undefined && hasVerticalBlock.value)
    ? 'column'
    : 'row'
)

/**
 * 行内样式对象。
 * ⚠️ 不能在模板里写 `:style="{...} as Record<string,string>"`
 *    —— Vue 模板表达式不支持 TS 类型断言，整个绑定会被解析失败静默失效。
 */
const rootStyle = computed<CSSProperties>(() => ({ flexDirection: resolvedDirection.value }))
</script>

<template>
  <section class="dmk-container" :style="rootStyle">
    <slot />
  </section>
</template>

<style scoped>
.dmk-container {
  display: flex;
  flex: 1;
  flex-basis: auto;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
}
</style>
