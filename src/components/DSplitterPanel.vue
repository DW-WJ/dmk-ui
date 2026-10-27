<script setup lang="ts">
/**
 * DSplitterPanel —— 分割面板（DSplitter 的子组件）。
 * 契约参考 Element Plus el-splitter-panel：
 *   Attributes: size（v-model:size，px 或百分比）/ min / max / resizable / collapsible
 *   Events: update:size
 *   Slots: default / start-collapsible / end-collapsible
 *
 * 实现：面板用 flex-basis 表示尺寸；拖拽条（相邻面板之间）用 pointer 事件调整。
 */
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { SPLITTER_REGISTRY_KEY } from '../lib/splitter'

const props = withDefaults(
  defineProps<{
    /** 面板尺寸（px 或百分比字符串） */
    size?: string | number
    /** 最小尺寸 */
    min?: string | number
    /** 最大尺寸 */
    max?: string | number
    /** 是否可拖拽调整 */
    resizable?: boolean
    /** 是否可折叠 */
    collapsible?: boolean
  }>(),
  {
    size: undefined,
    min: undefined,
    max: undefined,
    resizable: true,
    collapsible: false
  }
)

const emit = defineEmits<{
  'update:size': [value: string | number]
}>()

const registry = inject(SPLITTER_REGISTRY_KEY, null)

/** 本面板在兄弟中的序号 */
const index = ref(-1)
const panelRef = ref<HTMLElement | null>(null)
/** 已折叠 */
const collapsed = ref(false)

onMounted(() => {
  // 注册到父容器（用 DOM 顺序推断序号）
  const parent = panelRef.value?.parentElement
  if (!parent) return
  const panels = [...parent.querySelectorAll<HTMLElement>('[data-splitter-panel]')]
  index.value = panels.indexOf(panelRef.value as HTMLElement)
  registry?.register({
    index: index.value,
    // 用 getter 保持与 props 的联动
    get min() {
      return props.min
    },
    get max() {
      return props.max
    },
    setSize
  })
})

onBeforeUnmount(() => {
  registry?.unregister(index.value)
})

/**
 * 面板当前尺寸。
 * ⚠️ 必须内部维护一份 localSize：拖拽时只 emit('update:size') 是不够的 ——
 *    业务侧没绑 v-model:size 时 prop 不会变回来，拖拽就毫无反应。
 *    内部值负责「立刻生效」，prop 变化时再同步回来（受控用法）。
 */
const localSize = ref<string | number | undefined>(props.size)

watch(
  () => props.size,
  (v) => {
    localSize.value = v
  }
)

/** 面板尺寸样式 */
const panelStyle = computed(() => {
  const s = localSize.value
  if (s === undefined) return { flex: '1 1 0%', minWidth: '0', minHeight: '0' }
  const value = typeof s === 'number' ? `${s}px` : s
  const horizontal = registry?.layout.value === 'horizontal'
  return horizontal
    ? { flex: `0 0 ${value}`, width: value, minWidth: '0' }
    : { flex: `0 0 ${value}`, height: value, minHeight: '0' }
})

/** 是否处于拖拽中（拖拽条跟面板相邻时高亮） */
const isDragging = computed(() => registry?.draggingIndex.value === index.value)

/**
 * 排列方向（决定拖拽条是竖条还是横条）。
 * ⚠️ 不能用 `:deep(.dmk-splitter--horizontal)` 选父组件的 class ——
 *    父容器根节点没有本组件的 scope 属性，:deep 匹配不上，样式会整块失效。
 *    正确做法：本组件自己读 registry.layout 加方向类。
 */
const isHorizontal = computed(() => registry?.layout.value === 'horizontal')

/* ---------------- 拖拽条 ---------------- */

/**
 * 设置面板尺寸（内部生效 + 通知外部）。
 * 供相邻面板在拖拽时联动调用。
 */
function setSize(value: string | number) {
  localSize.value = value
  emit('update:size', value)
}

/**
 * 拖拽条（渲染在面板右侧/下侧）。
 * ⚠️ 拖拽条只在「相邻面板之间」才存在，最后一个面板不该再有一条 ——
 *    否则容器最右缘会多出一条没有意义的拖拽条。
 */
const barVisible = computed(() => {
  if (!props.resizable) return false
  const total = registry?.panels.value.length ?? 0
  // 面板还没注册完时先不渲染，等注册完成再显示
  if (total <= 1) return false
  return index.value >= 0 && index.value < total - 1
})

let startPos = 0
let startSize = 0

function onBarDown(e: PointerEvent) {
  if (!props.resizable || !registry) return
  const parent = panelRef.value?.parentElement
  if (!parent) return

  const horizontal = registry.layout.value === 'horizontal'
  startPos = horizontal ? e.clientX : e.clientY
  const rect = panelRef.value?.getBoundingClientRect()
  startSize = horizontal ? (rect?.width ?? 0) : (rect?.height ?? 0)

  registry.draggingIndex.value = index.value
  registry.emitResizeStart(index.value)

  window.addEventListener('pointermove', onBarMove)
  window.addEventListener('pointerup', onBarUp)
  e.preventDefault()
}

