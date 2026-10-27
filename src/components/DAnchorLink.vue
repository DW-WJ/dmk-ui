<script setup lang="ts">
/**
 * DAnchorLink —— 锚点链接（DAnchor 的子组件）。
 * 契约参考 Element Plus el-anchor-link：title（文案）/ href（锚点地址）。
 * 插槽：default（自定义文案）/ sub-link（子链接区）。
 */
import { computed, inject, onBeforeUnmount, onMounted } from 'vue'
import { ANCHOR_REGISTRY_KEY, type AnchorItem } from '../lib/anchor'

const props = withDefaults(
  defineProps<{
    title?: string
    href: string
    /** 层级（0 为一级） */
    level?: number
  }>(),
  {
    title: '',
    level: 0
  }
)

const registry = inject(ANCHOR_REGISTRY_KEY, null)

/** 当前是否激活（由父级通过 class 传递） */
const item: AnchorItem = { href: props.href, label: props.title, level: props.level }

onMounted(() => {
  registry?.register(item)
})

onBeforeUnmount(() => {
  registry?.unregister(props.href)
})

const linkClass = computed(() => [
  'dmk-anchor-link',
  `is-level-${props.level}`,
  { 'has-sub': !!registry }
])
</script>

<template>
  <a
    :href="`#${href.replace(/^#/, '')}`"
    :class="linkClass"
    @click="registry?.notifyClick(href, $event)"
  >
    <slot>{{ title || href }}</slot>
    <div class="dmk-anchor-link__sub">
      <slot name="sub-link" />
    </div>
  </a>
</template>

<style scoped>
.dmk-anchor-link {
  display: block;
  padding: 4px 0;
  color: var(--dmk-color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
  text-decoration: none;
  transition: color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-anchor-link:hover {
  color: var(--dmk-color-primary);
}

.dmk-anchor-link.is-level-1 {
  padding-left: 14px;
  font-size: 12px;
}

.dmk-anchor-link.is-level-2 {
  padding-left: 28px;
  font-size: 12px;
}

.dmk-anchor-link__sub:empty {
  display: none;
}
</style>
