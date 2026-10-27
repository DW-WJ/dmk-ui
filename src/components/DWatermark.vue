<script setup lang="ts">
/**
 * DWatermark —— 水印。
 * 契约参考 Element Plus el-watermark：
 *   width / height / rotate / zIndex / image / content（string | string[]）/
 *   font（color / fontSize / fontWeight / fontFamily / fontGap / fontStyle /
 *        textAlign / textBaseline）/ gap（[number, number]）/
 *   offset（[number, number]）
 *   Slots: default（承载水印的容器）
 *
 * 实现：用 SVG data-uri 平铺背景（与 EP 同思路）——
 *      文字水印把每行文字渲染进 SVG <text>；图片水印用 <image>。
 *      容器 position:relative，水印层 absolute 铺满，pointer-events:none 不挡交互。
 */
import { computed } from 'vue'

interface WatermarkFont {
  color?: string
  fontSize?: number | string
  fontWeight?: string | number
  fontFamily?: string
  fontGap?: number
  fontStyle?: string
  textAlign?: 'left' | 'center' | 'right'
  textBaseline?: 'top' | 'middle' | 'bottom' | 'hanging'
}

const props = withDefaults(
  defineProps<{
    width?: number
    height?: number
    rotate?: number
    zIndex?: number
    image?: string
    content?: string | string[]
    font?: WatermarkFont
    gap?: [number, number]
    offset?: [number, number]
  }>(),
  {
    width: 120,
    height: 64,
    rotate: -22,
    zIndex: 9,
    image: undefined,
    content: '',
    font: () => ({}),
    gap: () => [100, 100],
    offset: undefined
  }
)

/** 默认字体样式（对齐 EP：rgba(0,0,0,.15) / 16px / sans-serif） */
const fontStyle = computed<Required<Pick<WatermarkFont, 'color' | 'fontSize' | 'fontWeight' | 'fontFamily' | 'fontGap' | 'fontStyle' | 'textAlign' | 'textBaseline'>>>(() => ({
  color: props.font.color ?? 'rgba(0,0,0,.15)',
  fontSize: props.font.fontSize ?? 16,
  fontWeight: props.font.fontWeight ?? 'normal',
  fontFamily: props.font.fontFamily ?? 'sans-serif',
  fontGap: props.font.fontGap ?? 3,
  fontStyle: props.font.fontStyle ?? 'normal',
  textAlign: props.font.textAlign ?? 'center',
  textBaseline: props.font.textBaseline ?? 'hanging'
}))

/** 内容行数组 */
const lines = computed<string[]>(() => {
  if (Array.isArray(props.content)) return props.content.filter((l) => l !== undefined && l !== null)
  if (props.content) return [props.content]
  return []
})

/** 单行文字的 SVG <text> 片段 */
function textLineSvg(line: string, index: number): string {
  const f = fontStyle.value
  const x = f.textAlign === 'left' ? 0 : f.textAlign === 'right' ? props.width : props.width / 2
  const y = 10 + index * (Number(f.fontSize) + f.fontGap)
  const anchor = f.textAlign === 'left' ? 'start' : f.textAlign === 'right' ? 'end' : 'middle'
  const escaped = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return `<text x="${x}" y="${y}" fill="${f.color}" font-size="${f.fontSize}" font-weight="${f.fontWeight}" font-family="${f.fontFamily}" font-style="${f.fontStyle}" text-anchor="${anchor}" dominant-baseline="${f.textBaseline}">${escaped}</text>`
}

/** 生成水印 SVG（data-uri） */
const watermarkUrl = computed(() => {
  const w = props.width
  const h = props.height

  let inner = ''
  if (props.image) {
    inner = `<image href="${props.image}" width="${w}" height="${h}" />`
  } else if (lines.value.length) {
    inner = lines.value.map((l, i) => textLineSvg(l, i)).join('')
  } else {
    return ''
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g transform="rotate(${props.rotate} ${w / 2} ${h / 2})">${inner}</g></svg>`
  return `url("data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}")`
})

/** 背景平铺样式 */
const bgStyle = computed(() => {
  const [gx, gy] = props.gap
  const [ox, oy] = props.offset ?? [gx / 2, gy / 2]
  return {
    backgroundImage: watermarkUrl.value,
    backgroundRepeat: 'repeat',
    backgroundPosition: `${ox}px ${oy}px`,
    backgroundSize: `${props.width}px ${props.height}px`
  }
})

const hasWatermark = computed(() => !!props.image || lines.value.length > 0)
</script>

<template>
  <div class="dmk-watermark">
    <slot />
    <div
      v-if="hasWatermark"
      class="dmk-watermark__layer"
      :style="{ ...bgStyle, zIndex: zIndex }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.dmk-watermark {
  position: relative;
}

.dmk-watermark__layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  user-select: none;
}
</style>
