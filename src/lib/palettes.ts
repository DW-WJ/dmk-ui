/**
 * 预设色盘 —— DColorPicker 的默认色盘数据源
 * ---------------------------------------------------------------------------
 * 为什么要有默认色盘：
 *   色盘（predefine）如果默认为空数组，用户打开取色面板看到的是一片空白，
 *   只能靠拖拽取色器盲选 —— 这是「色盘没做」体验的根因。
 *   开箱即用的语义化色盘（品牌 / 中性 / 状态 / 渐变），让用户先选一个
 *   接近的色再微调，而不是从零盲选。
 *
 * 分组口径（与设计系统令牌对齐）：
 *   ① 品牌色   —— 主色及其邻近色，用于主题与强调
 *   ② 中性色阶 —— 文本与背景的灰阶，9 档从深到浅
 *   ③ 状态色   —— 成功 / 警告 / 危险 / 信息，四态统一里的语义色
 *   ④ 浅色系   —— 上述色相的浅色调（用于背景 / 标签底色）
 *
 * 全部来自设计令牌的语义层，不引入新的色值来源。
 */

/** 单个色盘条目 */
export interface ColorSwatch {
  /** 色值（hex） */
  value: string
  /** 中文名（悬停提示 / 无障碍标签） */
  label: string
}

/** 一个色盘分组 */
export interface ColorPalette {
  /** 分组名 */
  name: string
  /** 该组的色板 */
  colors: ColorSwatch[]
}

/** 品牌色 —— 主色系 */
const BRAND: ColorSwatch[] = [
  { value: '#409eff', label: '主蓝' },
  { value: '#3a7afe', label: '亮蓝' },
  { value: '#6c5ce7', label: '紫罗兰' },
  { value: '#00b894', label: '青绿' },
  { value: '#f39c12', label: '琥珀' },
  { value: '#e74c3c', label: '砖红' }
]

/** 中性色阶 —— 9 档灰 */
const NEUTRAL: ColorSwatch[] = [
  { value: '#1f2937', label: '灰 900' },
  { value: '#374151', label: '灰 800' },
  { value: '#4b5563', label: '灰 700' },
  { value: '#6b7280', label: '灰 600' },
  { value: '#9ca3af', label: '灰 500' },
  { value: '#d1d5db', label: '灰 300' },
  { value: '#e5e7eb', label: '灰 200' },
  { value: '#f3f4f6', label: '灰 100' },
  { value: '#f9fafb', label: '灰 50' }
]

/** 状态色 —— 四态统一 */
const STATUS: ColorSwatch[] = [
  { value: '#67c23a', label: '成功' },
  { value: '#e6a23c', label: '警告' },
  { value: '#f56c6c', label: '危险' },
  { value: '#909399', label: '信息' }
]

/** 浅色系 —— 用于背景 / 标签底色 */
const LIGHT: ColorSwatch[] = [
  { value: '#ecf5ff', label: '浅蓝' },
  { value: '#f0e9ff', label: '浅紫' },
  { value: '#e8fff3', label: '浅绿' },
  { value: '#fff7e6', label: '浅橙' },
  { value: '#fef0f0', label: '浅红' },
  { value: '#f4f4f5', label: '浅灰' }
]

/** 完整预设色盘（分组） */
export const DmkColorPalettes: ColorPalette[] = [
  { name: '品牌色', colors: BRAND },
  { name: '中性色阶', colors: NEUTRAL },
  { name: '状态色', colors: STATUS },
  { name: '浅色系', colors: LIGHT }
]

/**
 * 默认预置色（扁平数组）。
 *
 * 组件的 predefine prop 收的是 string[]，所以这里给一份拍平的默认值 ——
 * 顺序：品牌 → 状态 → 中性 → 浅色。品牌与状态优先（用户最常要的是这两类），
 * 中性色阶放后面（挑具体灰阶的需求比挑主色少）。
 */
export const DmkDefaultPredefine: string[] = [
  ...BRAND.map((c) => c.value),
  ...STATUS.map((c) => c.value),
  ...NEUTRAL.map((c) => c.value),
  ...LIGHT.map((c) => c.value)
]

/** 扁平色板 + 中文名的映射（文档页与悬停提示用） */
export const DmkColorLabels: Record<string, string> = Object.fromEntries(
  DmkColorPalettes.flatMap((p) => p.colors.map((c) => [c.value, c.label]))
)
