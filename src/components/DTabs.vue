<script setup lang="ts">
/**
 * DTabs —— 标签页（需与 DTabPane 搭配）。
 * 设计要点：TabPane 必须是 Tabs 的直接子元素——头部由默认插槽子 VNode 的 props
 * （name/label/disabled）解析生成，找不到 label 时 fallback 用 name；
 * 内容区渲染全部 pane 并用 v-show 切换（不销毁）；
 * 头部 role="tablist"，tab role="tab" + aria-selected，←→ 键切换（Home/End 到首尾），
 * line 型激活下划线滑动过渡，card 型卡片高亮过渡。
 */
import {
  computed,
  isVNode,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  useSlots,
  watch,
  type ComputedRef,
  type InjectionKey,
  type VNode
} from 'vue'
import DTabPane from './DTabPane.vue'

interface TabPaneInfo {
  name: string | number
  label: string
  disabled: boolean
}

interface TabsContext {
  activeName: ComputedRef<string | number>
  idPrefix: string
}

const TABS_KEY: InjectionKey<TabsContext> = Symbol.for('dmkTabs')

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    type?: 'line' | 'card'
    size?: 'sm' | 'md'
  }>(),
  {
    type: 'line',
    size: 'md'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'tab-click': [value: string | number]
}>()

/* 实例唯一 id 前缀（script setup 顶层变量按实例隔离，用随机串保证全局唯一） */
const idPrefix = `dmk-tabs-${Math.random().toString(36).slice(2, 8)}`

const slots = useSlots()
const navRef = ref<HTMLElement | null>(null)
const tabRefs = new Map<string | number, HTMLElement>()

function setTabRef(name: string | number, el: unknown) {
  if (el) tabRefs.set(name, el as HTMLElement)
  else tabRefs.delete(name)
}

/** 识别 TabPane 子节点（类型匹配，或带 name+label props 的兜底） */
function isPaneNode(vnode: VNode): boolean {
  const t = vnode.type as { __name?: string; name?: string } | string | symbol
  if (typeof t === 'object' && t !== null) {
    if ((t as unknown) === (DTabPane as unknown)) return true
    const c = t as { __name?: string; name?: string }
    if (c.__name === 'DTabPane' || c.name === 'DTabPane') return true
  }
  const p = (vnode.props ?? {}) as Record<string, unknown>
  return 'name' in p && 'label' in p
}

/** 解析直接子 TabPane 生成头部项 */
const panes = computed<TabPaneInfo[]>(() => {
  const res: TabPaneInfo[] = []
  for (const child of slots.default?.() ?? []) {
    if (!isVNode(child) || !isPaneNode(child)) continue
    const p = (child.props ?? {}) as Record<string, unknown>
    const name = p.name as string | number
    if (name === undefined || name === null) continue
    const label = p.label !== undefined && p.label !== null && p.label !== '' ? String(p.label) : String(name)
    res.push({ name, label, disabled: Boolean(p.disabled) })
  }
  return res
})

provide(TABS_KEY, {
  activeName: computed(() => props.modelValue),
  idPrefix
})

/* ---- 激活下划线滑动指示（line 型） ---- */
const indicatorStyle = ref({ left: '0px', width: '0px' })

