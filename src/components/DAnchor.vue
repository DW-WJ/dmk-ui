<script setup lang="ts">
/**
 * DAnchor —— 锚点导航。
 * 契约参考 Element Plus el-anchor：
 *   container（滚动容器 CSS 选择器）/ offset（滚动偏移）/ bound（触发阈值）/
 *   duration（滚动时长 ms）/ marker（是否显示标记）/ type（default | underline）/
 *   direction（vertical | horizontal）/ selectScrollTop
 *   Events: change（当前锚点变化）/ click（点击链接）
 *   Exposes: scrollTo（手动滚动到指定位置）
 *   Slots: default（AnchorLink 列表）
 *
 * 实现：默认插槽里的 DAnchorLink 通过 inject 注册自己；
 *      滚动时按「各锚点距容器顶部的距离」判定当前项。
 */
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { ANCHOR_REGISTRY_KEY, type AnchorItem, type AnchorRegistry } from '../lib/anchor'

const props = withDefaults(
  defineProps<{
    container?: string | HTMLElement
    offset?: number
    bound?: number
    duration?: number
    marker?: boolean
    type?: 'default' | 'underline'
    direction?: 'vertical' | 'horizontal'
    selectScrollTop?: boolean
  }>(),
  {
    container: undefined,
    offset: 0,
    bound: 15,
    duration: 300,
    marker: true,
    type: 'default',
    direction: 'vertical',
    selectScrollTop: false
  }
)

const emit = defineEmits<{
  change: [href: string]
  click: [href: string, event: MouseEvent]
}>()

/** 已注册的锚点项 */
const links = ref<AnchorItem[]>([])
/** 当前激活的 href */
const activeHref = ref('')

/** 给子组件用的注册接口 */
const registry: AnchorRegistry = {
  register(item) {
    if (!links.value.some((l) => l.href === item.href)) links.value.push(item)
  },
  unregister(href) {
    links.value = links.value.filter((l) => l.href !== href)
  },
  scrollTo(href) {
    scrollToHref(href)
  },
  notifyClick(href, event) {
    event.preventDefault()
    scrollToHref(href)
    activeHref.value = href
    emit('change', href)
    emit('click', href, event)
  }
}

provide(ANCHOR_REGISTRY_KEY, registry)

/** 滚动容器 */
function resolveContainer(): HTMLElement | Window {
  if (typeof props.container === 'string') {
    const el = document.querySelector<HTMLElement>(props.container)
    if (el) return el
  } else if (props.container) {
    return props.container
  }
  return window
}

let scroller: HTMLElement | Window = window

/** 锚点目标元素 */
function targetEl(href: string): HTMLElement | null {
  const id = href.startsWith('#') ? href.slice(1) : href
  return document.getElementById(id)
}

/** 滚动到锚点 */
function scrollToHref(href: string) {
  const el = targetEl(href)
  if (!el) return
  const containerRect =
    scroller === window ? { top: 0 } : (scroller as HTMLElement).getBoundingClientRect()
  const rect = el.getBoundingClientRect()
  const top = rect.top - containerRect.top + props.offset
  if (scroller === window) {
    window.scrollTo({ top, behavior: 'smooth' })
  } else {
    ;(scroller as HTMLElement).scrollTo({ top, behavior: 'smooth' })
  }
}

/** 滚动时判定当前锚点 */
function onScroll() {
  if (!links.value.length) return
  const containerRect =
    scroller === window ? { top: 0, bottom: window.innerHeight } : (scroller as HTMLElement).getBoundingClientRect()

  let current = links.value[0].href
  for (const link of links.value) {
    const el = targetEl(link.href)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    // 元素顶边进入「阈值线」以内即视为当前项
    if (rect.top - containerRect.top - props.offset <= props.bound) {
      current = link.href
    } else {
      break
    }
  }

  // selectScrollTop：滚到最顶部时选中第一项
  if (props.selectScrollTop && scroller === window && window.scrollY <= 0) {
    current = links.value[0].href
  }

  if (current !== activeHref.value) {
    activeHref.value = current
    emit('change', current)
  }
}

onMounted(() => {
  scroller = resolveContainer()
  scroller.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  scroller.removeEventListener('scroll', onScroll)
})

const rootClass = computed(() => [
  'dmk-anchor',
  `dmk-anchor--${props.direction}`,
  `dmk-anchor--${props.type}`,
  { 'is-marker': props.marker }
])

defineExpose({
  scrollTo: scrollToHref,
  /** 供子组件注册用的内部接口 */
  registry
})
</script>

<template>
  <nav :class="rootClass" aria-label="锚点导航">
    <slot />
  </nav>
</template>

<style scoped>
.dmk-anchor {
  position: relative;
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  color: var(--dmk-color-text-secondary);
}

.dmk-anchor--vertical {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 12px;
  border-left: 1px solid var(--dmk-color-border);
}

.dmk-anchor--horizontal {
  display: flex;
  flex-direction: row;
  gap: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--dmk-color-border);
}
</style>
