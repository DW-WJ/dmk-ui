<script setup lang="ts">
/**
 * DMain —— 主要内容容器。契约参考 el-main：仅默认插槽。
 */
</script>

<template>
  <main class="dmk-main">
    <slot />
  </main>
</template>

<style scoped>
.dmk-main {
  flex: 1;
  flex-basis: auto;
  box-sizing: border-box;
  overflow: auto;
  padding: var(--dmk-space-lg);
  background: var(--dmk-color-bg);
  color: var(--dmk-color-text);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
}
</style>
