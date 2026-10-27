/**
 * 锚点导航的内部通信契约（DAnchor ↔ DAnchorLink）。
 *
 * 为什么放 lib：`<script setup>` 不允许 ES 具名导出（export interface 会编译失败），
 * 而子组件需要 inject 同一个 key、拿到同一份类型定义 —— 必须放独立模块。
 */
import type { InjectionKey } from 'vue'

/** 已注册的锚点项 */
export interface AnchorItem {
  /** 锚点地址（#id 或 id） */
  href: string
  /** 显示文案 */
  label: string
  /** 层级（子锚点用） */
  level: number
}

/** DAnchor 提供给 DAnchorLink 的注册接口 */
export interface AnchorRegistry {
  /** 注册一个锚点 */
  register: (item: AnchorItem) => void
  /** 注销一个锚点 */
  unregister: (href: string) => void
  /** 滚动到指定锚点 */
  scrollTo: (href: string) => void
  /** 子组件点击时通知父级（父级据此抛 click 事件） */
  notifyClick: (href: string, event: MouseEvent) => void
}

export const ANCHOR_REGISTRY_KEY: InjectionKey<AnchorRegistry> = Symbol('dmk-anchor-registry')
