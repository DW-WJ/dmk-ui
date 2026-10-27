/**
 * 新手引导（DTour）的公共类型。
 * 放 lib 的原因：`<script setup>` 不允许 ES 具名导出，业务侧需要复用这个类型。
 */

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right'

/** 单个引导步骤 */
export interface TourStep {
  /** 目标元素：选择器字符串 / HTMLElement / 返回元素的函数 */
  target?: string | HTMLElement | (() => HTMLElement | null)
  /** 标题 */
  title?: string
  /** 描述 */
  description?: string
  /** 引导卡片相对目标的位置 */
  placement?: TourPlacement
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 目标不存在时是否跳过该步 */
  optional?: boolean
}