function updateIndicator() {
  if (props.type !== 'line') return
  const el = tabRefs.get(props.modelValue)
  if (!el || !navRef.value) return
  indicatorStyle.value = { left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` }
}

function onTabClick(tab: TabPaneInfo) {
  if (tab.disabled) return
  emit('tab-click', tab.name)
  if (tab.name !== props.modelValue) emit('update:modelValue', tab.name)
}

function onKeydown(e: KeyboardEvent) {
  const enabled = panes.value.filter((p) => !p.disabled)
  if (!enabled.length) return
  const idx = enabled.findIndex((p) => p.name === props.modelValue)
  let nextIdx = -1
  if (e.key === 'ArrowRight') nextIdx = idx < 0 ? 0 : (idx + 1) % enabled.length
  else if (e.key === 'ArrowLeft') nextIdx = idx < 0 ? 0 : (idx - 1 + enabled.length) % enabled.length
  else if (e.key === 'Home') nextIdx = 0
  else if (e.key === 'End') nextIdx = enabled.length - 1
  if (nextIdx < 0) return
  e.preventDefault()
  const target = enabled[nextIdx]
  emit('tab-click', target.name)
  emit('update:modelValue', target.name)
  nextTick(() => tabRefs.get(target.name)?.focus())
}

watch(
  () => [props.modelValue, props.type, props.size, panes.value.map((p) => p.name).join(',')],
  () => nextTick(updateIndicator)
)

onMounted(() => {
  updateIndicator()
  window.addEventListener('resize', updateIndicator)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIndicator)
})
</script>

<template>
  <div class="dmk-tabs" :class="[`t-${type}`, `s-${size}`]">
    <div ref="navRef" class="dmk-tabs__nav" role="tablist" @keydown="onKeydown">
      <button
        v-for="tab in panes"
        :key="tab.name"
        :ref="(el) => setTabRef(tab.name, el)"
        type="button"
        class="dmk-tabs__tab"
        :class="{ 'is-active': tab.name === modelValue, 'is-disabled': tab.disabled }"
        role="tab"
        :id="`${idPrefix}-tab-${tab.name}`"
        :aria-selected="tab.name === modelValue"
        :aria-controls="`${idPrefix}-pane-${tab.name}`"
        :tabindex="tab.name === modelValue ? 0 : -1"
        :disabled="tab.disabled"
        @click="onTabClick(tab)"
      >
        {{ tab.label }}
      </button>
      <span v-if="type === 'line'" class="dmk-tabs__ink" :style="indicatorStyle" aria-hidden="true" />
    </div>
    <div class="dmk-tabs__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dmk-tabs {
  display: flex;
  flex-direction: column;
  font-family: var(--dmk-font-family);
}

.dmk-tabs__nav {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: var(--dmk-space-xs);
  border-bottom: 1px solid var(--dmk-color-border);
}

.dmk-tabs__tab {
  padding: var(--dmk-space-sm) var(--dmk-space-lg);
  border: none;
  background: transparent;
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-base);
  font-family: var(--dmk-font-family);
  white-space: nowrap;
  cursor: pointer;
  transition:
    color var(--dmk-duration-fast) var(--dmk-ease),
    background-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-tabs__tab:hover:not(:disabled) {
  color: var(--dmk-color-primary);
}

.dmk-tabs__tab:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
  border-radius: var(--dmk-radius-sm);
}

.dmk-tabs__tab.is-active {
  color: var(--dmk-color-primary);
  font-weight: 600;
}

.dmk-tabs__tab.is-disabled {
  color: var(--dmk-color-text-muted);
  opacity: 0.55;
  cursor: not-allowed;
}

/* line 型：滑动下划线 */
.dmk-tabs__ink {
  position: absolute;
  bottom: -1px;
  height: 2px;
  background: var(--dmk-color-primary);
  transition:
    left var(--dmk-duration-base) var(--dmk-ease),
    width var(--dmk-duration-base) var(--dmk-ease);
}

/* card 型：卡片高亮 */
.dmk-tabs.t-card .dmk-tabs__nav {
  border-bottom: none;
  gap: var(--dmk-space-sm);
}

.dmk-tabs.t-card .dmk-tabs__tab {
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md) var(--dmk-radius-md) 0 0;
  background: var(--dmk-color-bg);
}

.dmk-tabs.t-card .dmk-tabs__tab.is-active {
  background: var(--dmk-color-surface);
  border-color: var(--dmk-color-border);
  border-bottom-color: var(--dmk-color-surface);
  color: var(--dmk-color-primary);
}

.dmk-tabs.t-card .dmk-tabs__ink {
  display: none;
}

.dmk-tabs__content {
  padding-top: var(--dmk-space-lg);
}

/* 尺寸 */
.dmk-tabs.s-sm .dmk-tabs__tab {
  padding: var(--dmk-space-xs) var(--dmk-space-md);
  font-size: var(--dmk-font-sm);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-tabs__tab,
  .dmk-tabs__ink {
    transition: none;
  }
}
</style>
