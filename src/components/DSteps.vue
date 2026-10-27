<script setup lang="ts">
/**
 * DSteps —— 步骤条。
 * 设计要点：items 驱动（title / description / status）；active 标当前步；
 * 横向与竖向两种排布；点击可切换（可禁用）。
 */
export interface StepItem {
  title: string
  description?: string
  /** 手动指定状态，缺省按 active 推导 */
  status?: 'wait' | 'process' | 'finish' | 'error'
  disabled?: boolean
  icon?: string
}

const props = withDefaults(
  defineProps<{
    items?: StepItem[]
    /** 当前步下标 */
    active?: number
    direction?: 'horizontal' | 'vertical'
    /** 点击步骤是否切换 */
    clickable?: boolean
    ariaLabel?: string
  }>(),
  {
    items: () => [],
    active: 0,
    direction: 'horizontal',
    clickable: false,
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  change: [index: number]
}>()

function statusOf(i: number): 'wait' | 'process' | 'finish' | 'error' {
  const explicit = props.items[i]?.status
  if (explicit) return explicit
  if (i < props.active) return 'finish'
  if (i === props.active) return 'process'
  return 'wait'
}

function onClick(i: number) {
  if (!props.clickable || props.items[i]?.disabled) return
  emit('change', i)
}
</script>

<template>
  <div class="dmk-steps" :class="`is-${direction}`" :aria-label="ariaLabel">
    <div
      v-for="(item, i) in items"
      :key="i"
      class="dmk-steps__item"
      :class="[`is-${statusOf(i)}`, { 'is-clickable': clickable, 'is-disabled': item.disabled }]"
      :aria-current="i === active ? 'step' : undefined"
      @click="onClick(i)"
    >
      <div class="dmk-steps__head">
        <span class="dmk-steps__dot">
          <span v-if="item.icon" class="dmk-steps__icon">{{ item.icon }}</span>
          <svg v-else-if="statusOf(i) === 'finish'" class="dmk-steps__check" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 6.2 4.9 8.6 9.5 3.9" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span v-else class="dmk-steps__index">{{ i + 1 }}</span>
        </span>
        <span v-if="i < items.length - 1" class="dmk-steps__line" aria-hidden="true" />
      </div>
      <div class="dmk-steps__body">
        <div class="dmk-steps__title">{{ item.title }}</div>
        <div v-if="item.description" class="dmk-steps__desc">{{ item.description }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dmk-steps {
  display: flex;
  font-family: var(--dmk-font-family);
}

.dmk-steps.is-horizontal {
  flex-direction: row;
  gap: 0;
}

.dmk-steps.is-vertical {
  flex-direction: column;
  gap: 0;
}

.dmk-steps__item {
  display: flex;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.dmk-steps.is-vertical .dmk-steps__item {
  flex: none;
  padding-bottom: 16px;
}

.dmk-steps__item.is-clickable {
  cursor: pointer;
}

.dmk-steps__item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dmk-steps__head {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.dmk-steps.is-horizontal .dmk-steps__head {
  flex-direction: column;
  align-items: center;
}

.dmk-steps__dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-muted);
  background: var(--dmk-color-bg);
  border: 1px solid var(--dmk-color-border-strong);
}

.dmk-steps__item.is-process .dmk-steps__dot {
  color: var(--dmk-color-on-primary);
  background: var(--dmk-color-primary);
  border-color: var(--dmk-color-primary);
}

.dmk-steps__item.is-finish .dmk-steps__dot {
  color: var(--dmk-color-primary);
  background: var(--dmk-color-primary-subtle);
  border-color: var(--dmk-color-primary);
}

.dmk-steps__item.is-error .dmk-steps__dot {
  color: var(--dmk-color-on-primary);
  background: var(--dmk-color-danger);
  border-color: var(--dmk-color-danger);
}

.dmk-steps__check {
  width: 12px;
  height: 12px;
}

.dmk-steps__line {
  flex: 1;
  background: var(--dmk-color-border);
}

.dmk-steps.is-horizontal .dmk-steps__line {
  width: 100%;
  height: 1px;
  margin: 0 6px;
}

.dmk-steps.is-vertical .dmk-steps__line {
  width: 1px;
  height: 100%;
  position: absolute;
  top: 24px;
  left: 12px;
}

.dmk-steps__body {
  min-width: 0;
}

.dmk-steps.is-vertical .dmk-steps__body {
  padding-top: 2px;
}

.dmk-steps__title {
  font-size: var(--dmk-font-sm);
  font-weight: 500;
  color: var(--dmk-color-text);
}

.dmk-steps__item.is-process .dmk-steps__title {
  color: var(--dmk-color-primary);
  font-weight: 600;
}

.dmk-steps__desc {
  margin-top: 2px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-muted);
  line-height: 1.6;
}
</style>
