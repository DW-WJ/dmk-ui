/**
 * date.ts —— 日期/时间内核（纯 TS，零运行时依赖）。
 * ---------------------------------------------------------------------------
 * 服务 DDatePicker / DTimePicker / DTimeSelect 三个组件。
 * 设计约束（与库内其它内核一致）：
 *   ① 不引 day.js / moment —— 格式化只支持本库自己认的那几个 token；
 *   ② 纯函数、无全局状态，单元可断言；
 *   ③ 时区跟随宿主（用本地时间算，不做 UTC 偏移）。
 *
 * 支持的格式化 token（大小写敏感，同 Element Plus / day.js 习惯）：
 *   YYYY 四位年 · MM 两位月 · DD 两位日
 *   HH 两位时 · mm 两位分 · ss 两位秒
 *   另外特殊值 'x' 输出 Unix 时间戳字符串（Element Plus 同款）。
 */

export type DatePickerType =
  | 'date'
  | 'dates'
  | 'week'
  | 'month'
  | 'year'
  | 'daterange'
  | 'monthrange'

export interface DateShortcut {
  text: string
  /** 相对今天的天数偏移；负数表示过去。返回该天的 00:00:00 */
  value: () => Date
}

export interface DateRange {
  start: Date | null
  end: Date | null
}

/* ------------------------------------------------------------------ 基础取整 */

export function startOfDay(d: Date): Date {
  const x = new Date(d.getTime())
  x.setHours(0, 0, 0, 0)
  return x
}

export function startOfMonth(d: Date): Date {
  const x = startOfDay(d)
  x.setDate(1)
  return x
}

export function startOfYear(d: Date): Date {
  const x = startOfDay(d)
  x.setMonth(0, 1)
  return x
}

/** 周一为一周之首（与 Element Plus / 国内习惯一致） */
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getTime())
  x.setDate(x.getDate() + n)
  return x
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d.getTime())
  // 先钉到 1 号再偏移，避免「1月31日 +1月」溢出到 3 月
  const day = x.getDate()
  x.setDate(1)
  x.setMonth(x.getMonth() + n)
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()
  x.setDate(Math.min(day, last))
  return x
}

export function addYears(d: Date, n: number): Date {
  const x = new Date(d.getTime())
  const day = x.getDate()
  x.setDate(1)
  x.setFullYear(x.getFullYear() + n)
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()
  x.setDate(Math.min(day, last))
  return x
}

/* ------------------------------------------------------------------ 比较 */

/** 同一天（忽略时分秒） */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function isSameYear(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
}

/** b - a 的天数差（按自然日算，忽略时分秒） */
export function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000)
}

/** d 是否落在 [start, end] 闭区间内（任一为空视为不在范围内） */
export function inRange(d: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false
  const t = startOfDay(d).getTime()
  return t >= startOfDay(start).getTime() && t <= startOfDay(end).getTime()
}

/* ------------------------------------------------------------------ 日历矩阵 */

/**
 * 生成月视图矩阵：固定 6 行 × 7 列（周一为首列），含上下月补白。
 * 返回二维数组，每项是那一天的 Date（时分秒已归零）。
 */
export function buildMonthMatrix(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7
  const start = addDays(first, -lead)
  const rows: Date[][] = []
  for (let r = 0; r < 6; r += 1) {
    const row: Date[] = []
    for (let c = 0; c < 7; c += 1) row.push(startOfDay(addDays(start, r * 7 + c)))
    rows.push(row)
  }
  return rows
}

/** 某月的天数 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/* ------------------------------------------------------------------ 格式化 */

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * 按 token 格式化日期。未知 token 原样保留。
 * 'x' 特殊处理：输出 Unix 时间戳（秒）字符串。
 */
export function formatDate(d: Date, pattern = 'YYYY-MM-DD'): string {
  if (pattern === 'x') return String(Math.floor(d.getTime() / 1000))
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds())
  }
  return pattern.replace(/YYYY|MM|DD|HH|mm|ss/g, (t) => map[t] ?? t)
}

/** 把绑定值（Date | string | number | null）解析成 Date；解析不了返回 null */
export function parseDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  if (typeof v === 'number') {
    // 10 位当秒、13 位当毫秒
    const ms = v < 1e11 ? v * 1000 : v
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof v === 'string') {
    // 纯数字串当时间戳
    if (/^\d+$/.test(v)) return parseDate(Number(v))
    const d = new Date(v.replace(/-/g, '/'))
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

/**
 * 按 value-format 把 Date 转成绑定值；未指定 value-format 时返回 Date 本身。
 * 传 'x' 输出时间戳字符串。
 */
export function applyValueFormat(d: Date | null, valueFormat?: string): unknown {
  if (!d) return null
  if (!valueFormat) return d
  return formatDate(d, valueFormat)
}

/** 解析绑定值：先按 value-format 解析字符串，再退回通用解析 */
export function resolveValue(v: unknown, valueFormat?: string): Date | null {
  if (v instanceof Date) return v
  if (typeof v === 'string' && valueFormat && valueFormat !== 'x') {
    // 把 YYYY-MM-DD 这类串拆开手工解析，避免 Safari 对 '-' 的解析差异
    const m = v.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/)
    if (m) {
      return new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        Number(m[4] ?? 0),
        Number(m[5] ?? 0),
        Number(m[6] ?? 0)
      )
    }
  }
  return parseDate(v)
}

/* ------------------------------------------------------------------ 时间工具 */

export function padTime(n: number): string {
  return pad(n)
}

/** 生成 [start, end] 之间的步进时间选项（秒为单位） */
export function buildTimeOptions(
  startHour: number,
  endHour: number,
  stepMinutes: number
): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  const endMinutes = endHour * 60
  const beginMinutes = startHour * 60
  for (let m = beginMinutes; m <= endMinutes; m += stepMinutes) {
    const h = Math.floor(m / 60)
    const mm = m % 60
    const value = `${pad(h)}:${pad(mm)}`
    out.push({ value, label: value })
  }
  return out
}

/** HH:mm:ss → 当天 Date（以 today 为基准） */
export function timeToDate(time: string, base?: Date): Date {
  const d = base ? new Date(base.getTime()) : new Date()
  const [h, m, s] = time.split(':').map((x) => Number(x))
  d.setHours(h || 0, m || 0, s || 0, 0)
  return d
}
