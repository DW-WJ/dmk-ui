/**
 * vInfiniteScroll —— 无限滚动指令（对齐 Element Plus 的 v-infinite-scroll）。
 *
 * 用法：
 *   <div v-infinite-scroll="load">…</div>
 *   <div v-infinite-scroll="{ load, disabled, delay, distance, immediate }">…</div>
 *
 * 参数与 EP 一致：disabled / delay / distance / immediate。
 */
import type { Directive, DirectiveBinding } from 'vue'
import {
  DEFAULT_INFINITE_SCROLL_OPTIONS,
  isContentUnderfilled,
  isReachBottom,
  throttle,
  type InfiniteScrollOptions
} from '../lib/infinite-scroll'

/** 指令挂在元素上的内部状态 */
interface InfiniteScrollState {
  /** 解析后的加载回调 */
  load: (() => void) | undefined
  /** 生效的参数 */
  options: Required<InfiniteScrollOptions>
  /** 节流后的触发函数 */
  throttled: (() => void) & { cancel: () => void }
  /** 卸载时解绑 */
  dispose: () => void
}

const STATE_KEY = '__dmkInfiniteScroll'

type BoundEl = HTMLElement & { [STATE_KEY]?: InfiniteScrollState }

/** 从绑定值里解析出加载回调与参数 */
function resolveBinding(value: unknown): {
  load: (() => void) | undefined
  options: Required<InfiniteScrollOptions>
} {
  if (typeof value === 'function') {
    return { load: value as () => void, options: { ...DEFAULT_INFINITE_SCROLL_OPTIONS } }
  }
  if (value && typeof value === 'object') {
    const obj = value as { load?: () => void } & Partial<InfiniteScrollOptions>
    return {
      load: obj.load,
      options: {
        disabled: obj.disabled ?? DEFAULT_INFINITE_SCROLL_OPTIONS.disabled,
        delay: obj.delay ?? DEFAULT_INFINITE_SCROLL_OPTIONS.delay,
        distance: obj.distance ?? DEFAULT_INFINITE_SCROLL_OPTIONS.distance,
        immediate: obj.immediate ?? DEFAULT_INFINITE_SCROLL_OPTIONS.immediate
      }
    }
  }
  return { load: undefined, options: { ...DEFAULT_INFINITE_SCROLL_OPTIONS } }
}

export const vInfiniteScroll: Directive<BoundEl, unknown> = {
  mounted(el: BoundEl, binding: DirectiveBinding<unknown>) {
    const { load, options } = resolveBinding(binding.value)

    const throttled = throttle(() => {
      load?.()
    }, options.delay)

    const onScroll = () => {
      const state = el[STATE_KEY]
      if (!state || state.options.disabled) return
      if (isReachBottom(el, state.options.distance)) state.throttled()
    }

    el.addEventListener('scroll', onScroll, { passive: true })

    const state: InfiniteScrollState = {
      load,
      options,
      throttled,
      dispose: () => {
        el.removeEventListener('scroll', onScroll)
        throttled.cancel()
      }
    }
    el[STATE_KEY] = state

    // immediate：内容不足以填满容器时立即触发一次
    if (options.immediate && !options.disabled && load) {
      void Promise.resolve().then(() => {
        if (isContentUnderfilled(el)) load()
      })
    }
  },

  updated(el: BoundEl, binding: DirectiveBinding<unknown>) {
    const state = el[STATE_KEY]
    if (!state) return
    const { load, options } = resolveBinding(binding.value)
    state.load = load
    state.options = options
    state.throttled.cancel()
  },

  unmounted(el: BoundEl) {
    el[STATE_KEY]?.dispose()
    delete el[STATE_KEY]
  }
}
