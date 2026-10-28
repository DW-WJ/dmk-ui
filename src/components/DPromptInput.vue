<script setup lang="ts">
/**
 * DPromptInput —— AI 提示词输入框。
 *
 * 场景：ChatGPT / Claude 那样的输入区。核心不是 textarea，而是这一圈周边：
 *   · 自动增高（不换行时最多几行，到顶就滚动）
 *   · token 计数（估算字符数 / 4，中英混排时够用；可传自定义计数函数）
 *   · 发送按钮的可用态（空内容禁用）+ Ctrl/⌘ + Enter 快捷发送
 *   · 附加项区：模型选择、工具开关、附件等（默认插槽）
 *   · 超出长度上限时的提示
 *
 * 无障碍：
 *   · textarea 有 aria-label
 *   · 计数与超限提示用 aria-live="polite" 播报（不打断输入）
 *   · 发送按钮在禁用时用 aria-disabled 而非真 disabled（保持可聚焦，便于读屏用户理解为什么不能发）
 */
import { computed, nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    /** 最大字符数；0 = 不限 */
    maxLength?: number
    /** 估算 token 数（默认按 字符数/4 的经验值，中英混排够用） */
    tokenCount?: number | ((text: string) => number)
    /** 自动增高的最大行数 */
    maxRows?: number
    /** 是否禁用 */
    disabled?: boolean
    /** 是否显示 token 计数 */
    showTokenCount?: boolean
    /** 发送按钮文案 */
    sendText?: string
    /** 占位提示下方的补充说明 */
    hint?: string
    ariaLabel?: string
  }>(),
  {
    modelValue: '',
    placeholder: '输入你的问题…',
    maxLength: 0,
    tokenCount: undefined,
    maxRows: 6,
    disabled: false,
    showTokenCount: true,
    sendText: '发送',
    hint: '',
    ariaLabel: '提示词输入框'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  send: [value: string]
  stop: []
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const scrolling = ref(false)

const text = computed(() => props.modelValue)

/** 字符数 */
const charCount = computed(() => text.value.length)

/** token 估算：默认 字符数/4（英文经验值），中文偏保守但方向对 */
const tokens = computed(() => {
  if (typeof props.tokenCount === 'function') return props.tokenCount(text.value)
  if (typeof props.tokenCount === 'number') return props.tokenCount
  return Math.ceil(text.value.length / 4)
})

/** 超限 */
const overLimit = computed(
  () => props.maxLength > 0 && charCount.value > props.maxLength
)

/** 可发送：有内容、不超限、不禁用 */
const canSend = computed(
  () => !props.disabled && text.value.trim().length > 0 && !overLimit.value
)

/** 自动增高：重置高度后按内容撑开，超过 maxRows 就滚动 */
async function autoResize() {
  const el = textareaRef.value
  if (!el) return
  await nextTick()
  el.style.height = 'auto'
  const lineHeight = 22
  const max = props.maxRows * lineHeight + 8
  const next = Math.min(el.scrollHeight, max)
  el.style.height = `${next}px`
  scrolling.value = el.scrollHeight > max
}

watch(
  () => props.modelValue,
  () => {
    autoResize()
  },
  { immediate: true }
)

function onInput(e: Event) {
  const v = (e.target as HTMLTextAreaElement).value
  // 超限时不再接收输入（而不是让用户输完再报错）
  if (props.maxLength > 0 && v.length > props.maxLength) return
  emit('update:modelValue', v)
}

function send() {
  if (!canSend.value) return
  emit('send', text.value)
}

/** Ctrl/⌘ + Enter 发送 */
function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    send()
  }
}
</script>

<template>
  <div
    class="dmk-prompt"
    :class="{ 'is-disabled': disabled, 'is-over': overLimit }"
  >
    <!-- 输入区 -->
    <div class="dmk-prompt__field">
      <textarea
        ref="textareaRef"
        class="dmk-prompt__textarea"
        :value="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="ariaLabel"
        :aria-invalid="overLimit || undefined"
        rows="1"
        @input="onInput"
        @keydown="onKeydown"
      />
    </div>

    <!-- 底部工具条 -->
    <div class="dmk-prompt__bar">
      <!-- 附加项（模型选择 / 工具 / 附件） -->
      <div class="dmk-prompt__extras">
        <slot name="extras" />
      </div>

      <div class="dmk-prompt__actions">
        <!-- 计数 -->
        <span
          v-if="showTokenCount || overLimit"
          class="dmk-prompt__count"
          :class="{ 'is-over': overLimit }"
          aria-live="polite"
        >
          <template v-if="overLimit">
            {{ charCount }} / {{ maxLength }}（已超出）
          </template>
          <template v-else>
            {{ tokens }} tokens
          </template>
        </span>

        <slot name="actions" />

        <button
          type="button"
          class="dmk-prompt__send"
          :class="{ 'is-ready': canSend }"
          :aria-disabled="!canSend"
          :disabled="disabled"
          @click="send"
        >{{ sendText }}</button>
      </div>
    </div>

    <!-- 底部提示 -->
    <div v-if="hint || $slots.footer" class="dmk-prompt__hint">
      <span v-if="hint">{{ hint }}</span>
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.dmk-prompt {
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  padding: 8px 10px 8px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dmk-prompt:focus-within {
  border-color: var(--dmk-color-primary);
  box-shadow: 0 0 0 3px var(--dmk-color-primary-subtle);
}

.dmk-prompt.is-over {
  border-color: var(--dmk-color-danger);
}

.dmk-prompt.is-disabled {
  opacity: 0.6;
}

.dmk-prompt__field {
  display: flex;
}

.dmk-prompt__textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font-family: inherit;
  font-size: var(--dmk-font-base);
  line-height: 22px;
  color: var(--dmk-text-primary);
  padding: 4px 2px;
  overflow-y: auto;
}

.dmk-prompt__textarea::placeholder {
  color: var(--dmk-text-tertiary);
}

/* —— 底部工具条 —— */
.dmk-prompt__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
}

.dmk-prompt__extras {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.dmk-prompt__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.dmk-prompt__count {
  font-size: 12px;
  color: var(--dmk-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.dmk-prompt__count.is-over {
  color: var(--dmk-color-danger);
}

.dmk-prompt__send {
  border: 1px solid var(--dmk-color-border);
  background: var(--dmk-color-fill);
  color: var(--dmk-text-tertiary);
  border-radius: var(--dmk-radius-md);
  padding: 5px 16px;
  font-size: var(--dmk-font-sm);
  font-family: inherit;
  cursor: not-allowed;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.dmk-prompt__send.is-ready {
  background: var(--dmk-color-primary);
  border-color: var(--dmk-color-primary);
  color: var(--dmk-color-on-primary);
  cursor: pointer;
}

.dmk-prompt__send.is-ready:hover {
  filter: brightness(1.06);
}

.dmk-prompt__hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--dmk-text-tertiary);
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
