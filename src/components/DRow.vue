<script setup lang="ts">
/**
 * DRow —— 栅格行。
 * 契约参考 Element Plus el-row：
 *   gutter（列间距，负 margin 抵消）/ justify（水平对齐）/
 *   align（垂直对齐）/ tag（自定义标签）。
 */
withDefaults(
  defineProps<{
    gutter?: number
    justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between'
    align?: 'top' | 'middle' | 'bottom'
    tag?: string
  }>(),
  {
    gutter: 0,
    justify: 'start',
    align: undefined,
    tag: 'div'
  }
)
</script>

<template>
  <component
    :is="tag"
    class="dmk-row"
    :style="{
      marginLeft: gutter ? `${-gutter / 2}px` : undefined,
      marginRight: gutter ? `${-gutter / 2}px` : undefined,
      justifyContent: justify,
      alignItems: align
    }"
  >
    <slot />
  </component>
</template>

<style scoped>
.dmk-row {
  display: flex;
  flex-wrap: wrap;
  box-sizing: border-box;
}
</style>
