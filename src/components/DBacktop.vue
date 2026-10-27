<script setup lang="ts">
/**
 * DBacktop —— 回到顶部。
 * 契约参考 Element Plus el-backtop：
 *   target（触发滚动的目标 CSS 选择器）/ visibilityHeight（超过多少滚动才显示）/
 *   right / bottom
 *   Events: click
 *   Slots: default（自定义按钮内容）
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    target?: string
    visibilityHeight?: number
    right?: number
    bottom?: number
  }>(),
  {
    target: undefined,
    visibilityHeight: 200,
    right: 40,
    bottom: 40
  }
)

const emit = defineEmits<{
  click: []
}>()

/** 是否可见 */
const visible = ref(false)
/** 滚动容器 */
const scroller = ref<HTMLElement | Window | null>(null)

function resolveScroller(): HTMLElement | Window {
  if (props.target) {
    const el = document.querySelector<HTMLElement>(props.target)
    if (el) return el
  }
  return window
}

function currentScrollTop(): number {
  const s = scroller.value
  if (!s) return 0
  if (s === window) return window.scrollY
  return (s as HTMLElement).scrollTop
}

function onScroll() {
  visible.value = currentScrollTop() > props.visibilityHeight
}

onMounted(() => {
  scroller.value = resolveScroller()
  onScroll()
  scroller.value.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  scroller.value?.removeEventListener('scroll', onScroll)
})

/** 平滑回顶 */
function scrollToTop() {
  const s = scroller.value
  if (!s) return
  if (s === window) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    ;(s as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' })
  }
  emit('click')
}

const style = computed(() => ({
  right: `${props.right}px`,
  bottom: `${props.bottom}px`
}))
</script>

<template>
  <Transition name="dmk-backtop-fade">
    <button
      v-show="visible"
      type="button"
      class="dmk-backtop"
      :style="style"
      aria-label="回到顶部"
      @click="scrollToTop"
    >
      <slot>
        <svg class="dmk-backtop__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      </slot>
    </button>
  </Transition>
</template>

<style scoped>
.dmk-backtop {
  position: fixed;
  z-index: var(--dmk-z-popup);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--dmk-color-border);
  border-radius: 50%;
  background: var(--dmk-color-surface);
  color: var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-md);
  cursor: pointer;
  transition:
    background-color var(--dmk-duration-fast) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-backtop:hover {
  background: var(--dmk-color-primary);
  border-color: var(--dmk-color-primary);
  color: var(--dmk-color-on-primary);
  box-shadow: var(--dmk-shadow-primary);
}

.dmk-backtop:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-backtop__icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.dmk-backtop-fade-enter-active,
.dmk-backtop-fade-leave-active {
  transition: opacity var(--dmk-duration-base) var(--dmk-ease);
}

.dmk-backtop-fade-enter-from,
.dmk-backtop-fade-leave-to {
  opacity: 0;
}
</style>
