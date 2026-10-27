/**
 * select.ts —— 选择器公共类型（单独成文件，便于对外导出）。
 * ---------------------------------------------------------------------------
 * 为什么单独放：写在 DSelect.vue 的 <script setup> 里无法通过 index.ts 对外 re-export
 * （script setup 的类型不对外暴露），而业务侧常要声明自己的选项数组 —— 库必须把类型给出去，
 * 否则各项目各写一份同名 interface，结构漂移就会报「两个同名类型不兼容」。
 */

export type SelectPrimitive = string | number | boolean

/**
 * 选项值类型：基础标量或对象。
 * 对象场景必须配合 valueKey 指定唯一标识字段（EP 同款），
 * 用 Record<string, unknown> 而非 object —— 这样业务侧用 type 定义的类型可直接赋��。
 */
export type SelectValue = SelectPrimitive | Record<string, unknown>

export interface SelectOption {
  label: string
  value: SelectValue
  disabled?: boolean
  /** 对象型 value 时，用 valueKey 指定的字段做唯一标识 */
  [key: string]: unknown
}
