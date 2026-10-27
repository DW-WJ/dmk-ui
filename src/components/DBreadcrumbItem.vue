<script setup lang="ts">
/**
 * DBreadcrumbItem —— 面包屑子项。
 * 设计要点：有 href 渲染 <a>，否则 <span>；current 加 aria-current="page"；
 * 尾部自动渲染分隔符（inject Symbol('dmkBreadcrumb') 拿 separator，
 * 末项用 :last-child 隐藏），支持独立使用（分隔符兜底 '/'）。
 */
import { computed, inject } from 'vue'
import { dmkBreadcrumbKey } from './DBreadcrumb.vue'

const props = withDefaults(
  defineProps<{
    href?: string
    current?: boolean
  }>(),
  {
    href: undefined,
    current: false
  }
)

const ctx = inject(dmkBreadcrumbKey, null)
const separator = computed(() => ctx?.separator.value ?? '/')
</script>

<template>
  <li class="dmk-breadcrumb__item" :class="{ 'is-current': current }">
    <a
      v-if="props.href"
      class="dmk-breadcrumb__link"
      :href="props.href"
      :aria-current="current ? 'page' : undefined"
    >
      <slot />
    </a>
    <span v-else class="dmk-breadcrumb__text" :aria-current="current ? 'page' : undefined">
      <slot />
    </span>
    <span class="dmk-breadcrumb__separator" aria-hidden="true">{{ separator }}</span>
  </li>
</template>

<style scoped>
.dmk-breadcrumb__item {
  display: inline-flex;
  align-items: center;
  gap: var(--dmk-space-xs);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
}

.dmk-breadcrumb__link {
  color: var(--dmk-color-text-secondary);
  text-decoration: none;
  border-radius: var(--dmk-radius-sm);
  transition: color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-breadcrumb__link:hover {
  color: var(--dmk-color-primary);
}

.dmk-breadcrumb__link:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-breadcrumb__text {
  color: var(--dmk-color-text);
}

.dmk-breadcrumb__item.is-current .dmk-breadcrumb__text,
.dmk-breadcrumb__item.is-current .dmk-breadcrumb__link {
  color: var(--dmk-color-text);
  font-weight: 600;
}

.dmk-breadcrumb__separator {
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
  user-select: none;
}

/* 末项不渲染分隔符 */
.dmk-breadcrumb__item:last-child .dmk-breadcrumb__separator {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .dmk-breadcrumb__link {
    transition: none;
  }
}
</style>
