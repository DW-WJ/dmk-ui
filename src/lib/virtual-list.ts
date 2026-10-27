/**
 * 虚拟滚动内核（纯函数，零依赖）。
 * ---------------------------------------------------------------------------
 * 背景：Element Plus 的 select-v2 / table-v2 / tree-v2 都是「虚拟化」组件，
 *       本质都是同一件事 —— 只渲染可视区内的条目，其余用占位撑开。
 *       与其三套各写一遍（各自实现一遍滚动区间计算），不如抽成内核复用。
 *
 * 适用范围：**定高条目**（fixed item height）。
 *   - 选择器：每项一个高度（itemHeight）
 *   - 表格：每列一个宽度（虚拟化的是列，行仍是普通渲染）
 *   - 树：每节点一个高度（先扁平化成可见节点列表，再按行虚拟化）
 *
 * 不适用：变高条目（需要测量 + 高度缓存，复杂度高一个量级）。
 */

/** 虚拟滚动计算结果 */
export interface VirtualRange {
  /** 起始下标（含） */
  start: number
  /** 结束下标（不含） */
  end: number
  /** 列表总高度（px） */
  totalSize: number
  /** 结束下标对应的偏移量（px） */
  offset: number
}

/** 计算参数 */
export interface VirtualCalcOptions {
  /** 条目总数 */
  count: number
  /** 每条目高度（px） */
  itemSize: number
  /** 容器可视高度（px） */
  viewportSize: number
  /** 容器滚动偏移（px） */
  scrollTop: number
  /** 上下各多渲染几个（避免快速滚动露白） */
  overscan?: number
}

/**
 * 计算当前应该渲染的条目区间。
 *
 * @returns start/end 是 [start, end) 区间；count 为 0 时返回空区间
 */
export function calcVirtualRange(opts: VirtualCalcOptions): VirtualRange {
  const { count, itemSize, viewportSize, scrollTop } = opts
  const overscan = opts.overscan ?? 2

  if (count <= 0 || itemSize <= 0) {
    return { start: 0, end: 0, totalSize: 0, offset: 0 }
  }

  const totalSize = count * itemSize

  // 滚动偏移超界时收敛（内容变短、容器被拉伸等场景）
  const maxScroll = Math.max(0, totalSize - viewportSize)
  const offset = Math.min(Math.max(scrollTop, 0), maxScroll)

  const firstVisible = Math.floor(offset / itemSize)
  const lastVisible = Math.ceil((offset + viewportSize) / itemSize)

  const start = Math.max(0, firstVisible - overscan)
  const end = Math.min(count, lastVisible + overscan)

  return { start, end, totalSize, offset }
}

/**
 * 虚拟列表的响应式状态工厂（供组件用）。
 * 用法：const vlist = useVirtualList({ count, itemSize })；vlist.onScroll() 更新。
 */
export interface VirtualListState {
  /** 起始下标 */
  start: number
  /** 结束下标（不含） */
  end: number
  /** 列表总高度（px），用于撑开滚动容器 */
  totalSize: number
  /** 计算区间 */
  update: (scrollTop: number, viewportSize: number) => void
}

/** 创建虚拟列表状态 */
export function createVirtualList(
  params: { count: () => number; itemSize: () => number; overscan?: number },
  onChange: (range: VirtualRange) => void
): VirtualListState {
  let range: VirtualRange = { start: 0, end: 0, totalSize: 0, offset: 0 }

  const update = (scrollTop: number, viewportSize: number) => {
    const next = calcVirtualRange({
      count: params.count(),
      itemSize: params.itemSize(),
      viewportSize,
      scrollTop,
      overscan: params.overscan
    })
    // 区间没变就不通知（避免每次滚动都触发重渲染）
    if (next.start === range.start && next.end === range.end && next.totalSize === range.totalSize) {
      range = { ...next, offset: range.offset }
      return
    }
    range = next
    onChange(range)
  }

  return {
    get start() {
      return range.start
    },
    get end() {
      return range.end
    },
    get totalSize() {
      return range.totalSize
    },
    update
  }
}
