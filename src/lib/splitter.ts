/**
 * 分割面板（DSplitter / DSplitterPanel）的内部通信契约。
 * 放 lib 的原因：`<script setup>` 不允许 ES 具名导出，且父子需共享同一 key 与类型。
 */
import type { ComputedRef, InjectionKey, Ref } from 'vue'

/**
 * 面板句柄。
 * 用途：拖拽条在【两个面板之间】，拖动时两侧尺寸要联动（总宽守恒），
 * 所以当前面板需要能拿到相邻面板的 min/max 与「设置尺寸」的能力。
 */
export interface SplitterPanelHandle {
  /** 本面板在兄弟中的序号 */
  index: number
  /** 最小尺寸 */
  readonly min?: string | number
  /** 最大尺寸 */
  readonly max?: string | number
  /** 设置尺寸（内部更新并 emit update:size） */
  setSize: (value: string | number) => void
}

/** DSplitter 提供给 DSplitterPanel 的接口 */
export interface SplitterRegistry {
  /** 当前排列方向 */
  layout: ComputedRef<'horizontal' | 'vertical'>
  /** 当前正在拖拽的拖拽条下标（-1 表示未拖拽） */
  draggingIndex: Ref<number>
  /** 已注册的面板（按序号升序） */
  panels: Ref<SplitterPanelHandle[]>
  /** 注册面板 */
  register: (handle: SplitterPanelHandle) => void
  /** 注销面板 */
  unregister: (index: number) => void
  /** 派发 resize-start */
  emitResizeStart: (index: number) => void
  /** 派发 resize */
  emitResize: (index: number, size: number) => void
  /** 派发 resize-end */
  emitResizeEnd: (index: number) => void
  /** 派发 collapse */
  emitCollapse: (index: number) => void
}

export const SPLITTER_REGISTRY_KEY: InjectionKey<SplitterRegistry> = Symbol('dmk-splitter-registry')
