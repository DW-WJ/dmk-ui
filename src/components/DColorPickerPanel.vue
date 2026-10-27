<script setup lang="ts">
/**
 * DColorPickerPanel —— 取色面板（纯面板，无触发器）。
 * 契约参考 Element Plus el-color-picker 的 panel 变体：
 *   modelValue / showAlpha / colorFormat / predefine / showPredefine / validateEvent
 *   Events: change / active-change
 *
 * 与 DColorPicker 的关系：两者共用 lib/color.ts 的颜色内核，
 * 保证「触发器里选的色」与「面板里选的色」转换结果完全一致。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  formatColor,
  hslToRgb,
  parseColor,
  rgbToHsl,
  type ColorFormat,
  type Rgba
} from '../lib/color'

const props = withDefaults(
  defineProps<{
    /** 绑定色值 */
    modelValue?: string
    /** 是否显示透明度通道 */
    showAlpha?: boolean
    /** 色值输出格式 */
    colorFormat?: ColorFormat
    /** 预置颜色 */
    predefine?: string[]
    /** 是否展示预置色区 */
    showPredefine?: boolean
  }>(),
  {
    modelValue: '',
    showAlpha: false,
    colorFormat: 'hex',
    predefine: () => [],
    showPredefine: true
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  'active-change': [value: string]
}>()

/** 当前颜色（RGBA） */
const rgba = ref<Rgba>(parseColor(props.modelValue))
/** 拖动中的临时颜色 */
const draft = ref<Rgba>({ ...rgba.value })
/** 色相 0-360 */
const hue = ref(0)
/** 面板坐标（0-1） */
const sat = ref(0)
const val = ref(1)

/** 由 rgba 派生面板坐标与色相 */
function syncFromRgba(c: Rgba) {
  const { h, s, l } = rgbToHsl(c.r, c.g, c.b)
  hue.value = h
  sat.value = s / 100
  val.value = 1 - l / 100
}

/** 由 hue + 面板坐标派生 rgb */
function syncFromPanel() {
  const { r, g, b } = hslToRgb(hue.value, sat.value, val.value)
  draft.value = { r, g, b, a: draft.value.a }
}

watch(
  () => props.modelValue,
  (v) => {
    const c = parseColor(v)
    rgba.value = c
    draft.value = { ...c }
    syncFromRgba(c)
  }
)

/** 输出文本 */
const text = computed(() => formatColor(draft.value, props.colorFormat, props.showAlpha))

/** 色块背景 */
const swatchStyle = computed(() => ({
  background: formatColor(draft.value, 'rgb', props.showAlpha)
}))

