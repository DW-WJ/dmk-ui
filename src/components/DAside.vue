<script setup lang="ts">
/**
 * DAside —— 侧边栏容器。契约参考 el-aside：width（默认 300px）。
 */
withDefaults(
  defineProps<{
    width?: string
  }>(),
  {
    width: '300px'
  }
)
</script>

<template>
  <aside class="dmk-aside" :style="{ width }">
    <slot />
  </aside>
</template>

<style scoped>
.dmk-aside {
  flex-grow: 0;
  flex-shrink: 0;
  box-sizing: border-box;
  overflow: auto;
  padding: var(--dmk-space-md);
  background: var(--dmk-color-surface);
  border-right: 1px solid var(--dmk-color-border);
  color: var(--dmk-color-text);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
}
</style>
