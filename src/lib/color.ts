/**
 * 颜色转换内核（纯函数，零依赖）。
 * ---------------------------------------------------------------------------
 * 抽出来的原因：DColorPicker（带触发器）与 DColorPickerPanel（纯面板）
 * 必须共用同一套颜色解析/转换，否则两边的 HEX 解析、透明度、HSL 换算
 * 会出现细微差异 —— 用户在两个组件间切换时会看到颜色跳变。
 *
 * 纯函数 → 可独立测试，不依赖 Vue 运行时。
 */

/** RGBA 颜色 */
export interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

/** 颜色输出格式 */
export type ColorFormat = 'hex' | 'rgb' | 'hsl'

export function parseColor(input: string): Rgba {
  const s = (input ?? '').trim()
  if (!s) return { r: 0, g: 0, b: 0, a: 1 }

  // #rgb / #rrggbb / #rrggbbaa
  if (s.startsWith('#')) {
    const hex = s.slice(1)
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1
      return { r, g, b, a }
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      return { r, g, b, a }
    }
    return { r: 0, g: 0, b: 0, a: 1 }
  }

  // rgb(...) / rgba(...)
  const rgbMatch = s.match(/^rgba?\(([^)]+)\)$/i)
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((p) => p.trim())
    return {
      r: Number(parts[0]) || 0,
      g: Number(parts[1]) || 0,
      b: Number(parts[2]) || 0,
      a: parts[3] !== undefined ? Number(parts[3]) : 1
    }
  }

  // hsl(...) / hsla(...)
  const hslMatch = s.match(/^hsla?\(([^)]+)\)$/i)
  if (hslMatch) {
    const parts = hslMatch[1].split(',').map((p) => p.trim())
    const h = parseFloat(parts[0]) || 0
    const l = parseFloat(parts[1]) || 0
    const sat = parseFloat(parts[2]) || 0
    const a = parts[3] !== undefined ? Number(parts[3]) : 1
    return { ...hslToRgb(h, sat / 100, l / 100), a }
  }

  return { r: 0, g: 0, b: 0, a: 1 }
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0
  let g = 0
  let b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = l - c / 2
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
    else if (max === gn) h = ((bn - rn) / d + 2) * 60
    else h = ((rn - gn) / d + 4) * 60
  }
  return { h, s: s * 100, l: l * 100 }
}

export function toHex(c: Rgba, showAlpha = false): string {
  const h = (n: number) => n.toString(16).padStart(2, '0')
  const base = `#${h(c.r)}${h(c.g)}${h(c.b)}`
  return showAlpha && c.a < 1 ? base + h(Math.round(c.a * 255)) : base
}

export function toRgb(c: Rgba, showAlpha = false): string {
  return showAlpha
    ? `rgba(${c.r}, ${c.g}, ${c.b}, ${Number(c.a.toFixed(2))})`
    : `rgb(${c.r}, ${c.g}, ${c.b})`
}

export function toHsl(c: Rgba, showAlpha = false): string {
  const { h, s, l } = rgbToHsl(c.r, c.g, c.b)
  return showAlpha
    ? `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${Number(c.a.toFixed(2))})`
    : `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

/** 按格式输出颜色 */
export function formatColor(
  c: Rgba,
  colorFormat: ColorFormat,
  showAlpha = false
): string {
  if (colorFormat === 'rgb') return toRgb(c, showAlpha)
  if (colorFormat === 'hsl') return toHsl(c, showAlpha)
  return toHex(c, showAlpha)
}

/** 由 hue + 面板坐标派生 rgb */
export function rgbFromHsv(h: number, x: number, y: number, alpha = 1): Rgba {
  const l = (1 - y) * 100
  const s = x * 100
  const { r, g, b } = hslToRgb(h, s / 100, l / 100)
  return { r, g, b, a: alpha }
}
