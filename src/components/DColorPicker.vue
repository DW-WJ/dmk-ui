<script setup lang="ts">
/**
 * DColorPicker —— 取色器。
 * 契约参考 Element Plus el-color-picker：
 *   modelValue（v-model）/ disabled / clearable / size / showAlpha /
 *   colorFormat（hex | rgb | hsl）/ predefine（预置色）/ popperClass /
 *   validateEvent / tabindex / ariaLabel / id
 *   Events: change / active-change / focus / blur / clear
 *   Exposes: color / show / hide / focus / blur
 *
 * 实现：点击色块展开面板 —— 饱和度/明度面板 + 色相条 + Alpha 条（可选）+
 *      预置色 + HEX/RGB 输入。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type ColorFormat = 'hex' | 'rgb' | 'hsl'

interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    disabled?: boolean
    clearable?: boolean
    size?: 'large' | 'default' | 'small'
    showAlpha?: boolean
    colorFormat?: ColorFormat
    predefine?: string[]
    popperClass?: string
    validateEvent?: boolean
    tabindex?: number | string
    ariaLabel?: string
    id?: string
  }>(),
  {
    modelValue: '',
    disabled: false,
    clearable: true,
    size: 'default',
    showAlpha: false,
    colorFormat: 'hex',
    predefine: () => [],
    popperClass: undefined,
    validateEvent: true,
    tabindex: 0,
    ariaLabel: '取色器',
    id: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  'active-change': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  clear: []
}>()

/* ---------------- 颜色解析 ---------------- */

function parseColor(input: string): Rgba {
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

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
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

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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

function toHex(c: Rgba): string {
  const h = (n: number) => n.toString(16).padStart(2, '0')
  const base = `#${h(c.r)}${h(c.g)}${h(c.b)}`
  return props.showAlpha && c.a < 1 ? base + h(Math.round(c.a * 255)) : base
}

function toRgb(c: Rgba): string {
  return props.showAlpha
    ? `rgba(${c.r}, ${c.g}, ${c.b}, ${Number(c.a.toFixed(2))})`
    : `rgb(${c.r}, ${c.g}, ${c.b})`
}

function toHsl(c: Rgba): string {
  const { h, s, l } = rgbToHsl(c.r, c.g, c.b)
  return props.showAlpha
    ? `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${Number(c.a.toFixed(2))})`
    : `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

function format(c: Rgba): string {
  if (props.colorFormat === 'rgb') return toRgb(c)
  if (props.colorFormat === 'hsl') return toHsl(c)
  return toHex(c)
}

/* ---------------- 状态 ---------------- */

const visible = ref(false)
const rootRef = ref<HTMLElement | null>(null)

/** 当前颜色（RGBA） */
const rgba = ref<Rgba>(parseColor(props.modelValue))
/** 拖动中的临时颜色 */
const draft = ref<Rgba>(parseColor(props.modelValue))
/** 色相 0-360 */
const hue = ref(0)
/** 饱和度 0-100 / 明度 0-100（面板坐标） */
const sat = ref(0)
/** 面板坐标（0-1） */
const panelX = ref(0)
const panelY = ref(0)

/** 由 rgba 派生 hsl 与面板坐标 */
function syncFromRgba(c: Rgba) {
  const { h, s, l } = rgbToHsl(c.r, c.g, c.b)
  hue.value = h
  sat.value = s
  // 面板坐标：x = s/100，y = 1 - l/100
  panelX.value = Math.min(1, Math.max(0, s / 100))
  panelY.value = Math.min(1, Math.max(0, 1 - l / 100))
}

/** 由 hue + 面板坐标派生 rgb */
function rgbFromHsv(h: number, x: number, y: number): Rgba {
  const l = (1 - y) * 100
  const s = x * 100
  const { r, g, b } = hslToRgb(h, s / 100, l / 100)
  return { r, g, b, a: draft.value.a }
}

syncFromRgba(rgba.value)
draft.value = { ...rgba.value }

watch(
  () => props.modelValue,
  (v) => {
    const c = parseColor(v)
    rgba.value = c
    draft.value = { ...c }
    syncFromRgba(c)
  }
)

/* ---------------- 面板交互 ---------------- */

const panelRef = ref<HTMLElement | null>(null)
const hueRef = ref<HTMLElement | null>(null)
const alphaRef = ref<HTMLElement | null>(null)

/** 从元素坐标换算 0-1 比例 */
function ratio(e: MouseEvent, el: HTMLElement | null): { x: number; y: number } {
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  const x = rect.width ? Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) : 0
  const y = rect.height ? Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)) : 0
  return { x, y }
}

function onPanelDown(e: MouseEvent) {
  const { x, y } = ratio(e, panelRef.value)
  panelX.value = x
  panelY.value = y
  draft.value = { ...rgbFromHsv(hue.value, x, y), a: draft.value.a }
  emitActive()
  window.addEventListener('mousemove', onPanelMove)
  window.addEventListener('mouseup', onPanelUp)
}

function onPanelMove(e: MouseEvent) {
  const { x, y } = ratio(e, panelRef.value)
  panelX.value = x
  panelY.value = y
  draft.value = { ...rgbFromHsv(hue.value, x, y), a: draft.value.a }
  emitActive()
}

function onPanelUp() {
  window.removeEventListener('mousemove', onPanelMove)
  window.removeEventListener('mouseup', onPanelUp)
}

function onHueDown(e: MouseEvent) {
  moveHue(e)
  window.addEventListener('mousemove', moveHue)
  window.addEventListener('mouseup', onHueUp)
}

function moveHue(e: MouseEvent) {
  const { y } = ratio(e, hueRef.value)
  hue.value = y * 360
  draft.value = { ...rgbFromHsv(hue.value, panelX.value, panelY.value), a: draft.value.a }
  emitActive()
}

function onHueUp() {
  window.removeEventListener('mousemove', moveHue)
  window.removeEventListener('mouseup', onHueUp)
}

function onAlphaDown(e: MouseEvent) {
  moveAlpha(e)
  window.addEventListener('mousemove', moveAlpha)
  window.addEventListener('mouseup', onAlphaUp)
}

function moveAlpha(e: MouseEvent) {
  const { x } = ratio(e, alphaRef.value)
  draft.value = { ...draft.value, a: x }
  emitActive()
}

function onAlphaUp() {
  window.removeEventListener('mousemove', moveAlpha)
  window.removeEventListener('mouseup', onAlphaUp)
}

function emitActive() {
  emit('active-change', format(draft.value))
}

/** 输入框文本（HEX 手动输入） */
const hexInput = ref(toHex(rgba.value))
watch(
  () => draft.value,
  (c) => {
    hexInput.value = toHex(c)
  },
  { deep: true }
)

function onHexInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  hexInput.value = v
  if (/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v.trim())) {
    draft.value = parseColor(v.startsWith('#') ? v : `#${v}`)
    syncFromRgba(draft.value)
    emitActive()
  }
}

