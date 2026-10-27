<script lang="ts">
import type { InjectionKey, Ref } from 'vue'

/** 跨文件共享的 provide/inject 上下文（Symbol('dmkBreadcrumb')） */
export interface DBreadcrumbContext {
  separator: Ref<string>
}

export const dmkBreadcrumbKey: InjectionKey<DBreadcrumbContext> = Symbol('dmkBreadcrumb')
</script>

<script setup lang="ts">
/**
 * DBreadcrumb —— 面包屑导航。
 * 设计要点：<nav> + <ol> 语义结构；items 直接渲染或默认插槽手工组合；
 * 通过 provide（Symbol('dmkBreadcrumb')）把 separator 传给 DBreadcrumbItem，
 * item 之间自动渲染分隔符（末项由子组件 CSS 隐藏）。
 */
import { computed, provide } from 'vue'

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

const props = withDefaults(
  defineProps<{
    separator?: string
    items?: BreadcrumbItem[]
  }>(),
  {
    separator: '/',
    items: undefined
  }
)

provide(dmkBreadcrumbKey, {
  separator: computed(() => props.separator)
})
</script>

<template>
  <nav class="dmk-breadcrumb" aria-label="面包屑导航">
    <ol class="dmk-breadcrumb__list">
      <template v-if="items && items.length > 0">
        <li
          v-for="(item, index) in items"
          :key="index"
          class="dmk-breadcrumb__item"
          :class="{ 'is-current': item.current }"
        >
          <a
            v-if="item.href"
            class="dmk-breadcrumb__link"
            :href="item.href"
            :aria-current="item.current ? 'page' : undefined"
            >{{ item.label }}</a
          >
          <span
            v-else
            class="dmk-breadcrumb__text"
            :aria-current="item.current ? 'page' : undefined"
            >{{ item.label }}</span
          >
          <span
            v-if="index < items.length - 1"
            class="dmk-breadcrumb__separator"
            aria-hidden="true"
            >{{ separator }}</span
          >
        </li>
      </template>
      <slot v-else />
    </ol>
  </nav>
</template>

<style scoped>
.dmk-breadcrumb {
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  color: var(--dmk-color-text-muted);
}

.dmk-breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--dmk-space-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.dmk-breadcrumb__item {
  display: inline-flex;
  align-items: center;
  gap: var(--dmk-space-xs);
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

@media (prefers-reduced-motion: reduce) {
  .dmk-breadcrumb__link {
    transition: none;
  }
}
</style>
