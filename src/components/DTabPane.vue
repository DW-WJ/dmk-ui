<script setup lang="ts">
/**
 * DTabPane —— 标签页面板（DTabs 子组件）。
 * 设计要点：必须作为 DTabs 的直接子元素使用（Tabs 读取子 VNode props 生成头部）；
 * 通过 Symbol('dmkTabs') 注入激活态（跨文件用 Symbol.for 保证同一注册表符号），
 * 内容用 v-show 切换（不销毁），带 role="tabpanel" 与 aria-labelledby 关联。
 */
import { computed, inject, type ComputedRef, type InjectionKey } from 'vue'

interface TabsContext {
  activeName: ComputedRef<string | number>
  idPrefix: string
}

const TABS_KEY: InjectionKey<TabsContext> = Symbol.for('dmkTabs')

const props = withDefaults(
  defineProps<{
    name: string | number
    label: string
    disabled?: boolean
  }>(),
  {
    disabled: false
  }
)

const ctx = inject(TABS_KEY, null)

const isActive = computed(() => (ctx ? ctx.activeName.value === props.name : true))
const paneId = computed(() => (ctx ? `${ctx.idPrefix}-pane-${props.name}` : undefined))
const tabId = computed(() => (ctx ? `${ctx.idPrefix}-tab-${props.name}` : undefined))
</script>

<template>
  <div
    v-show="isActive"
    class="dmk-tab-pane"
    role="tabpanel"
    :id="paneId"
    :aria-labelledby="tabId"
    :aria-hidden="isActive ? undefined : 'true'"
    tabindex="0"
  >
    <slot />
  </div>
</template>

<style scoped>
.dmk-tab-pane {
  outline: none;
  color: var(--dmk-color-text);
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  line-height: 1.6;
}

.dmk-tab-pane:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
  border-radius: var(--dmk-radius-sm);
}
</style>