function onDocClick(e: MouseEvent) {
  if (!visible.value) return
  const target = e.target as Node
  if (rootRef.value && !rootRef.value.contains(target)) {
    commit()
    closePanel()
  }
}

watch(visible, (v) => {
  if (v) document.addEventListener('mousedown', onDocClick)
  else document.removeEventListener('mousedown', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  window.removeEventListener('mousemove', onPanelMove)
  window.removeEventListener('mouseup', onPanelUp)
  window.removeEventListener('mousemove', moveHue)
  window.removeEventListener('mouseup', onHueUp)
  window.removeEventListener('mousemove', moveAlpha)
  window.removeEventListener('mouseup', onAlphaUp)
})

function openPanel() {
  if (props.disabled) return
  visible.value = true
  draft.value = { ...rgba.value }
  syncFromRgba(rgba.value)
}

function closePanel() {
  visible.value = false
}

/** 确认：把草稿写回 v-model */
function commit() {
  const str = format(draft.value)
  rgba.value = { ...draft.value }
  emit('update:modelValue', str)
  emit('change', str)
}

function clearValue() {
  emit('update:modelValue', '')
  emit('clear')
  emit('change', '')
}

function pickPredefine(c: string) {
  draft.value = parseColor(c)
  syncFromRgba(draft.value)
  commit()
}

/** 色块背景（渐变模拟当前色） */
const swatchStyle = computed(() => {
  if (!props.modelValue) return { background: 'var(--dmk-color-surface-hover)' }
  return { background: props.modelValue }
})

/** 面板背景：横向饱和度渐变 + 纵向明度渐变 */
const panelBg = computed(() => {
  const pure = hslToRgb(hue.value, 1, 0.5)
  const hex = toHex({ ...pure, a: 1 })
  return `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hex})`
})

/** 色相条背景 */
const hueBg = computed(
  () =>
    'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
)

defineExpose({
  color: computed(() => format(rgba.value)),
  show: openPanel,
  hide: closePanel,
  focus: () => rootRef.value?.querySelector<HTMLElement>('.dmk-color-picker__trigger')?.focus(),
  blur: () => rootRef.value?.querySelector<HTMLElement>('.dmk-color-picker__trigger')?.blur()
})
</script>

<template>
  <div ref="rootRef" class="dmk-color-picker" :class="[`dmk-color-picker--${size}`, { 'is-disabled': disabled }]">
    <button
      type="button"
      class="dmk-color-picker__trigger"
      :id="id"
      :disabled="disabled"
      :tabindex="tabindex"
      :aria-label="ariaLabel"
      aria-haspopup="dialog"
      :aria-expanded="visible"
      @click="visible ? closePanel() : openPanel()"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    >
      <span class="dmk-color-picker__swatch" :style="swatchStyle" />
      <span class="dmk-color-picker__value">{{ modelValue || '选择颜色' }}</span>
      <span
        v-if="clearable && modelValue"
        class="dmk-color-picker__clear"
        role="button"
        aria-label="清空"
        @click.stop="clearValue"
        >×</span
      >
    </button>

    <div v-if="visible" class="dmk-color-picker__panel" :class="popperClass" role="dialog" aria-label="取色面板">
      <div ref="panelRef" class="dmk-color-picker__panel-bg" :style="{ background: panelBg }" @mousedown="onPanelDown">
        <span
          class="dmk-color-picker__cursor"
          :style="{ left: `${panelX * 100}%`, top: `${panelY * 100}%` }"
        />
      </div>

      <div class="dmk-color-picker__bars">
        <div ref="hueRef" class="dmk-color-picker__bar" :style="{ background: hueBg }" @mousedown="onHueDown">
          <span class="dmk-color-picker__bar-cursor" :style="{ top: `${(hue / 360) * 100}%` }" />
        </div>
        <div
          v-if="showAlpha"
          ref="alphaRef"
          class="dmk-color-picker__bar is-alpha"
          @mousedown="onAlphaDown"
        >
          <span class="dmk-color-picker__bar-cursor" :style="{ left: `${draft.a * 100}%` }" />
        </div>
      </div>

      <div class="dmk-color-picker__input">
        <input
          class="dmk-color-picker__hex"
          type="text"
          :value="hexInput"
          aria-label="HEX 色值"
          @input="onHexInput"
          @change="commit"
        />
        <span class="dmk-color-picker__format">{{ colorFormat.toUpperCase() }}</span>
      </div>

      <div v-if="predefine.length" class="dmk-color-picker__predefine">
        <button
          v-for="c in predefine"
          :key="c"
          type="button"
          class="dmk-color-picker__pre"
          :style="{ background: c }"
          :aria-label="`选择颜色 ${c}`"
          @click="pickPredefine(c)"
        />
      </div>

      <div class="dmk-color-picker__footer">
        <button type="button" class="dmk-color-picker__btn" @click="closePanel">取消</button>
        <button type="button" class="dmk-color-picker__btn is-primary" @click="commit">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dmk-color-picker {
  position: relative;
  display: inline-block;
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
}

.dmk-color-picker__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: var(--dmk-control-height);
  padding: 0 var(--dmk-control-padding-x);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-secondary);
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
}

