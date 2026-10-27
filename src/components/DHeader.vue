<script setup lang="ts">
/**
 * DHeader —— 页头容器。契约参考 el-header：height（默认 60px）。
 * 挂载时向父 DContainer 登记「纵向块」，父容器自动切 column 方向。
 */
import { inject, onBeforeUnmount, onMounted } from 'vue'
import { CONTAINER_REGISTRY_KEY } from '../lib/container'

withDefaults(
  defineProps<{
    height?: string
  }>(),
  {
    height: '60px'
  }
)

const registry = inject(CONTAINER_REGISTRY_KEY, null)

onMounted(() => {
  if (registry) registry.hasVerticalBlock.value = true
})

onBeforeUnmount(() => {
  if (registry) registry.hasVerticalBlock.value = false
})
</script>

<template>
  <header class="dmk-header" :style="{ height }">
    <slot />
  </header>
</template>

<style scoped>
.dmk-header {
  flex-grow: 0;
  flex-shrink: 0;
  box-sizing: border-box;
  padding: var(--dmk-space-md) var(--dmk-space-lg);
  background: var(--dmk-color-surface);
  border-bottom: 1px solid var(--dmk-color-border);
  color: var(--dmk-color-text);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
}
</style>
