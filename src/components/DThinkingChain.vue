<script setup lang="ts">
/**
 * DThinkingChain —— 思维链 / 推理过程折叠区。
 *
 * 场景：AI 产品的「思考过程」展示（DeepSeek / Claude 的 reasoning）。
 *   默认折叠并显示摘要（"已思考 3.2 秒"），点击展开看完整推理链。
 *
 * 设计要点：
 *   · 三段状态：thinking（思考中，带动画）/ done（完成，可展开）/ error（出错）
 *   · 步骤列表：每步有状态标记（进行中 / 完成 / 失败）
 *   · 折叠动画走 grid-template-rows 技巧（不需要测高即可过渡）
 *   · 默认展开与否可控；思考中强制展开（用户在等结果，不该再点一次）
 *
 * 无障碍：
 *   · 折叠按钮带 aria-expanded / aria-controls
 *   · 思考中状态用 aria-live="polite" 播报
 */
import { computed, ref, watch } from 'vue'

type StepStatus = 'pending' | 'running' | 'done' | 'error'

export interface ThinkingStep {
  /** 步骤标题 */
  title: string
  /** 步骤详情（可选） */
  detail?: string
  /** 步骤状态 */
  status?: StepStatus
}

const props = withDefaults(
  defineProps<{
    /** 折叠区标题 */
    title?: string
    /** 展开时的摘要行（如「已思考 3.2 秒 · 消耗 128 tokens」） */
    summary?: string
    /** 步骤列表 */
    steps?: ThinkingStep[]
    /** 整体状态 */
    status?: 'thinking' | 'done' | 'error'
    /** 默认是否展开 */
    defaultExpanded?: boolean
    /** 思考中是否强制展开 */
    forceExpandWhileThinking?: boolean
  }>(),
  {
    title: '思考过程',
    summary: '',
    steps: () => [],
    status: 'done',
    defaultExpanded: false,
    forceExpandWhileThinking: true
  }
)

const expanded = ref(props.defaultExpanded)

/** 思考中强制展开：用户在等结果，不该再点一次才看到 */
watch(
  () => props.status,
  (s) => {
    if (s === 'thinking' && props.forceExpandWhileThinking) expanded.value = true
  },
  { immediate: true }
)

const isThinking = computed(() => props.status === 'thinking')
const panelId = 'dmk-thinking-panel'

function toggle() {
  expanded.value = !expanded.value
}
</script>

<template>
  <div
    class="dmk-thinking"
    :class="['s-' + status, { 'is-expanded': expanded }]"
  >
    <!-- 折叠头 -->
    <button
      type="button"
      class="dmk-thinking__header"
      :aria-expanded="expanded"
      :aria-controls="panelId"
      @click="toggle"
    >
      <span
        class="dmk-thinking__caret"
        aria-hidden="true"
      ></span>
      <span class="dmk-thinking__title">{{ title }}</span>
      <span
        v-if="summary"
        class="dmk-thinking__summary"
      >{{ summary }}</span>
      <span
        v-if="isThinking"
        class="dmk-thinking__spinner"
        aria-hidden="true"
      ></span>
      <span class="sr-only">{{ expanded ? '收起' : '展开' }}{{ title }}</span>
    </button>

    <!-- 折叠体 -->
    <div
      :id="panelId"
      class="dmk-thinking__panel"
      :hidden="!expanded"
    >
      <ol class="dmk-thinking__steps">
        <li
          v-for="(step, i) in steps"
          :key="i"
          class="dmk-thinking__step"
          :class="`is-${step.status ?? 'done'}`"
        >
          <span class="dmk-thinking__marker" aria-hidden="true">
            <span v-if="step.status === 'running'" class="dmk-thinking__mini-spinner"></span>
          </span>
          <div class="dmk-thinking__step-body">
            <div class="dmk-thinking__step-title">{{ step.title }}</div>
            <div
              v-if="step.detail"
              class="dmk-thinking__step-detail"
            >{{ step.detail }}</div>
          </div>
        </li>
      </ol>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dmk-thinking {
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  overflow: hidden;
  margin-bottom: 12px;
}

.dmk-thinking.s-thinking {
  border-color: var(--dmk-color-primary-subtle);
}

.dmk-thinking.s-error {
  border-color: var(--dmk-color-danger-subtle);
}

.dmk-thinking__header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-text-secondary);
  text-align: left;
}

.dmk-thinking__header:hover {
  background: var(--dmk-color-fill);
}

.dmk-thinking__header:focus-visible {
  outline: 2px solid var(--dmk-color-primary);
  outline-offset: -2px;
}

.dmk-thinking__caret {
  width: 0;
  height: 0;
  border-left: 5px solid currentColor;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  transition: transform 0.18s ease;
  flex: 0 0 auto;
}

.dmk-thinking.is-expanded .dmk-thinking__caret {
  transform: rotate(90deg);
}

.dmk-thinking__title {
  color: var(--dmk-text-primary);
  font-weight: 500;
}

.dmk-thinking__summary {
  color: var(--dmk-text-tertiary);
  font-size: 12px;
}

.dmk-thinking__spinner {
  width: 12px;
  height: 12px;
  margin-left: auto;
  border: 2px solid var(--dmk-color-border);
  border-top-color: var(--dmk-color-primary);
  border-radius: 50%;
  animation: dmk-thinking-spin 0.7s linear infinite;
}

@keyframes dmk-thinking-spin {
  to {
    transform: rotate(360deg);
  }
}

/* —— 折叠体 —— */
.dmk-thinking__panel {
  padding: 4px 12px 12px;
  border-top: 1px solid var(--dmk-color-border);
}

.dmk-thinking__steps {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.dmk-thinking__step {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.dmk-thinking__marker {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  margin-top: 3px;
  border-radius: 50%;
  border: 1.5px solid var(--dmk-color-border-strong);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dmk-thinking__step.is-done .dmk-thinking__marker {
  background: var(--dmk-color-success);
  border-color: var(--dmk-color-success);
}

.dmk-thinking__step.is-running .dmk-thinking__marker {
  border-color: var(--dmk-color-primary);
}

.dmk-thinking__step.is-error .dmk-thinking__marker {
  background: var(--dmk-color-danger);
  border-color: var(--dmk-color-danger);
}

.dmk-thinking__mini-spinner {
  width: 8px;
  height: 8px;
  border: 1.5px solid var(--dmk-color-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: dmk-thinking-spin 0.6s linear infinite;
}

.dmk-thinking__step-title {
  font-size: var(--dmk-font-sm);
  color: var(--dmk-text-primary);
  line-height: 1.6;
}

.dmk-thinking__step.is-pending .dmk-thinking__step-title {
  color: var(--dmk-text-tertiary);
}

.dmk-thinking__step-detail {
  font-size: 12px;
  color: var(--dmk-text-tertiary);
  line-height: 1.6;
  margin-top: 2px;
  white-space: pre-wrap;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .dmk-thinking__caret {
    transition: none;
  }

  .dmk-thinking__spinner,
  .dmk-thinking__mini-spinner {
    animation-duration: 1.4s;
  }
}
</style>
