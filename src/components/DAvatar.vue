<script setup lang="ts">
/**
 * DAvatar —— 头像。
 * 设计要点：图片加载失败时降级到 error 插槽 / 图标 / 首字母；
 * fit 控制图片裁切方式（cover 裁切 / contain 完整 / fill 拉伸）。
 */
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
    srcSet?: string
    alt?: string
    /** 尺寸：预设名或数字（px） */
    size?: 'large' | 'default' | 'small' | number
    /** 形状 */
    shape?: 'circle' | 'square'
    /** 图片填充方式 */
    fit?: 'fill' | 'contain' | 'cover'
    /** 图片失败时展示的图标（内置几种） */
    icon?: 'user' | 'none'
    /** 背景色 */
    backgroundColor?: string
    ariaLabel?: string
  }>(),
  {
    src: undefined,
    srcSet: undefined,
    alt: '',
    size: 'default',
    shape: 'circle',
    fit: 'cover',
    icon: 'user',
    backgroundColor: undefined,
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  error: [e: Event]
}>()

const failed = ref(false)

watch(
  () => props.src,
  () => {
    failed.value = false
  }
)

function onError(e: Event) {
  failed.value = true
  emit('error', e)
}

/** 无 src 时的文字兜底：取 alt 首字符 */
const fallbackText = computed(() => (props.alt || '').trim().slice(0, 1).toUpperCase())

const sizeStyle = computed(() => {
  if (typeof props.size === 'number') return { width: `${props.size}px`, height: `${props.size}px` }
  return undefined
})

const sizeClass = computed(() =>
  typeof props.size === 'number' ? '' : `s-${props.size}`
)

const showImage = computed(() => !!props.src && !failed.value)
const showIcon = computed(() => !showImage.value && props.icon !== 'none')
const showText = computed(() => !showImage.value && props.icon === 'none' && !!fallbackText.value)
</script>

<template>
  <span
    class="dmk-avatar"
    :class="[sizeClass, `is-${shape}`]"
    :style="[sizeStyle, backgroundColor ? { backgroundColor } : undefined]"
    :aria-label="ariaLabel ?? alt"
    :role="ariaLabel || alt ? 'img' : undefined"
  >
    <img
      v-if="showImage"
      class="dmk-avatar__img"
      :src="src"
      :srcset="srcSet"
      :alt="alt"
      :style="{ objectFit: fit }"
      @error="onError"
    />
    <slot v-else-if="showIcon" name="icon">
      <svg v-if="icon === 'user'" class="dmk-avatar__icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="7" r="3.2" fill="currentColor" />
        <path d="M3.6 17.4c1-3.3 3.4-5 6.4-5s5.4 1.7 6.4 5" fill="currentColor" />
      </svg>
    </slot>
    <span v-else-if="showText" class="dmk-avatar__text">{{ fallbackText }}</span>
    <slot v-else name="error" />
  </span>
</template>

<style scoped>
.dmk-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  color: #fff;
  background: var(--dmk-color-primary);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  vertical-align: middle;
  user-select: none;
}

.dmk-avatar.is-circle {
  border-radius: 50%;
}

.dmk-avatar.is-square {
  border-radius: var(--dmk-radius-md);
}

.dmk-avatar.s-large {
  width: 56px;
  height: 56px;
  font-size: var(--dmk-font-lg);
}

.dmk-avatar.s-small {
  width: 28px;
  height: 28px;
  font-size: var(--dmk-font-sm);
}

.dmk-avatar__img {
  width: 100%;
  height: 100%;
  display: block;
}

.dmk-avatar__icon {
  width: 60%;
  height: 60%;
}

.dmk-avatar__text {
  font-weight: 600;
  line-height: 1;
}
</style>
