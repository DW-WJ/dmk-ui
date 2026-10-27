<script setup lang="ts">
/**
 * DConfigProvider —— 全局配置提供者。
 * 契约参考 Element Plus el-config-provider：
 *   Attributes: locale / size（全局组件尺寸）/ zIndex（全局初始层级）/
 *     namespace（全局类名前缀）/ button / link / card / message / table /
 *     experimentalFeatures / emptyValues / valueOnClear
 *   Slots: default（子组件通过 slot 拿到 config）
 *
 * 实现：provide 一个可响应的全局配置对象；
 *      默认插槽把 config 作为 slot props 暴露（#default="{ size }"）。
 *      size 会被写进 CSS 变量 --dmk-control-height 等，组件按尺寸令牌自适应。
 */
import { computed, provide, reactive } from 'vue'
import { CONFIG_PROVIDER_KEY, type DmkGlobalConfig } from '../lib/config'

const props = withDefaults(
  defineProps<{
    locale?: string
    size?: 'sm' | 'md' | 'lg'
    zIndex?: number
    namespace?: string
    button?: Record<string, unknown>
    link?: Record<string, unknown>
    card?: Record<string, unknown>
    message?: Record<string, unknown>
    table?: Record<string, unknown>
    experimentalFeatures?: Record<string, boolean>
    emptyValues?: unknown[]
    valueOnClear?: string | number | boolean | ((value: unknown) => unknown)
  }>(),
  {
    locale: 'zh-CN',
    size: 'md',
    zIndex: undefined,
    namespace: 'dmk',
    button: undefined,
    link: undefined,
    card: undefined,
    message: undefined,
    table: undefined,
    experimentalFeatures: undefined,
    emptyValues: undefined,
    valueOnClear: undefined
  }
)

/** 全局配置对象（响应式） */
const config = reactive<DmkGlobalConfig>({
  size: props.size,
  zIndex: props.zIndex,
  namespace: props.namespace,
  button: props.button,
  link: props.link,
  card: props.card,
  message: props.message,
  table: props.table,
  experimentalFeatures: props.experimentalFeatures,
  emptyValues: props.emptyValues,
  valueOnClear: props.valueOnClear
})

/** 让子组件能读到这个配置（组件内部用 inject） */
provide(CONFIG_PROVIDER_KEY, config)

/** 尺寸档 → 控件高度令牌，让全站控件跟随 size 变化 */
const sizeVars = computed(() => {
  const map: Record<'sm' | 'md' | 'lg', { h: string; hs: string; hl: string; px: string }> = {
    sm: { h: '28px', hs: '24px', hl: '36px', px: '8px' },
    md: { h: '36px', hs: '28px', hl: '44px', px: '12px' },
    lg: { h: '44px', hs: '36px', hl: '52px', px: '16px' }
  }
  const v = map[config.size ?? 'md']
  return {
    '--dmk-control-height': v.h,
    '--dmk-control-height-sm': v.hs,
    '--dmk-control-height-lg': v.hl,
    '--dmk-control-padding-x': v.px
  }
})

defineExpose({ config })
</script>

<template>
  <div class="dmk-config-provider" :style="sizeVars">
    <slot :config="config" :size="config.size" :namespace="config.namespace" />
  </div>
</template>

<style scoped>
.dmk-config-provider {
  display: contents;
}
</style>
