/**
 * DConfigProvider 的全局配置契约。
 * 放在 lib 里是因为 `<script setup>` 不允许 ES 具名导出，
 * 而业务侧组件需要 inject 同一个 key 来读全局配置。
 */
import type { InjectionKey } from 'vue'

export interface DmkGlobalConfig {
  /** 全局尺寸档 */
  size?: 'sm' | 'md' | 'lg'
  /** 全局初始 z-index */
  zIndex?: number
  /** 全局类名前缀 */
  namespace?: string
  /** 按钮默认配置 */
  button?: Record<string, unknown>
  /** 链接默认配置 */
  link?: Record<string, unknown>
  /** 卡片默认配置 */
  card?: Record<string, unknown>
  /** 消息默认配置 */
  message?: Record<string, unknown>
  /** 表格默认配置 */
  table?: Record<string, unknown>
  /** 实验性特性开关 */
  experimentalFeatures?: Record<string, boolean>
  /** 全局空值集合（多选/表单判定为空的口径） */
  emptyValues?: unknown[]
  /** 清空时回填值 */
  valueOnClear?: string | number | boolean | ((value: unknown) => unknown)
}

export const CONFIG_PROVIDER_KEY: InjectionKey<DmkGlobalConfig> = Symbol('dmk-config-provider')