/** 面板背景：横向饱和度渐变 + 纵向明度渐变 */
const panelStyle = computed(() => ({
  background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue.value}, 100%, 50%))`
}))

/** 色相条背景 */
const hueStyle = computed(() => ({
  background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)'
}))

/** 指示点位置 */
const pointerStyle = computed(() => ({
  left: `${sat.value * 100}%`,
  top: `${(1 - val.value) * 100}%`
}))

const huePointerStyle = computed(() => ({
  left: `${(hue.value / 360) * 100}%`
}))

const alphaPointerStyle = computed(() => ({
  left: `${draft.value.a * 100}%`
}))

/** 从元素坐标换算 0-1 比例 */
function ratio(e: MouseEvent, el: HTMLElement | null): { x: number; y: number } {
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  return {
    x: Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1),
    y: Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1)
  }
}

/** 面板拖动 */
function onPanelDown(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const r = ratio(e, el)
  sat.value = r.x
  val.value = 1 - r.y
  syncFromPanel()
  emitActive()
  window.addEventListener('mousemove', onPanelMove)
  window.addEventListener('mouseup', onPanelUp)
}

function onPanelMove(e: MouseEvent) {
  const el = document.querySelector('.dmk-cp-panel__area') as HTMLElement | null
  const r = ratio(e, el)
  sat.value = r.x
  val.value = 1 - r.y
  syncFromPanel()
  emitActive()
}

function onPanelUp() {
  window.removeEventListener('mousemove', onPanelMove)
  window.removeEventListener('mouseup', onPanelUp)
}

/** 色相拖动 */
function onHueDown(e: MouseEvent) {
  moveHue(e)
  window.addEventListener('mousemove', moveHue)
  window.addEventListener('mouseup', onHueUp)
}

function moveHue(e: MouseEvent) {
  const el = document.querySelector('.dmk-cp-panel__hue') as HTMLElement | null
  const r = ratio(e, el)
  hue.value = Math.round(r.x * 360)
  syncFromPanel()
  emitActive()
}

function onHueUp() {
  window.removeEventListener('mousemove', moveHue)
  window.removeEventListener('mouseup', onHueUp)
}

/** 透明度拖动 */
function onAlphaDown(e: MouseEvent) {
  moveAlpha(e)
  window.addEventListener('mousemove', moveAlpha)
  window.addEventListener('mouseup', onAlphaUp)
}

function moveAlpha(e: MouseEvent) {
  const el = document.querySelector('.dmk-cp-panel__alpha') as HTMLElement | null
  const r = ratio(e, el)
  draft.value = { ...draft.value, a: Number(r.x.toFixed(2)) }
  emitActive()
}

function onAlphaUp() {
  window.removeEventListener('mousemove', moveAlpha)
  window.removeEventListener('mouseup', onAlphaUp)
}

/** 拖动中实时上报 */
function emitActive() {
  emit('active-change', formatColor(draft.value, props.colorFormat, props.showAlpha))
}

/** 提交 */
function commit(c?: string) {
  if (c !== undefined) {
    const parsed = parseColor(c)
    draft.value = { ...parsed }
    syncFromRgba(parsed)
  }
  const out = formatColor(draft.value, props.colorFormat, props.showAlpha)
  rgba.value = { ...draft.value }
  emit('update:modelValue', out)
  emit('change', out)
}

/** 选预置色 */
function pickPredefine(c: string) {
  commit(c)
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPanelMove)
  window.removeEventListener('mouseup', onPanelUp)
  window.removeEventListener('mousemove', moveHue)
  window.removeEventListener('mouseup', onHueUp)
  window.removeEventListener('mousemove', moveAlpha)
  window.removeEventListener('mouseup', onAlphaUp)
})
</script>

<template>
  <div class="dmk-cp-panel">
    <!-- 饱和度 / 明度面板 -->
    <div class="dmk-cp-panel__area" :style="panelStyle" @mousedown="onPanelDown">
      <span class="dmk-cp-panel__pointer" :style="pointerStyle" />
    </div>

    <!-- 色相条 -->
    <div class="dmk-cp-panel__hue" :style="hueStyle" @mousedown="onHueDown">
      <span class="dmk-cp-panel__pointer-hue" :style="huePointerStyle" />
    </div>

    <!-- 透明度条 -->
    <div v-if="showAlpha" class="dmk-cp-panel__alpha" @mousedown="onAlphaDown">
      <span class="dmk-cp-panel__pointer-alpha" :style="alphaPointerStyle" />
    </div>

    <!-- 当前色 + 文本 -->
    <div class="dmk-cp-panel__row">
      <span class="dmk-cp-panel__swatch" :style="swatchStyle" />
      <input
        class="dmk-cp-panel__input"
        :value="text"
        aria-label="颜色值"
        @change="commit(($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- 预置色 -->
    <div v-if="showPredefine && predefine.length" class="dmk-cp-panel__predefine">
      <button
        v-for="c in predefine"
        :key="c"
        type="button"
        class="dmk-cp-panel__predefine-item"
        :style="{ background: c }"
        :aria-label="`选择 ${c}`"
        @click="pickPredefine(c)"
      />
    </div>
  </div>
</template>

<style scoped>
.dmk-cp-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 240px;
  padding: 10px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  font-family: var(--dmk-font-family);
}

.dmk-cp-panel__area {
  position: relative;
  height: 160px;
  border-radius: var(--dmk-radius-md);
  cursor: pointer;
}

.dmk-cp-panel__pointer {
  position: absolute;
  width: 12px;
  height: 12px;
  transform: translate(-50%, -50%);
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 2px rgb(0 0 0 / 50%);
  pointer-events: none;
}

.dmk-cp-panel__hue {
  position: relative;
  height: 10px;
  border-radius: 5px;
  cursor: pointer;
}

.dmk-cp-panel__pointer-hue,
.dmk-cp-panel__pointer-alpha {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  transform: translate(-50%, -50%);
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 2px rgb(0 0 0 / 50%);
  pointer-events: none;
}

.dmk-cp-panel__alpha {
  position: relative;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(to right, transparent, #000);
  cursor: pointer;
}

.dmk-cp-panel__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dmk-cp-panel__swatch {
  width: 24px;
  height: 24px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
}

.dmk-cp-panel__input {
  flex: 1;
  box-sizing: border-box;
  height: 26px;
  padding: 3px 8px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text);
  font-family: inherit;
  font-size: 12px;
}

.dmk-cp-panel__predefine {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dmk-cp-panel__predefine-item {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  cursor: pointer;
}
</style>
