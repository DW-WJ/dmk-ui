<script setup lang="ts">
/**
 * DSplitter —— 分割面板容器。
 * 契约参考 Element Plus el-splitter：
 *   Attributes: layout（horizontal | vertical）/ lazy（拖动时不实时更新尺寸）
 *   Events: resize-start / resize / resize-end / collapse（均带拖拽条下标 index）
 *
 * 子组件：DSplitterPanel（面板）。
 * 实现：容器用 flex；拖拽条按下后监听 pointermove，
 *      按方向计算两侧面板的尺寸百分比并派发给相邻面板。
 */
import { computed, provide, ref } from 'vue'
import { SPLITTER_REGISTRY_KEY, type SplitterPanelHandle, type SplitterRegistry } from '../lib/splitter'

const props = withDefaults(
  defineProps<{
    /** 排列方向 */
    layout?: 'horizontal' | 'vertical'
    /** 懒更新：拖动过程中不实时改尺寸，松手才生效 */
    lazy?: boolean
  }>(),
  {
    layout: 'horizontal',
    lazy: false
  }
)

const emit = defineEmits<{
  'resize-start': [index: number]
  resize: [index: number, size: number]
  'resize-end': [index: number]
  collapse: [index: number]
}>()

/** 拖拽条下标（-1 表示未拖拽） */
const draggingIndex = ref(-1)

/** 已注册的面板（按序号升序） */
const panels = ref<SplitterPanelHandle[]>([])

/** 提供给子面板的注册接口 */
const registry: SplitterRegistry = {
  layout: computed(() => props.layout),
  draggingIndex,
  panels,
  register: (handle: SplitterPanelHandle) => {
    panels.value = [...panels.value.filter((p) => p.index !== handle.index), handle].sort(
      (a, b) => a.index - b.index
    )
  },
  unregister: (index: number) => {
    panels.value = panels.value.filter((p) => p.index !== index)
  },
  emitResizeStart: (index: number) => emit('resize-start', index),
  emitResize: (index: number, size: number) => emit('resize', index, size),
  emitResizeEnd: (index: number) => emit('resize-end', index),
  emitCollapse: (index: number) => emit('collapse', index)
}

provide(SPLITTER_REGISTRY_KEY, registry)

const rootClass = computed(() => [
  'dmk-splitter',
  `dmk-splitter--${props.layout}`
])
</script>

<template>
  <div :class="rootClass">
    <slot />
  </div>
</template>

<style scoped>
.dmk-splitter {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  font-family: var(--dmk-font-family);
}

.dmk-splitter--horizontal {
  flex-direction: row;
}

.dmk-splitter--vertical {
  flex-direction: column;
}
</style>
