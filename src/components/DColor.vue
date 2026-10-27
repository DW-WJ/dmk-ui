<script setup lang="ts">
/**
 * DColor —— 色板展示。
 * 对应 Element Plus「Color 色彩」规范页：品牌色 / 场景色 / 中性色三组色板。
 * 组件渲染一枚色块 + 名称 + 色值，点击色块复制色值。
 *
 * Attributes:
 *   color（色值）/ name（色名）/ size（sm|md|lg）/
 *   showValue（是否显示色值）/ copyable（点击是否复制）
 */
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    color: string
    name?: string
    size?: 'sm' | 'md' | 'lg'
    showValue?: boolean
    copyable?: boolean
  }>(),
  {
    name: '',
    size: 'md',
    showValue: true,
    copyable: true
  }
)

const emit = defineEmits<{
  copy: [color: string]
}>()

const copied = ref(false)
let timer: number | undefined

async function onCopy() {
  if (!props.copyable) return
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.color)
    }
    copied.value = true
    emit('copy', props.color)
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      copied.value = false
    }, 1200)
  } catch {
    // 剪贴板不可用（非安全上下文等）时不报错，静默降级
  }
}
</script>

<template>
  <div class="dmk-color" :class="[`dmk-color--${size}`, { 'is-copyable': copyable }]">
    <button
      type="button"
      class="dmk-color__swatch"
      :style="{ background: color }"
      :disabled="!copyable"
      :aria-label="`${name || '颜色'} ${color}${copyable ? '，点击复制' : ''}`"
      @click="onCopy"
    >
      <span v-if="copied" class="dmk-color__check" aria-hidden="true">✓</span>
    </button>
    <div class="dmk-color__meta">
      <span v-if="name" class="dmk-color__name">{{ name }}</span>
      <span v-if="showValue" class="dmk-color__value">{{ color }}</span>
    </div>
  </div>
</template>

<style scoped>
.dmk-color {
  display: inline-flex;
  align-items: center;
  gap: var(--dmk-space-sm);
  font-family: var(--dmk-font-family);
}

.dmk-color__swatch {
  position: relative;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-color--sm .dmk-color__swatch {
  width: 20px;
  height: 20px;
  border-radius: var(--dmk-radius-sm);
}

.dmk-color--lg .dmk-color__swatch {
  width: 44px;
  height: 44px;
}

.dmk-color.is-copyable .dmk-color__swatch:hover {
  transform: scale(1.06);
}

.dmk-color__swatch:disabled {
  cursor: default;
}

.dmk-color__swatch:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-color__check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.dmk-color__meta {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.dmk-color__name {
  font-size: var(--dmk-font-base);
  color: var(--dmk-color-text);
}

.dmk-color__value {
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
