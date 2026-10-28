<script setup lang="ts">
/**
 * DChatMessage —— AI 对话消息气泡。
 *
 * 设计要点：
 *   · 角色区分：user（右侧，主色底）/ assistant（左侧，表面底）/ system（居中窄条）
 *   · 消息体支持 Markdown 直出的内容槽 + 纯文本模式
 *   · 状态：loading（生成中，带流式光标）/ error（出错，可重试）/ stop（已中断）
 *   · 附件与操作：footer 插槽放「重新生成 / 复制 / 点赞」等动作
 *   · 头像：avatar 插槽或 name 首字母自动生成
 *
 * 无障碍：
 *   · role="log" + aria-live="polite" 让屏幕阅读器在流式输出时播报
 *   · 生成中状态用 aria-busy 标记，错误用 role="alert"
 */
import { computed } from 'vue'

type Role = 'user' | 'assistant' | 'system'
type Status = 'done' | 'streaming' | 'error' | 'stopped'

const props = withDefaults(
  defineProps<{
    role?: Role
    /** 消息正文（纯文本模式）；也可只用默认插槽放富内容 */
    content?: string
    /** 说话人名称（用于头像首字母与 a11y 标签） */
    name?: string
    avatar?: string
    status?: Status
    /** 出错时的错误文案 */
    errorText?: string
    /** Markdown 渲染后的 HTML（v-html）；传了则忽略 content */
    html?: string
    /** 时间戳（展示用） */
    time?: string
  }>(),
  {
    role: 'assistant',
    content: '',
    name: '',
    avatar: '',
    status: 'done',
    errorText: '生成出错',
    html: '',
    time: ''
  }
)

const emit = defineEmits<{
  retry: []
  stop: []
}>()

/** 头像首字母：没给头像时用名字第一个字符兜底 */
const initial = computed(() => (props.name ? props.name.trim().charAt(0) : ''))

/** 流式生成中 = 尾部有光标 */
const isStreaming = computed(() => props.status === 'streaming')

/** 系统消息是窄条，不显示头像 */
const showAvatar = computed(() => props.role !== 'system')

const ariaLabel = computed(() => {
  const who = props.name || (props.role === 'user' ? '用户' : props.role === 'system' ? '系统' : '助手')
  return `${who}的消息`
})
</script>

<template>
  <div
    class="dmk-chat"
    :class="[`r-${role}`, `s-${status}`]"
    role="log"
    aria-live="polite"
    :aria-busy="isStreaming ? 'true' : undefined"
    :aria-label="ariaLabel"
  >
    <!-- 头像 -->
    <div v-if="showAvatar" class="dmk-chat__avatar" aria-hidden="true">
      <img v-if="avatar" :src="avatar" :alt="name" class="dmk-chat__avatar-img">
      <span v-else class="dmk-chat__avatar-text">{{ initial }}</span>
    </div>

    <!-- 主体 -->
    <div class="dmk-chat__body">
      <div v-if="name || time" class="dmk-chat__meta">
        <span v-if="name" class="dmk-chat__name">{{ name }}</span>
        <span v-if="time" class="dmk-chat__time">{{ time }}</span>
      </div>

      <!-- 正文 -->
      <div class="dmk-chat__content">
        <!-- 错误态 -->
        <div v-if="status === 'error'" class="dmk-chat__error" role="alert">
          <span class="dmk-chat__error-text">{{ errorText }}</span>
          <button type="button" class="dmk-chat__retry" @click="emit('retry')">重试</button>
        </div>

        <!-- 系统消息走独立样式（居中窄条） -->
        <p v-else-if="role === 'system'" class="dmk-chat__system-text">
          {{ content }}
          <slot />
        </p>

        <!-- 富内容（Markdown 渲染后） -->
        <div v-else-if="html" class="dmk-chat__html" v-html="html"></div>

        <!-- 纯文本 + 流式光标 -->
        <p v-else class="dmk-chat__text">
          {{ content }}<slot />
          <span v-if="isStreaming" class="dmk-chat__cursor" aria-hidden="true"></span>
        </p>
      </div>

      <!-- 底部动作区 -->
      <div v-if="$slots.footer || isStreaming" class="dmk-chat__footer">
        <slot name="footer">
          <button
            v-if="isStreaming"
            type="button"
            class="dmk-chat__stop"
            @click="emit('stop')"
          >停止生成</button>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dmk-chat {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.dmk-chat.r-user {
  flex-direction: row-reverse;
}

.dmk-chat.r-system {
  justify-content: center;
}

/* —— 头像 —— */
.dmk-chat__avatar {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--dmk-color-primary-subtle);
  color: var(--dmk-color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--dmk-font-sm);
  font-weight: 500;
  overflow: hidden;
}