function onBarMove(e: PointerEvent) {
  if (!registry) return
  const parent = panelRef.value?.parentElement
  if (!parent) return

  const horizontal = registry.layout.value === 'horizontal'
  const delta = (horizontal ? e.clientX : e.clientY) - startPos
  const total = horizontal ? parent.clientWidth : parent.clientHeight
  if (!total) return

  let next = startSize + delta
  // 夹在 min/max 之间
  const minPx = toPx(props.min, total)
  const maxPx = toPx(props.max, total)
  if (minPx !== null) next = Math.max(next, minPx)
  if (maxPx !== null) next = Math.min(next, maxPx)
  next = Math.max(0, next)

  let pct = (next / total) * 100

  // ⚠️ 拖拽条在两个面板【之间】，所以两侧要联动、总宽守恒。
  //    只改当前面板会让 30% + 70% 变成 44% + 70%（溢出 114%）。
  const neighbour = registry.panels.value.find((p) => p.index === index.value + 1)
  if (neighbour) {
    // 兄弟吃掉剩余空间，但也要满足它自己的 min/max
    let rest = 100 - pct
    const nbMin = toPx(neighbour.min, total)
    const nbMax = toPx(neighbour.max, total)
    if (nbMin !== null) rest = Math.max(rest, (nbMin / total) * 100)
    if (nbMax !== null) rest = Math.min(rest, (nbMax / total) * 100)
    rest = Math.max(0, rest)
    neighbour.setSize(`${rest.toFixed(2)}%`)
    pct = 100 - rest
  }

  const nextSize = `${pct.toFixed(2)}%`
  setSize(nextSize)
  registry.emitResize(index.value, next)
}

/** min/max 换算成像素（百分比按容器总长算） */
function toPx(v: string | number | undefined, total: number): number | null {
  if (v === undefined) return null
  if (typeof v === 'number') return v
  if (v.endsWith('%')) return (parseFloat(v) / 100) * total
  return parseFloat(v) || null
}

function onBarUp() {
  if (!registry) return
  registry.emitResizeEnd(index.value)
  registry.draggingIndex.value = -1
  window.removeEventListener('pointermove', onBarMove)
  window.removeEventListener('pointerup', onBarUp)
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onBarMove)
  window.removeEventListener('pointerup', onBarUp)
})

/** 折叠前的尺寸（展开时恢复） */
const savedSize = ref<string | number | undefined>(undefined)

/** 折叠：尺寸归零，释放的空间交给相邻面板 */
function collapse() {
  if (!props.collapsible) return
  const neighbour = registry?.panels.value.find((p) => p.index === index.value + 1)
  collapsed.value = !collapsed.value
  if (collapsed.value) {
    savedSize.value = localSize.value
    setSize(0)
    neighbour?.setSize('100%')
  } else {
    const restored = savedSize.value ?? '50%'
    setSize(restored)
    if (neighbour) {
      const pct = typeof restored === 'number' ? restored : parseFloat(restored) || 50
      neighbour.setSize(`${Math.max(0, 100 - pct).toFixed(2)}%`)
    }
  }
  registry?.emitCollapse(index.value)
}
</script>

<template>
  <div ref="panelRef" class="dmk-splitter-panel" :class="{ 'is-collapsed': collapsed }" data-splitter-panel :style="panelStyle">
    <slot />

    <div
      v-if="barVisible"
      class="dmk-splitter-bar"
      :class="[isHorizontal ? 'is-horizontal' : 'is-vertical', { 'is-dragging': isDragging }]"
      role="separator"
      :aria-orientation="registry?.layout.value === 'horizontal' ? 'vertical' : 'horizontal'"
      tabindex="0"
      @pointerdown="onBarDown"
    >
      <span class="dmk-splitter-bar__grip" aria-hidden="true" />
      <button
        v-if="collapsible"
        type="button"
        class="dmk-splitter-collapse"
        :aria-label="collapsed ? '展开面板' : '折叠面板'"
        @pointerdown.stop
        @click="collapse"
      >
        {{ collapsed ? '›' : '‹' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.dmk-splitter-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--dmk-color-surface);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  color: var(--dmk-color-text);
}

/* 拖拽条：方向由本组件的 is-horizontal / is-vertical 决定 */
.dmk-splitter-bar {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background-color var(--dmk-duration-fast) var(--dmk-ease);
}

/*
 * 横向排列：拖拽条在右侧，竖向一条。
 * ⚠️ 用 right:0 而不是负值 —— 面板是 overflow:hidden，
 *    负值会让拖拽条一半被裁掉，露出的那半又被后渲染的兄弟面板盖住，
 *    结果就是「看得见却点不到」。
 */
.dmk-splitter-bar.is-horizontal {
  top: 0;
  right: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
}

/* 纵向排列：拖拽条在底部 */
.dmk-splitter-bar.is-vertical {
  right: 0;
  bottom: 0;
  left: 0;
  height: 6px;
  cursor: row-resize;
}

.dmk-splitter-bar:hover,
.dmk-splitter-bar.is-dragging {
  background: var(--dmk-color-primary-subtle);
}

.dmk-splitter-bar:focus-visible {
  outline: none;
  background: var(--dmk-color-primary-subtle);
}

.dmk-splitter-collapse {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-muted);
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
}

/* 抓手：横向是竖条，纵向是横条 */
.dmk-splitter-bar__grip {
  width: 2px;
  height: 24px;
  border-radius: 1px;
  background: var(--dmk-color-border-strong);
}

.dmk-splitter-bar.is-vertical .dmk-splitter-bar__grip {
  width: 24px;
  height: 2px;
}
</style>