.dmk-color-picker__trigger:focus-visible {
  outline: none;
  border-color: var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-color-picker.is-disabled .dmk-color-picker__trigger {
  cursor: not-allowed;
  opacity: 0.7;
}

.dmk-color-picker__swatch {
  width: 18px;
  height: 18px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  flex: 0 0 auto;
}

.dmk-color-picker__value {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: left;
}

.dmk-color-picker__clear {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--dmk-color-text-muted);
  color: var(--dmk-color-surface);
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  cursor: pointer;
}

.dmk-color-picker__panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: var(--dmk-z-popup);
  width: 240px;
  padding: 12px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
}

.dmk-color-picker__panel-bg {
  position: relative;
  height: 160px;
  border-radius: var(--dmk-radius-md);
  cursor: crosshair;
}

.dmk-color-picker__cursor {
  position: absolute;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.dmk-color-picker__bars {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.dmk-color-picker__bar {
  position: relative;
  width: 14px;
  height: 160px;
  border-radius: 7px;
  cursor: pointer;
}

.dmk-color-picker__bar.is-alpha {
  background: linear-gradient(to right, rgba(255, 255, 255, 0), #000);
  border: 1px solid var(--dmk-color-border);
}

.dmk-color-picker__bar-cursor {
  position: absolute;
  width: 100%;
  height: 4px;
  margin-top: -2px;
  border-radius: 2px;
  background: #fff;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.dmk-color-picker__bar.is-alpha .dmk-color-picker__bar-cursor {
  width: 4px;
  height: 100%;
  margin: 0 0 0 -2px;
}

.dmk-color-picker__input {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.dmk-color-picker__hex {
  flex: 1 1 auto;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  outline: none;
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
}

.dmk-color-picker__hex:focus {
  border-color: var(--dmk-color-primary);
}

.dmk-color-picker__format {
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--dmk-color-text-muted);
  text-transform: uppercase;
}

.dmk-color-picker__predefine {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.dmk-color-picker__pre {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  cursor: pointer;
}

.dmk-color-picker__pre:hover {
  transform: scale(1.12);
}

.dmk-color-picker__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.dmk-color-picker__btn {
  min-height: 28px;
  padding: 0 14px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-secondary);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}

.dmk-color-picker__btn.is-primary {
  background: var(--dmk-color-primary);
  border-color: var(--dmk-color-primary);
  color: var(--dmk-color-on-primary);
}
</style>
