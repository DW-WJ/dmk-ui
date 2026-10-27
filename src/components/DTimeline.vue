<script setup lang="ts">
/**
 * DTimeline —— 时间轴。
 * 设计要点：items 驱动（title / content / timestamp / type）；
 * 节点用 SVG 圆点 + 连接线；hollow 空心节点；reverse 时间轴翻转。
 */
export interface TimelineItem {
  title?: string
  content?: string
  timestamp?: string
  /** 节点类型，决定颜色 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  hollow?: boolean
}

withDefaults(
  defineProps<{
    items?: TimelineItem[]
    /** 整体反转（时间倒序） */
    reverse?: boolean
    /** 时间戳位置 */
    timestampPosition?: 'left' | 'right'
    ariaLabel?: string
  }>(),
  {
    items: () => [],
    reverse: false,
    timestampPosition: 'right',
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  click: [item: TimelineItem, index: number]
}>()
</script>

<template>
  <div class="dmk-timeline" :class="{ 'is-reverse': reverse }" :aria-label="ariaLabel">
    <div
      v-for="(item, i) in items"
      :key="i"
      class="dmk-timeline__item"
      :class="[`is-${item.type ?? 'primary'}`, { 'is-hollow': item.hollow }]"
      @click="emit('click', item, i)"
    >
      <div class="dmk-timeline__node" aria-hidden="true">
        <span class="dmk-timeline__dot" />
      </div>
      <div class="dmk-timeline__body">
        <div class="dmk-timeline__head">
          <span v-if="item.title" class="dmk-timeline__title">{{ item.title }}</span>
          <span v-if="item.timestamp" class="dmk-timeline__timestamp">{{ item.timestamp }}</span>
        </div>
        <div v-if="item.content" class="dmk-timeline__content">{{ item.content }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dmk-timeline {
  font-family: var(--dmk-font-family);
}

.dmk-timeline__item {
  position: relative;
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
}

.dmk-timeline__item:last-child {
  padding-bottom: 0;
}

.dmk-timeline__node {
  position: relative;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  width: 12px;
  padding-top: 5px;
}

.dmk-timeline__item:not(:last-child) .dmk-timeline__node::after {
  content: '';
  position: absolute;
  top: 14px;
  bottom: -20px;
  width: 1px;
  background: var(--dmk-color-border);
}

.dmk-timeline__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--dmk-color-primary);
  box-shadow: 0 0 0 3px var(--dmk-color-primary-subtle);
}

.dmk-timeline__item.is-success .dmk-timeline__dot { background: var(--dmk-color-success); }
.dmk-timeline__item.is-warning .dmk-timeline__dot { background: var(--dmk-color-warning); }
.dmk-timeline__item.is-danger .dmk-timeline__dot { background: var(--dmk-color-danger); }
.dmk-timeline__item.is-info .dmk-timeline__dot { background: var(--dmk-color-info); }

.dmk-timeline__item.is-hollow .dmk-timeline__dot {
  background: var(--dmk-color-surface);
  border: 2px solid currentColor;
  box-shadow: none;
}

.dmk-timeline__body {
  flex: 1;
  min-width: 0;
}

.dmk-timeline__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.dmk-timeline__title {
  font-size: var(--dmk-font-base);
  font-weight: 600;
  color: var(--dmk-color-text);
}

.dmk-timeline__timestamp {
  flex-shrink: 0;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-faint);
}

.dmk-timeline__content {
  margin-top: 4px;
  font-size: var(--dmk-font-sm);
  line-height: 1.7;
  color: var(--dmk-color-text-secondary);
}

.dmk-timeline.is-reverse {
  display: flex;
  flex-direction: column-reverse;
}
</style>
