<script setup lang="ts">
/**
 * DPageHeader —— 页头。
 * 契约参考 Element Plus el-page-header：
 *   Attributes: icon（返回图标）/ title / content
 *   Events: back（点返回）
 *   Slots: icon / title / content / extra / breadcrumb / default
 *
 * 布局：面包屑行 → 标题行（返回图标 + 标题 + 副标题 + 右侧操作区）→ 内容区。
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 返回图标；传空字符串则不显示 */
    icon?: string
    /** 主标题 */
    title?: string
    /** 副标题 */
    content?: string
  }>(),
  {
    icon: 'ArrowLeft',
    title: '',
    content: ''
  }
)

const emit = defineEmits<{
  back: []
}>()

/** 是否显示返回图标 */
const showIcon = computed(() => props.icon !== '')
</script>

<template>
  <div class="dmk-page-header">
    <!-- 面包屑行 -->
    <div v-if="$slots.breadcrumb" class="dmk-page-header__breadcrumb">
      <slot name="breadcrumb" />
    </div>

    <!-- 标题行 -->
    <div class="dmk-page-header__title-row">
      <button
        v-if="showIcon"
        type="button"
        class="dmk-page-header__icon"
        aria-label="返回"
        @click="emit('back')"
      >
        <slot name="icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z" />
          </svg>
        </slot>
      </button>

      <div class="dmk-page-header__text">
        <div v-if="$slots.title || title" class="dmk-page-header__title">
          <slot name="title">{{ title }}</slot>
        </div>
        <div v-if="$slots.content || content" class="dmk-page-header__content">
          <slot name="content">{{ content }}</slot>
        </div>
      </div>

      <div v-if="$slots.extra" class="dmk-page-header__extra">
        <slot name="extra" />
      </div>
    </div>

    <!-- 内容区 -->
    <div v-if="$slots.default" class="dmk-page-header__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dmk-page-header {
  padding: var(--dmk-space-lg) 0;
  border-bottom: 1px solid var(--dmk-color-border);
  font-family: var(--dmk-font-family);
}

.dmk-page-header__breadcrumb {
  margin-bottom: var(--dmk-space-sm);
  font-size: 13px;
  color: var(--dmk-color-text-muted);
}

.dmk-page-header__title-row {
  display: flex;
  align-items: center;
  gap: var(--dmk-space-md);
}

.dmk-page-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  padding: 0;
  border: none;
  border-radius: var(--dmk-radius-md);
  background: transparent;
  color: var(--dmk-color-text-secondary);
  cursor: pointer;
  transition:
    background-color var(--dmk-duration-fast) var(--dmk-ease),
    color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-page-header__icon:hover {
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-primary);
}

.dmk-page-header__icon:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-page-header__icon svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.dmk-page-header__text {
  flex: 1 1 auto;
  min-width: 0;
}

.dmk-page-header__title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--dmk-color-text);
}

.dmk-page-header__content {
  margin-top: 2px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--dmk-color-text-muted);
}

.dmk-page-header__extra {
  display: flex;
  align-items: center;
  gap: var(--dmk-space-sm);
  flex: 0 0 auto;
}

.dmk-page-header__body {
  margin-top: var(--dmk-space-md);
}
</style>
