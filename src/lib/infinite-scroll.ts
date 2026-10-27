/**
 * 无限滚动的公共类型与工具。
 * 放 lib 的原因：`<script setup>` 不允许 ES 具名导出，
 * 组件与指令两套形态要共用同一份判定逻辑。
 */

/** 无限滚动参数 */
export interface InfiniteScrollOptions {
  /** 是否禁用 */
  disabled?: boolean
  /** 节流延迟 ms */
  delay?: number
  /** 触底判定距离 px */
  distance?: number
  /** 内容不足以填满容器时是否立即触发 */
  immediate?: boolean
}

/** 默认参数 */
export const DEFAULT_INFINITE_SCROLL_OPTIONS: Required<InfiniteScrollOptions> = {
  disabled: false,
  delay: 200,
  distance: 0,
  immediate: true
}

/**
 * 判断元素是否已到达底部。
 * @param el 滚动容器
 * @param distance 触底判定距离（离底部还有多远就算触底）
 */
export function isReachBottom(el: HTMLElement, distance = 0): boolean {
  const remain = el.scrollHeight - el.scrollTop - el.clientHeight
  return remain <= distance
}

/**
 * 判断容器内容是否不足以填满（需要立即加载）。
 */
export function isContentUnderfilled(el: HTMLElement): boolean {
  return el.scrollHeight <= el.clientHeight
}

/**
 * 节流包装：同一时间只允许一次调用，间隔内重复调用会被丢弃。
 * 返回带 cancel 的节流函数。
 */
export function throttle<T extends (...args: never[]) => void>(fn: T, wait: number): T & { cancel: () => void } {
  let last = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  const wrapped = ((...args: never[]) => {
    const now = Date.now()
    const rest = wait - (now - last)
    if (rest <= 0) {
      last = now
      fn(...args)
    } else if (!timer) {
      // 保证最后一次调用不会被永久丢弃
      timer = setTimeout(() => {
        last = Date.now()
        timer = null
        fn(...args)
      }, rest)
    }
  }) as T & { cancel: () => void }
  wrapped.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  return wrapped
}