.dmk-chat.r-user .dmk-chat__avatar {
  background: var(--dmk-color-primary);
  color: var(--dmk-color-on-primary);
}

.dmk-chat__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dmk-chat__avatar-text {
  line-height: 1;
}

/* —— 主体 —— */
.dmk-chat__body {
  min-width: 0;
  max-width: min(78%, 640px);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dmk-chat.r-user .dmk-chat__body {
  align-items: flex-end;
}

.dmk-chat.r-system .dmk-chat__body {
  max-width: 100%;
  align-items: center;
}

.dmk-chat__meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.dmk-chat__name {
  color: var(--dmk-text-primary);
  font-weight: 500;
}

.dmk-chat__time {
  color: var(--dmk-text-tertiary);
}

/* —— 正文 —— */
.dmk-chat__content {
  position: relative;
  border-radius: var(--dmk-radius-lg);
  padding: 10px 14px;
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  font-size: var(--dmk-font-base);
  line-height: 1.7;
  color: var(--dmk-text-primary);
  word-break: break-word;
}

.dmk-chat.r-user .dmk-chat__content {
  background: var(--dmk-color-primary-subtle);
  border-color: var(--dmk-color-primary-subtle);
}

.dmk-chat.r-system .dmk-chat__content {
  background: transparent;
  border: none;
  padding: 2px 0;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-text-tertiary);
  text-align: center;
}

.dmk-chat__text,
.dmk-chat__system-text {
  margin: 0;
  white-space: pre-wrap;
}

.dmk-chat__html :deep(p) {
  margin: 0 0 8px;
}

.dmk-chat__html :deep(p:last-child) {
  margin-bottom: 0;
}

.dmk-chat__html :deep(code) {
  font-family: var(--dmk-font-mono);
  font-size: 0.9em;
  background: var(--dmk-color-fill);
  border-radius: 4px;
  padding: 1px 5px;
}

.dmk-chat__html :deep(pre) {
  background: var(--dmk-color-fill);
  border-radius: var(--dmk-radius-md);
  padding: 10px 12px;
  overflow-x: auto;
}

/* —— 流式光标 —— */
.dmk-chat__cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--dmk-color-primary);
  animation: dmk-chat-blink 1s steps(2, start) infinite;
}

@keyframes dmk-chat-blink {
  to {
    visibility: hidden;
  }
}

/* —— 错误态 —— */
.dmk-chat__error {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--dmk-color-danger);
}

.dmk-chat__error-text {
  font-size: var(--dmk-font-sm);
}

.dmk-chat__retry {
  border: 1px solid var(--dmk-color-danger);
  background: transparent;
  color: var(--dmk-color-danger);
  border-radius: var(--dmk-radius-sm);
  padding: 2px 10px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.dmk-chat__retry:hover {
  background: var(--dmk-color-danger-subtle);
}

/* —— 底部 —— */
.dmk-chat__footer {
  display: flex;
  gap: 8px;
  padding-top: 2px;
}

.dmk-chat__stop {
  border: 1px solid var(--dmk-color-border);
  background: var(--dmk-color-surface);
  color: var(--dmk-text-secondary);
  border-radius: var(--dmk-radius-sm);
  padding: 2px 10px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.dmk-chat__stop:hover {
  border-color: var(--dmk-color-border-strong);
  color: var(--dmk-text-primary);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-chat__cursor {
    animation: none;
  }
}
</style>
