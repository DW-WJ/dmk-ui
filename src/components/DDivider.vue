<script setup lang="ts">
/**
 * DDivider —— 分割线。
 * 设计要点：horizontal 横线可携带分割文字（contentPosition 控制文字位置，
 * 左右线按比例分配剩余空间）；vertical 竖线用于行内分隔；
 * dashed 虚线；role="separator" + aria-orientation 表达方向语义。
 */
withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical'
    contentPosition?: 'left' | 'center' | 'right'
    dashed?: boolean
  }>(),
  {
    direction: 'horizontal',
    contentPosition: 'center',
    dashed: false
  }
)
</script>

<template>
  <div
    class="dmk-divider"
    :class="[
      `dmk-divider--${direction}`,
      `dmk-divider--${contentPosition}`,
      { 'is-dashed': dashed, 'is-with-content': !!$slots.default }
    ]"
    role="separator"
    :aria-orientation="direction"
  >
    <template v-if="direction === 'horizontal'">
      <span class="dmk-divider__line" aria-hidden="true" />
      <span v-if="$slots.default" class="dmk-divider__content">
        <slot />
      </span>
      <span class="dmk-divider__line" aria-hidden="true" />
    </template>
    <template v-else>
      <span v-if="$slots.default" class="dmk-divider__line" aria-hidden="true" />
      <span v-if="$slots.default" class="dmk-divider__content">
        <slot />
      </span>
      <span class="dmk-divider__line" aria-hidden="true" />
    </template>
  </div>
</template>

<style scoped>
.dmk-divider {
  display: flex;
  align-items: center;
  width: 100%;
  margin: var(--dmk-space-md) 0;
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-muted);
}

.dmk-divider__line {
  flex: 1;
  border-top: 1px solid var(--dmk-color-border);
}

.dmk-divider.is-dashed .dmk-divider__line {
  border-top-style: dashed;
}

.dmk-divider__content {
  flex-shrink: 0;
  padding: 0 var(--dmk-space-md);
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
  white-space: nowrap;
}

/* 文字位置：按比例压缩该侧线条 */
.dmk-divider--left .dmk-divider__line:first-child {
  flex-grow: 0.08;
}

.dmk-divider--right .dmk-divider__line:last-child {
  flex-grow: 0.08;
}

.dmk-divider--left .dmk-divider__content {
  padding-left: 0;
}

.dmk-divider--right .dmk-divider__content {
  padding-right: 0;
}

/* 竖线 */
.dmk-divider--vertical {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: auto;
  height: 1em;
  margin: 0 var(--dmk-space-sm);
  vertical-align: middle;
}

.dmk-divider--vertical.is-with-content {
  height: auto;
}

.dmk-divider--vertical .dmk-divider__line {
  flex: 1;
  width: 0;
  border-top: none;
  border-left: 1px solid var(--dmk-color-border);
}

.dmk-divider--vertical.is-dashed .dmk-divider__line {
  border-left-style: dashed;
}

.dmk-divider--vertical .dmk-divider__content {
  padding: var(--dmk-space-xs) 0;
  white-space: normal;
}
</style>
