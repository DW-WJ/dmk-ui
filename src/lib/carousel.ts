/**
 * DCarousel（轮播）的内部通信契约。
 * 放 lib 的原因：`<script setup>` 不允许 ES 具名导出，且父子需共享同一 key 与类型。
 */
import type { InjectionKey, Ref } from 'vue'

/** DCarousel 提供给 DCarouselItem 的接口 */
export interface CarouselRegistry {
  /** 当前激活项的下标 */
  activeIndex: Ref<number>
  /** 子项总数 */
  count: Ref<number>
  /** 跳到指定下标 */
  goTo: (index: number) => void
  /** 注册子项 */
  register: (index: number) => void
  /** 注销子项 */
  unregister: (index: number) => void
}

export const CAROUSEL_REGISTRY_KEY: InjectionKey<CarouselRegistry> = Symbol('dmk-carousel-registry')
