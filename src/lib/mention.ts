/**
 * DMention（@提及）的公共类型。
 * 放 lib 的原因：`<script setup>` 不允许 ES 具名导出，业务侧需要复用这些类型。
 */

/** 提及项 */
export interface MentionOption {
  /** 选项值（默认取 label） */
  value?: string
  /** 显示文本 */
  label?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 其它自定义字段 */
  [key: string]: unknown
}

/** 字段映射：把业务数据结构映射到 value / label / disabled */
export interface MentionProps {
  /** 值字段名 */
  value: string
  /** 文本字段名 */
  label: string
  /** 禁用字段名 */
  disabled: string
}
