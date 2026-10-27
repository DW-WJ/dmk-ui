<script setup lang="ts">
/**
 * DCarouselItem —— 轮播子项（配合 DCarousel 使用）。
 * 契约参考 Element Plus el-carousel-item：
 *   Attributes: name（供 setActiveItem 按名跳转）/ label（对应指示器文案）
 *   Slots: default
 */
import { inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { CAROUSEL_REGISTRY_KEY } from '../lib/carousel'

const props = withDefaults(
  defineProps<{
    /** 子项名称，setActiveItem 可按此名跳转 */
    name?: string
    /** 指示器文案 */
    label?: string | number
  }>(),
  {
    name: '',
    label: ''
  }
)

const registry = inject(CAROUSEL_REGISTRY_KEY, null)

/** 本项在兄弟中的序号 */
const index = ref(-1)

onMounted(() => {
  // 用 DOM 顺序推断序号
  const parent = rootRef.value?.parentElement
  if (!parent) return
  const items = [...parent.querySelectorAll<HTMLElement>('[data-carousel-item]')]
  index.value = items.indexOf(rootRef.value as HTMLElement)
  registry?.register(index.value)
})

onBeforeUnmount(() => {
  registry?.unregister(index.value)
})

/** 子项元素 */
const rootRef = ref<HTMLElement | null>(null)

/** 样式：撑满轨道的一格 */
const itemStyle = {
  flex: '0 0 100%',
  width: '100%',
  boxSizing: 'border-box' as const
}
</script>

<template>
  <div ref="rootRef" class="dmk-carousel-item" data-carousel-item :data-carousel-name="props.name" :style="itemStyle">
    <slot />
  </div>
</template>

<style scoped>
.dmk-carousel-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  height: 100%;
  color: var(--dmk-color-text);
  font-family: var(--dmk-font-family);
}
</style>
