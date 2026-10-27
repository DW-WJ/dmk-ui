<script setup lang="ts">
/**
 * DSkeleton —— 骨架屏占位。
 * 设计要点：loading=false 直接渲染默认插槽（内容态无缝切换）；
 * 骨架块用令牌色渐变做微光（shimmer）动画，reduced-motion 降级为静态灰块；
 * 容器 role="status" + aria-busy 供读屏感知加载中。
 */
withDefaults(
  defineProps<{
    rows?: number
    avatar?: boolean
    animated?: boolean
    loading?: boolean
  }>(),
  {
    rows: 3,
    avatar: false,
    animated: true,
    loading: true
  }
)
</script>

<template>
  <div
    v-if="loading"
    class="dmk-skeleton"
    :class="{ 'is-animated': animated }"
    role="status"
    aria-busy="true"
  >
    <span class="dmk-skeleton__sr">加载中</span>
    <div v-if="avatar" class="dmk-skeleton__avatar" />
    <div class="dmk-skeleton__body">
      <div
        v-for="i in rows"
        :key="i"
        class="dmk-skeleton__row"
        :class="{ 'is-last': i === rows && rows > 1 }"
      />
    </div>
  </div>
  <slot v-else />
</template>

<style scoped>
.dmk-skeleton {
  display: flex;
  gap: var(--dmk-space-md);
  width: 100%;
  font-family: var(--dmk-font-family);
}

.dmk-skeleton__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: none;
}

.dmk-skeleton__avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--dmk-color-surface-hover);
}

.dmk-skeleton__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--dmk-space-sm);
}

.dmk-skeleton__row {
  height: 16px;
  border-radius: var(--dmk-radius-sm);
  background: var(--dmk-color-surface-hover);
}

.dmk-skeleton__row.is-last {
  width: 60%;
}

/* 微光动画：令牌色渐变 + 背景位移 */
.dmk-skeleton.is-animated .dmk-skeleton__avatar,
.dmk-skeleton.is-animated .dmk-skeleton__row {
  background: linear-gradient(
    90deg,
    var(--dmk-color-surface-hover) 25%,
    var(--dmk-color-surface-active) 37%,
    var(--dmk-color-surface-hover) 63%
  );
  background-size: 400% 100%;
  animation: dmk-skeleton-shimmer 1.4s linear infinite;
}

@keyframes dmk-skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dmk-skeleton.is-animated .dmk-skeleton__avatar,
  .dmk-skeleton.is-animated .dmk-skeleton__row {
    animation: none;
    background: var(--dmk-color-surface-hover);
  }
}
</style>
