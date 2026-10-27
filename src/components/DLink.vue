<script setup lang="ts">
/**
 * DLink —— 文字链接。
 * 契约参考 Element Plus el-link：
 *   type（语义色）/ underline（always|hover|never）/ disabled /
 *   href / target / icon（插槽）。
 * 安全：href 会先做协议白名单校验（http/https/mailto/tel/相对地址），
 *       javascript: 等危险协议一律降级为 '#'，防 XSS 与开放重定向。
 */
import { computed } from 'vue'

type Type = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
type Underline = 'always' | 'hover' | 'never'

const props = withDefaults(
  defineProps<{
    type?: Type
    underline?: Underline
    disabled?: boolean
    href?: string
    target?: '_self' | '_blank' | '_parent' | '_top'
  }>(),
  {
    type: 'default',
    underline: 'hover',
    disabled: false,
    href: undefined,
    target: '_self'
  }
)

/** 允许的协议白名单；其余（javascript:、data: 等）一律拦掉 */
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

const safeHref = computed(() => {
  const raw = props.href
  if (!raw) return undefined
  if (props.disabled) return undefined
  try {
    // 用当前站点 origin 兜底相对地址；非法 URL 直接判危险
    const parsed = new URL(raw, 'https://placeholder.invalid')
    if (SAFE_PROTOCOLS.includes(parsed.protocol)) return raw
    return '#'
  } catch {
    return '#'
  }
})

const isAnchor = computed(() => !!safeHref.value)
</script>

<template>
  <a
    v-if="isAnchor"
    class="dmk-link"
    :class="[`dmk-link--${type}`, `dmk-link--underline-${underline}`]"
    :href="safeHref"
    :target="target"
    :aria-disabled="disabled ? 'true' : undefined"
    :tabindex="disabled ? -1 : undefined"
    rel="noopener noreferrer"
  >
    <span v-if="$slots.icon" class="dmk-link__icon" aria-hidden="true">
      <slot name="icon" />
    </span>
    <span class="dmk-link__text">
      <slot />
    </span>
  </a>
  <span
    v-else
    class="dmk-link"
    :class="[
      `dmk-link--${type}`,
      `dmk-link--underline-${underline}`,
      { 'is-disabled': disabled }
    ]"
    :aria-disabled="disabled ? 'true' : undefined"
    :role="disabled ? 'link' : undefined"
  >
    <span v-if="$slots.icon" class="dmk-link__icon" aria-hidden="true">
      <slot name="icon" />
    </span>
    <span class="dmk-link__text">
      <slot />
    </span>
  </span>
</template>

<style scoped>
.dmk-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  line-height: 1.5;
  color: var(--dmk-color-primary);
  text-decoration: none;
  cursor: pointer;
  transition:
    color var(--dmk-duration-fast) var(--dmk-ease),
    opacity var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-link--default {
  color: var(--dmk-color-primary);
}
.dmk-link--success {
  color: var(--dmk-color-success);
}
.dmk-link--warning {
  color: var(--dmk-color-warning);
}
.dmk-link--danger {
  color: var(--dmk-color-danger);
}
.dmk-link--info {
  color: var(--dmk-color-info);
}

.dmk-link__icon {
  display: inline-flex;
  align-items: center;
}

.dmk-link__icon :deep(svg) {
  width: 1em;
  height: 1em;
  fill: currentColor;
}

/* 下划线策略 */
.dmk-link--underline-always .dmk-link__text {
  text-decoration: underline;
}
.dmk-link--underline-hover .dmk-link__text {
  text-decoration: none;
}
.dmk-link--underline-hover:hover .dmk-link__text {
  text-decoration: underline;
}
.dmk-link--underline-never .dmk-link__text {
  text-decoration: none;
}

.dmk-link:hover {
  opacity: 0.82;
}

.dmk-link.is-disabled,
.dmk-link[aria-disabled='true'] {
  color: var(--dmk-color-text-muted);
  cursor: not-allowed;
  opacity: 1;
  pointer-events: none;
}

.dmk-link:focus-visible {
  outline: none;
  border-radius: var(--dmk-radius-sm);
  box-shadow: var(--dmk-shadow-focus);
}
</style>
