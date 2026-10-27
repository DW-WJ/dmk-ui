<script setup lang="ts">
/**
 * DLoading —— 加载遮罩。
 * 契约参考 Element Plus el-loading：
 *   Attributes: target（挂载目标 selector|HTMLElement）/ visible /
 *     text / textColor / background / customClass / icon /
 *     color / fontSize / lock / fullscreen / fullscreenFixed /
 *     zIndex / elementPosition
 *   Slots: default（自定义图标）/ spinner（自定义动画）
 *
 * 两种用法：
 *   ① 组件式：<DLoading :visible="busy" text="加载中…" />
 *   ② 指令式：v-loading="busy"（由 loading 指令注册）
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    visible?: boolean
    text?: string
    textColor?: string
    background?: string
    customClass?: string
    icon?: string
    color?: string
    fontSize?: number | string
    lock?: boolean
    fullscreen?: boolean
    fullscreenFixed?: boolean
    zIndex?: number
    elementPosition?: string
  }>(),
  {
    visible: false,
    text: '',
    textColor: undefined,
    background: undefined,
    customClass: undefined,
    icon: undefined,
    color: undefined,
    fontSize: undefined,
    lock: false,
    fullscreen: false,
    fullscreenFixed: false,
    zIndex: undefined,
    elementPosition: 'relative'
  }
)

const hostRef = ref<HTMLElement | null>(null)

const rootStyle = computed(() => ({
  zIndex: props.zIndex !== undefined ? String(props.zIndex) : 'var(--dmk-z-popup)',
  background: props.background ?? 'var(--dmk-color-mask)',
  color: props.textColor,
  fontSize: props.fontSize ? (typeof props.fontSize === 'number' ? `${props.fontSize}px` : props.fontSize) : undefined
}))

/** 锁定页面滚动（lock=true 时） */
function lockScroll(lock: boolean) {
  if (typeof document === 'undefined') return
  document.body.style.overflow = lock ? 'hidden' : ''
}

watch(
  () => props.visible,
  (v) => lockScroll(props.lock && v)
)

onMounted(() => lockScroll(props.lock && props.visible))

onBeforeUnmount(() => lockScroll(false))
</script>

<template>
  <div
    v-if="visible"
    ref="hostRef"
    class="dmk-loading"
    :class="[
      { 'is-fullscreen': fullscreen, 'is-fixed': fullscreenFixed },
      customClass
    ]"
    :style="rootStyle"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="dmk-loading__spinner" :style="color ? { color } : undefined">
      <slot name="spinner">
        <span class="dmk-loading__icon" :style="icon ? { fontSize: icon } : undefined">
          <slot>
            <svg class="dmk-loading__svg" viewBox="0 0 1024 1024" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8z" fill="currentColor" />
            </svg>
          </slot>
        </span>
      </slot>
    </div>
    <p v-if="text" class="dmk-loading__text">{{ text }}</p>
    <span class="dmk-visually-hidden">{{ text || '加载中' }}</span>
  </div>
</template>

<style scoped>
.dmk-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--dmk-space-sm);
  background: var(--dmk-color-mask);
  color: #fff;
  z-index: var(--dmk-z-popup);
}

.dmk-loading.is-fullscreen {
  position: fixed;
  inset: 0;
}

.dmk-loading.is-fixed {
  position: fixed;
}

.dmk-loading__spinner {
  display: inline-flex;
}

.dmk-loading__svg {
  width: 2em;
  height: 2em;
  animation: dmk-loading-spin 1s linear infinite;
}

@keyframes dmk-loading-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.dmk-loading__text {
  margin: 0;
  font-size: 0.9em;
  color: inherit;
}

.dmk-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .dmk-loading__svg {
    animation-duration: 2.4s;
  }
}
</style>
